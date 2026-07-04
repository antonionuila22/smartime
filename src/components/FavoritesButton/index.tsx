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
      className="group relative grid size-10 place-items-center rounded-full border border-input transition duration-300 hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Favoritos${ready && count > 0 ? ` (${count})` : ''}`}
    >
      <Heart className="size-5 text-primary transition duration-300 group-hover:scale-110" aria-hidden />
      {ready && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
          {count}
        </span>
      )}
    </Link>
  )
}
