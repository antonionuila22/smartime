import { unstable_cache } from 'next/cache'

import { medusa } from './sdk'
import type { ReviewItem, ViewProduct } from './types'

const PRODUCT_FIELDS = '*variants.calculated_price,*categories,*images,+thumbnail,+metadata'

/**
 * CACHÉ ISR — la DB es remota (~168ms/round-trip; un listado de productos ≈1.3s). Para que el
 * storefront no pague esa latencia en CADA visita, los lecturas de catálogo se cachean de forma
 * PERSISTENTE con `unstable_cache`: la query lenta se ejecuta una vez y se revalida en segundo
 * plano cada `REVALIDATE`. Se etiquetan (`tags`) para poder invalidar bajo demanda (revalidateTag)
 * desde un webhook del admin cuando cambien productos/precios.
 */
const REVALIDATE = 3600 // catálogo: 1 hora
const REVALIDATE_REVIEWS = 600 // reseñas: 10 min

/* ------------------------------- Región ------------------------------- */

async function fetchRegionId(): Promise<string | undefined> {
  const { regions } = await medusa.store.region.list()
  const hn = regions.find((r) => r.currency_code === 'hnl') ?? regions[0]
  return hn?.id
}

/** Región Honduras (HNL). Cacheada (rara vez cambia). */
export const getRegionId = unstable_cache(fetchRegionId, ['region-id'], {
  revalidate: REVALIDATE,
  tags: ['regions'],
})

/* ------------------------------ Categorías ---------------------------- */

async function fetchCategories() {
  const { product_categories } = await medusa.store.category.list({
    fields: 'id,name,handle',
    limit: 50,
  })
  return product_categories
}

/** Categorías de la tienda (Mac, iPhone…). Cacheadas. */
export const listCategories = unstable_cache(fetchCategories, ['categories'], {
  revalidate: REVALIDATE,
  tags: ['categories'],
})

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
    inStock: true,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchProducts(
  params: { categoryId?: string; q?: string; limit?: number } = {},
): Promise<ViewProduct[]> {
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

/** Listado de productos (con precio y reseñas). Cacheado por combinación de parámetros. */
export const listProducts = unstable_cache(fetchProducts, ['products'], {
  revalidate: REVALIDATE,
  tags: ['products'],
})

async function fetchProductByHandle(handle: string): Promise<ViewProduct | null> {
  const region_id = await getRegionId()
  const { products } = await medusa.store.product.list({
    handle,
    region_id,
    fields: PRODUCT_FIELDS,
    limit: 1,
  })
  if (!products[0]) return null
  const view = toViewProduct(products[0])
  const summaries = await getReviewSummaries([view.id])
  const s = summaries[view.id]
  if (s) {
    view.rating = s.average
    view.reviewCount = s.count
  }
  return view
}

/** Producto por handle (para la PDP). Cacheado por handle. */
export const getProductByHandle = unstable_cache(fetchProductByHandle, ['product-by-handle'], {
  revalidate: REVALIDATE,
  tags: ['products'],
})

/* ----------------------------- Reseñas ----------------------------- */

/** Resumen {average, count} por producto (para estrellas en tarjetas). No cacheado aparte:
 *  se consume dentro de `listProducts`/`getProductByHandle`, que ya están cacheados. */
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

async function fetchProductReviews(
  productId: string,
): Promise<{ reviews: ReviewItem[]; count: number; average: number }> {
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

/** Reseñas aprobadas + promedio de un producto (para la PDP). Cacheado (TTL corto). */
export const listProductReviews = unstable_cache(fetchProductReviews, ['product-reviews'], {
  revalidate: REVALIDATE_REVIEWS,
  tags: ['reviews'],
})
