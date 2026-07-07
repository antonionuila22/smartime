import type { Metadata } from 'next'
import Link from 'next/link'
import React, { Suspense } from 'react'
import { Check, Search, SlidersHorizontal, X } from 'lucide-react'

import { ProductCard } from '@/components/ProductCard'
import { SortSelect } from '@/components/SortSelect'
import { cn } from '@/utilities/ui'
import { getCategory, listCategories, listProducts } from '@/lib/medusa/data'
import type { ViewProduct } from '@/lib/medusa/types'

// Cache Components (PPR): la página depende de `searchParams` (filtros/búsqueda) → contenido
// DINÁMICO que se transmite dentro de <Suspense>. El shell (skeleton) se prerenderiza y se
// envía al instante; los resultados llegan en streaming. Los datos de catálogo salen de la
// capa CACHEADA (lib/medusa/data.ts), así que el streaming no paga la query lenta a la DB.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const sp = await searchParams
  const q = sp.q?.trim()
  const cat = sp.categoria ? await getCategory(sp.categoria).catch(() => null) : null

  // Título dinámico: categoría > búsqueda > genérico. La plantilla añade "— smartime".
  const title = cat?.name ?? (q ? `Resultados para "${q}"` : 'Tienda')

  // Canónica: consolida las variantes por FILTRO (orden/precio/marca) en la URL base o de
  // categoría, para no indexar cada combinación de query. Las BÚSQUEDAS (?q= sin categoría) son
  // páginas finas → noindex,follow (se rastrea, no se indexa).
  const canonical = cat ? `/tienda?categoria=${cat.handle ?? cat.id}` : '/tienda'
  const isBareSearch = !!q && !cat

  return {
    title,
    description: cat
      ? `${cat.name} en smartime, con garantía y envío a todo Honduras. Precios en Lempiras.`
      : 'Explora todos los productos de smartime: Apple, audio, gaming, hogar y más. Precios en Lempiras.',
    alternates: { canonical },
    ...(isBareSearch ? { robots: { index: false, follow: true } } : {}),
  }
}

const PRICE_BUCKETS = [
  { key: '0-20000', label: 'Menos de L 20,000', min: 0, max: 20000 },
  { key: '20000-35000', label: 'L 20,000 – L 35,000', min: 20000, max: 35000 },
  { key: '35000-50000', label: 'L 35,000 – L 50,000', min: 35000, max: 50000 },
  { key: '50000-', label: 'Más de L 50,000', min: 50000, max: Number.POSITIVE_INFINITY },
]

type SearchParams = Promise<{
  categoria?: string
  q?: string
  orden?: string
  precio?: string
  oferta?: string
  marca?: string
}>

export default function TiendaPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<TiendaSkeleton />}>
      <TiendaResults searchParams={searchParams} />
    </Suspense>
  )
}

/** Shell estático mientras se resuelven los filtros y llegan los resultados. */
function TiendaSkeleton() {
  return (
    <div className="container py-10 md:py-12">
      <div className="mb-6 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-2xl border border-border bg-card lg:block" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    </div>
  )
}

async function TiendaResults({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams

  // `listCategories` no depende de la categoría activa → en paralelo con la resolución de esta
  // (recomendación Next 16). `listProducts` sí depende de `activeCat`, así que va después.
  const [categories, activeCat] = await Promise.all([
    listCategories().catch(() => []),
    sp.categoria ? getCategory(sp.categoria) : Promise.resolve(null),
  ])

  let products = await listProducts({
    categoryId: activeCat?.id,
    q: sp.q?.trim() || undefined,
    limit: 100,
  }).catch((): ViewProduct[] => [])

  // Marcas disponibles (en el set de categoría+búsqueda, antes de filtrar por marca)
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort() as string[]

  // Facetas server-side (datos reales)
  if (sp.marca) products = products.filter((p) => p.brand === sp.marca)
  const bucket = PRICE_BUCKETS.find((b) => b.key === sp.precio)
  if (bucket) products = products.filter((p) => p.price >= bucket.min && p.price < bucket.max)
  if (sp.oferta) products = products.filter((p) => p.originalPrice != null)

  switch (sp.orden) {
    case 'precio-asc':
      products = [...products].sort((a, b) => a.price - b.price)
      break
    case 'precio-desc':
      products = [...products].sort((a, b) => b.price - a.price)
      break
    case 'rating':
      products = [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      break
  }

  // Helper para construir hrefs preservando filtros
  const base = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) if (v) base.set(k, String(v))
  const hrefWith = (changes: Record<string, string | null>) => {
    const p = new URLSearchParams(base.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) p.delete(k)
      else p.set(k, v)
    }
    const qs = p.toString()
    return qs ? `/tienda?${qs}` : '/tienda'
  }

  const heading = sp.q ? 'Resultados de búsqueda' : activeCat ? activeCat.name : 'Tienda'
  const hasFilters = Boolean(sp.q || sp.categoria || sp.precio || sp.oferta)

  const chips: { label: string; href: string }[] = []
  if (sp.q) chips.push({ label: `«${sp.q}»`, href: hrefWith({ q: null }) })
  if (activeCat) chips.push({ label: activeCat.name, href: hrefWith({ categoria: null }) })
  if (sp.marca) chips.push({ label: sp.marca, href: hrefWith({ marca: null }) })
  if (bucket) chips.push({ label: bucket.label, href: hrefWith({ precio: null }) })
  if (sp.oferta) chips.push({ label: 'En oferta', href: hrefWith({ oferta: null }) })

  const facetLink = (active: boolean) =>
    cn(
      'flex items-center justify-between gap-2 rounded-full px-3 py-1.5 text-sm transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      active
        ? 'bg-primary/10 font-semibold text-primary'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
    )

  return (
    <div className="container py-10 md:py-12">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Catálogo</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
        <p className="mt-1 text-muted-foreground">
          <span className="tabular-nums">{products.length}</span> producto
          {products.length === 1 ? '' : 's'}
          {sp.q ? ` para «${sp.q}»` : ''}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Facetas — en móvil van después de los resultados para no empujarlos bajo el fold */}
        <aside className="order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden />
              Filtros
            </h2>

            <div className="mt-4 divide-y divide-border">
              <section className="pb-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Categorías
                </h3>
                <div className="space-y-0.5">
                  <Link href={hrefWith({ categoria: null })} className={facetLink(!activeCat)}>
                    Todas
                    {!activeCat && <Check className="size-3.5 shrink-0" aria-hidden />}
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={hrefWith({ categoria: c.handle ?? c.id })}
                      className={facetLink(activeCat?.id === c.id)}
                    >
                      {c.name}
                      {activeCat?.id === c.id && <Check className="size-3.5 shrink-0" aria-hidden />}
                    </Link>
                  ))}
                </div>
              </section>

              {brands.length > 0 && (
                <section className="py-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Marca
                  </h3>
                  <div className="space-y-0.5">
                    {brands.map((b) => (
                      <Link
                        key={b}
                        href={hrefWith({ marca: sp.marca === b ? null : b })}
                        className={facetLink(sp.marca === b)}
                      >
                        {b}
                        {sp.marca === b && <Check className="size-3.5 shrink-0" aria-hidden />}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="py-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Precio
                </h3>
                <div className="space-y-0.5">
                  {PRICE_BUCKETS.map((b) => {
                    const active = sp.precio === b.key
                    return (
                      <Link
                        key={b.key}
                        href={hrefWith({ precio: active ? null : b.key })}
                        className={facetLink(active)}
                      >
                        {b.label}
                        {active && <Check className="size-3.5 shrink-0" aria-hidden />}
                      </Link>
                    )
                  })}
                </div>
              </section>

              <section className="py-5 last:pb-0">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ofertas
                </h3>
                <Link
                  href={hrefWith({ oferta: sp.oferta ? null : '1' })}
                  className={facetLink(!!sp.oferta)}
                >
                  Solo productos en oferta
                  {!!sp.oferta && <Check className="size-3.5 shrink-0" aria-hidden />}
                </Link>
              </section>

              {hasFilters && (
                <div className="pt-5">
                  <Link
                    href="/tienda"
                    className="flex items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-primary transition-colors duration-300 hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <X className="size-3.5" aria-hidden /> Limpiar filtros
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Resultados */}
        <div className="order-1 lg:order-2">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {chips.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground">Filtros:</span>
              )}
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  aria-label={`Quitar filtro ${chip.label}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors duration-300 hover:border-primary/40 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {chip.label}
                  <X className="size-3.5" aria-hidden />
                </Link>
              ))}
            </div>
            <SortSelect />
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-accent text-muted-foreground">
                <Search className="size-6" aria-hidden />
              </div>
              <p className="mt-4 text-lg font-semibold text-foreground">No encontramos productos</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Prueba con otra búsqueda o quita algún filtro para ver más resultados.
              </p>
              <Link
                href="/tienda"
                className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Ver todo el catálogo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
