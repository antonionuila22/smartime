'use client'

import Link from 'next/link'
import React from 'react'
import { ShoppingCart } from 'lucide-react'

import { useCart } from '@/providers/Cart'
import { formatPrice } from '@/utilities/format'

export const CartButton: React.FC = () => {
  const { count, total, ready } = useCart()

  return (
    <Link
      href="/carrito"
      className="group flex items-center gap-2.5 rounded-full border border-input px-3 py-2 transition hover:border-primary hover:bg-accent"
      aria-label="Carrito"
    >
      <span className="relative">
        <ShoppingCart className="size-5 text-primary" />
        {ready && count > 0 && (
          <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {count}
          </span>
        )}
      </span>
      <span className="hidden flex-col leading-none sm:flex">
        <span className="text-[11px] text-muted-foreground">Carrito</span>
        <span className="text-sm font-semibold">{ready ? formatPrice(total) : '—'}</span>
      </span>
    </Link>
  )
}
