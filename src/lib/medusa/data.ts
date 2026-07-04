import { cacheLife, cacheTag } from 'next/cache'

import { medusa } from './sdk'
import type { ReviewItem, ViewProduct } from './types'

const PRODUCT_FIELDS =
  '*variants.calculated_price,*categories,*images,+thumbnail,+metadata,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder'

/**
 * Capa de datos con CACHE COMPONENTS (Next 16). La DB es remota (~168ms/round-trip; un
 * listado de productos ≈1.3s), así que las lecturas de catálogo se marcan con la directiva
 * `'use cache'`: su resultado entra en el shell estático (prerender) y se revalida en segundo
 * plano según `cacheLife`. `cacheTag` permite invalidar bajo demanda (revalidateTag/updateTag)
 * desde un webhook del admin cuando cambien productos/precios.
 *
 * Reglas Cache Components: dentro de `'use cache'` NO se accede a cookies/headers/searchParams;
 * los argumentos y el valor de retorno deben ser serializables (aquí, primitivos y objetos
 * planos ViewProduct).
 */

/* ------------------------------- Región ------------------------------- */

/** Región Honduras (HNL). Cacheada (rara vez cambia). */
export async function getRegionId(): Promise<string | undefined> {
  'use cache'
  cacheLife('hours')
  cacheTag('regions')
  const { regions } = await medusa.store.region.list()
  const hn = regions.find((r) => r.currency_code === 'hnl') ?? regions[0]
  return hn?.id
}

/* ------------------------------ Categorías ---------------------------- */

/** Categorías de la tienda (Mac, iPhone…). Cacheadas. */
export async function listCategories() {
  'use cache'
  cacheLife('hours')
  cacheTag('categories')
  const { product_categories } = await medusa.store.category.list({
    fields: 'id,name,handle',
    limit: 50,
  })
  return product_categories
}

/** Deriva de `listCategories` (cacheada); no necesita caché propia. */
export async function getCategory(slugOrName: string) {
  const cats = await listCategories()
  return (
    cats.find(
      (c) =>
        c.handle === slugOrName ||
        c.name.toLowerCase() === slugOrName.toLowerCase() ||
        c.id === slugOrName,
    ) ?? null
  )
}

/* ------------------------------- Productos ---------------------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toViewProduct(p: any): ViewProduct {
  const variant = p.variants?.[0]
  const cp = variant?.calculated_price
  const price = cp?.calculated_amount ?? 0
  const meta = p.metadata || {}
  const metaCompare = Number(meta.compare_at_price) || 0
  const calcOriginal = cp?.original_amount && cp.original_amount > price ? cp.original_amount : null
  const originalPrice = calcOriginal ?? (metaCompare > price ? metaCompare : null)
  const images: string[] = (p.images || []).map((i: any) => i.url).filter(Boolean)
  // Disponibilidad real a partir de la 1ª variante: hay stock si no se rastrea inventario,
  // si admite backorder, o si la cantidad disponible es > 0. `stock` solo es un número cuando
  // el inventario se rastrea sin backorder; en cualquier otro caso es null (ilimitado/no rastreado).
  const inStock =
    !variant?.manage_inventory ||
    variant?.allow_backorder ||
    (Number(variant?.inventory_quantity) || 0) > 0
  const stock =
    variant?.manage_inventory && !variant?.allow_backorder
      ? Number(variant?.inventory_quantity) || 0
      : null
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    image: p.thumbnail || images[0] || null,
    images: images.length ? images : p.thumbnail ? [p.thumbnail] : [],
    price,
    originalPrice,
    currencyCode: cp?.currency_code || 'hnl',
    categoryName: p.categories?.[0]?.name ?? null,
    brand: typeof meta.brand === 'string' ? meta.brand : null,
    variantId: variant?.id ?? null,
    inStock,
    stock,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Listado de productos (con precio y reseñas). Cacheado por combinación de parámetros. */
export async function listProducts(
  params: { categoryId?: string; q?: string; limit?: number } = {},
): Promise<ViewProduct[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  const region_id = await getRegionId()
  const { products } = await medusa.store.product.list({
    region_id,
    fields: PRODUCT_FIELDS,
    limit: params.limit ?? 100,
    ...(params.categoryId ? { category_id: [params.categoryId] } : {}),
    ...(params.q ? { q: params.q } : {}),
  })
  const views = products.map(toViewProduct)
  const summaries = await getReviewSummaries(views.map((v) => v.id))
  for (const v of views) {
    const s = summaries[v.id]
    if (s) {
      v.rating = s.average
      v.reviewCount = s.count
    }
  }
  return views
}

/**
 * Producto por handle (cacheado). LANZA si no existe (o ante un fallo del backend) en vez de
 * devolver null: `'use cache'` NO memoriza una excepción, así un "no encontrado" transitorio
 * (p. ej. la DB tardó/falló un instante) no envenena la PDP durante todo el TTL. El caller
 * (getProductByHandle) lo convierte en null. Un 404 real vuelve a consultar (es raro y barato).
 */
async function fetchProductByHandle(handle: string): Promise<ViewProduct> {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  const region_id = await getRegionId()
  const { products } = await medusa.store.product.list({
    handle,
    region_id,
    fields: PRODUCT_FIELDS,
    limit: 1,
  })
  if (!products[0]) throw new Error(`PRODUCT_NOT_FOUND:${handle}`)
  const view = toViewProduct(products[0])
  const summaries = await getReviewSummaries([view.id])
  const s = summaries[view.id]
  if (s) {
    view.rating = s.average
    view.reviewCount = s.count
  }
  return view
}

/** Producto por handle para la PDP; `null` si no existe (sin cachear el negativo). */
export async function getProductByHandle(handle: string): Promise<ViewProduct | null> {
  return fetchProductByHandle(handle).catch(() => null)
}

/* ----------------------------- Reseñas ----------------------------- */

/** Resumen {average, count} por producto. Se consume dentro de listProducts/getProductByHandle
 *  (ya cacheados), por eso no lleva su propia directiva. */
export async function getReviewSummaries(
  ids: string[],
): Promise<Record<string, { average: number; count: number }>> {
  if (!ids.length) return {}
  try {
    const res = await medusa.client.fetch<{
      summaries: Record<string, { average: number; count: number }>
    }>('/store/review-summary', { query: { product_ids: ids.join(',') } })
    return res.summaries || {}
  } catch {
    return {}
  }
}

/** Reseñas aprobadas + promedio de un producto (para la PDP). Cacheado (TTL corto). */
export async function listProductReviews(
  productId: string,
): Promise<{ reviews: ReviewItem[]; count: number; average: number }> {
  'use cache'
  cacheLife('minutes')
  cacheTag('reviews')
  try {
    const res = await medusa.client.fetch<{
      reviews: ReviewItem[]
      count: number
      average_rating: number
    }>(`/store/products/${productId}/reviews`)
    return { reviews: res.reviews || [], count: res.count || 0, average: res.average_rating || 0 }
  } catch {
    return { reviews: [], count: 0, average: 0 }
  }
}
