'use client'

import Link from 'next/link'
import React, { useRef } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

import type { ViewProduct } from '@/lib/medusa/types'

import { ProductCard } from '@/components/ProductCard'

export const ProductCarousel: React.FC<{
  title: string
  viewAllHref?: string
  products: ViewProduct[]
}> = ({ title, viewAllHref, products }) => {
  const ref = useRef<HTMLDivElement>(null)

  if (!products.length) return null

  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  return (
    <section className="container py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver todo <ArrowRight className="size-4" />
            </Link>
          )}
          <button
            onClick={() => scroll(-1)}
            aria-label="Anterior"
            className="hidden size-9 place-items-center rounded-full border transition hover:bg-accent md:grid"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Siguiente"
            className="hidden size-9 place-items-center rounded-full border transition hover:bg-accent md:grid"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[220px] shrink-0 snap-start sm:w-[250px]">
            <ProductCard product={p} className="h-full" />
          </div>
        ))}
      </div>
    </section>
  )
}
