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
          'grid size-8 place-items-center rounded-full bg-background/80 text-muted-foreground backdrop-blur transition',
        className,
      )}
    >
      <Heart
        className={cn(
          'size-4 transition',
          active ? 'fill-[#dc2626] text-[#dc2626]' : 'hover:text-[#dc2626]',
        )}
      />
    </button>
  )
}
