'use client'

import Link from 'next/link'
import React, { useRef } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * Isla CLIENTE del carrusel: solo la pista con scroll y los botones prev/next (necesitan el ref).
 * Las tarjetas (`children`) se renderizan en el SERVIDOR por `ProductCarousel` y se pasan aquí como
 * children, de modo que `ProductCard` (server component con islas propias) NO se arrastra entero al
 * cliente — solo hidratan sus verdaderas islas (AddToCart, WishlistButton, CuotaBadge).
 */
export const CarouselTrack: React.FC<{
  title: string
  viewAllHref?: string
  children: React.ReactNode
}> = ({ title, viewAllHref, children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="group/link inline-flex items-center gap-1 rounded-full text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Ver todo
              <ArrowRight className="size-4 transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scroll(-1)}
            aria-label="Productos anteriores"
            className="hidden rounded-full border-border transition-colors duration-300 hover:border-primary/40 md:inline-flex"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scroll(1)}
            aria-label="Productos siguientes"
            className="hidden rounded-full border-border transition-colors duration-300 hover:border-primary/40 md:inline-flex"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Pista con scroll-snap; scrollbar oculta también en WebKit */}
      <div
        ref={ref}
        className="flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </>
  )
}
