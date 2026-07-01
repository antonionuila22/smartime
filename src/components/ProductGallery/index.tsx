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
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10">
        <Icon className="size-24 text-primary/30" strokeWidth={1} />
      </div>
    )
  }

  const main = images[active] ?? images[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-white p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main.url} alt={main.alt || title} className="h-full w-full object-contain" />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border transition-all',
                i === active ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100',
              )}
              aria-label={`Imagen ${i + 1}`}
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
