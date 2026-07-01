import Link from 'next/link'
import React from 'react'
import { Package } from 'lucide-react'

export type CatTile = {
  name: string
  href: string
  image?: string | null
  count: number
}

export const CategoryGrid: React.FC<{ categories: CatTile[] }> = ({ categories }) => {
  if (!categories.length) return null
  return (
    <section className="container py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Explora por categoría</h2>
        <Link
          href="/tienda"
          className="rounded-full text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Ver todo
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.name}
            href={c.href}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="grid h-24 w-full place-items-center overflow-hidden rounded-xl bg-white p-2">
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <Package className="size-10 text-primary/25" strokeWidth={1.25} aria-hidden />
              )}
            </div>
            <div>
              <p className="font-semibold leading-tight transition-colors group-hover:text-primary">
                {c.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.count} {c.count === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
