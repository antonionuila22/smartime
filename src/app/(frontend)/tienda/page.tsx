import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import { Search, X } from 'lucide-react'

import { ProductCard } from '@/components/ProductCard'
import { SortSelect } from '@/components/SortSelect'
import { cn } from '@/utilities/ui'
import { getCategory, listCategories, listProducts } from '@/lib/medusa/data'
import type { ViewProduct } from '@/lib/medusa/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tienda — smartime',
  description: 'Explora todos los productos Apple (Mac y iPhone) de smartime. Precios en Lempiras.',
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

export default async function TiendaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams

  const categories = await listCategories().catch(() => [])
  const activeCat = sp.categoria ? await getCategory(sp.categoria) : null

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
      'block rounded-lg px-3 py-1.5 text-sm transition-colors',
      active ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-accent',
    )

  return (
    <div className="container py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
        <p className="mt-1 text-muted-foreground">
          {products.length} producto{products.length === 1 ? '' : 's'}
          {sp.q ? ` para «${sp.q}»` : ''}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Facetas */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6 rounded-2xl border border-border bg-card p-5">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categorías
              </h3>
              <div className="space-y-0.5">
                <Link href={hrefWith({ categoria: null })} className={facetLink(!activeCat)}>
                  Todas
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={hrefWith({ categoria: c.handle ?? c.id })}
                    className={facetLink(activeCat?.id === c.id)}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            {brands.length > 0 && (
              <div>
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
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
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
                    </Link>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ofertas
              </h3>
              <Link href={hrefWith({ oferta: sp.oferta ? null : '1' })} className={facetLink(!!sp.oferta)}>
                Solo productos en oferta
              </Link>
            </div>

            {hasFilters && (
              <Link
                href="/tienda"
                className="flex items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
              >
                <X className="size-3.5" /> Limpiar filtros
              </Link>
            )}
          </div>
        </aside>

        {/* Resultados */}
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {chips.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground">Filtros:</span>
              )}
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {chip.label}
                  <X className="size-3.5" />
                </Link>
              ))}
            </div>
            <SortSelect />
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-accent text-muted-foreground">
                <Search className="size-6" />
              </div>
              <p className="mt-4 text-lg font-semibold text-foreground">No encontramos productos</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Prueba con otra búsqueda o quita algún filtro para ver más resultados.
              </p>
              <Link
                href="/tienda"
                className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
