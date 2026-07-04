'use client'

import React, { useState } from 'react'
import { Laptop, Package, Smartphone } from 'lucide-react'

import { cn } from '@/utilities/ui'

type Img = { url: string; alt?: string }

export const ProductGallery: React.FC<{
  images: Img[]
  title: string
  kind?: 'mac' | 'iphone' | 'other'
}> = ({ images, title, kind = 'other' }) => {
  const [active, setActive] = useState(0)

  if (!images.length) {
    const Icon = kind === 'iphone' ? Smartphone : kind === 'mac' ? Laptop : Package
    // Estado vacío cuidado: icono según el tipo de producto + nota discreta
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10">
        <Icon className="size-24 text-primary/30" strokeWidth={1} />
        <span className="text-sm text-muted-foreground">Imagen no disponible</span>
      </div>
    )
  }

  const main = images[active] ?? images[0]

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Imagen principal con zoom sutil en hover y contador discreto */}
      <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-white p-6 transition-colors duration-300 hover:border-primary/40 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={main.url}
          alt={main.alt || title}
          className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {images.length > 1 && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white"
          >
            {active + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                i === active
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-border opacity-70 hover:border-primary/40 hover:opacity-100',
              )}
              aria-label={`Ver imagen ${i + 1} de ${images.length}`}
              aria-current={i === active ? 'true' : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full bg-white object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
