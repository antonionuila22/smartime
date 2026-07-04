'use client'

import Link from 'next/link'
import React from 'react'
import { Heart } from 'lucide-react'

import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/providers/Wishlist'
import type { ViewProduct } from '@/lib/medusa/types'

export default function FavoritosPage() {
  const { items, count, ready } = useWishlist()

  if (!ready) {
    // Skeleton de carga (evita parpadeo antes de leer localStorage)
    return (
      <div className="container py-12 md:py-16">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-9 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center sm:px-10">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <Heart className="size-8" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Aún no tienes favoritos</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Toca el corazón en cualquier producto para guardarlo aquí y compararlo después.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full">
            <Link href="/tienda">Explorar la tienda</Link>
          </Button>
        </div>
      </div>
    )
  }

  const products: ViewProduct[] = items.map((i) => ({
    id: i.id,
    handle: i.handle,
    title: i.title,
    image: i.image ?? null,
    images: i.image ? [i.image] : [],
    price: i.price,
    currencyCode: 'hnl',
    variantId: i.variantId ?? null,
    inStock: true,
  }))

  return (
    <div className="container py-12 md:py-16">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
        <Heart className="size-3.5" aria-hidden="true" /> Guardados
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Mis favoritos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {count} {count === 1 ? 'producto guardado' : 'productos guardados'}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
