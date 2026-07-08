import React from 'react'

import type { ViewProduct } from '@/lib/medusa/types'

import { ProductCard } from '@/components/ProductCard'
import { CarouselTrack } from './CarouselTrack'

/**
 * SERVER component: renderiza el <section> y las tarjetas (ProductCard, también server) en el
 * servidor, y delega SOLO el scroll interactivo a la isla cliente `CarouselTrack`. Antes este
 * componente era `'use client'`, lo que empujaba todo el subárbol de ProductCard al cliente.
 */
export const ProductCarousel: React.FC<{
  title: string
  viewAllHref?: string
  products: ViewProduct[]
}> = ({ title, viewAllHref, products }) => {
  if (!products.length) return null

  return (
    <section className="container py-12 md:py-16">
      <CarouselTrack title={title} viewAllHref={viewAllHref}>
        {products.map((p) => (
          <div key={p.id} className="w-[220px] shrink-0 snap-start sm:w-[250px]">
            <ProductCard product={p} className="h-full" />
          </div>
        ))}
      </CarouselTrack>
    </section>
  )
}
