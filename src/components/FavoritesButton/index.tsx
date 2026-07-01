'use client'

import Link from 'next/link'
import React from 'react'
import { Heart } from 'lucide-react'

import { useWishlist } from '@/providers/Wishlist'

export const FavoritesButton: React.FC = () => {
  const { count, ready } = useWishlist()

  return (
    <Link
      href="/favoritos"
      className="group relative grid size-10 place-items-center rounded-full border border-input transition hover:border-primary hover:bg-accent"
      aria-label={`Favoritos${ready && count > 0 ? ` (${count})` : ''}`}
    >
      <Heart className="size-5 text-primary transition group-hover:scale-110" />
      {ready && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
          {count}
        </span>
      )}
    </Link>
  )
}
