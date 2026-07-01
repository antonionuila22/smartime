'use client'

import React from 'react'
import { Heart } from 'lucide-react'

import { useWishlist, type WishItem } from '@/providers/Wishlist'
import { cn } from '@/utilities/ui'

export const WishlistButton: React.FC<{
  product: WishItem
  floating?: boolean
  className?: string
}> = ({ product, floating, className }) => {
  const { has, toggle, ready } = useWishlist()
  const active = ready && has(product.id)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(product)
      }}
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-pressed={active}
      className={cn(
        floating &&
          'grid size-9 place-items-center rounded-full border border-border/60 bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-all duration-200 hover:scale-105 hover:text-destructive hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 active:scale-95',
        className,
      )}
    >
      <Heart
        className={cn(
          'size-4 transition-all duration-200',
          active ? 'scale-110 fill-destructive text-destructive' : 'hover:text-destructive',
        )}
      />
    </button>
  )
}
