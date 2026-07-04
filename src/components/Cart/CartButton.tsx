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
      className="group flex min-h-10 items-center gap-2.5 rounded-full border border-input px-3 py-2 transition duration-300 hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label={
        ready && count > 0
          ? `Carrito, ${count} ${count === 1 ? 'artículo' : 'artículos'}`
          : 'Carrito'
      }
    >
      <span className="relative">
        <ShoppingCart className="size-5 text-primary" />
        {ready && count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none tabular-nums text-primary-foreground ring-2 ring-background"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      <span className="hidden flex-col leading-none sm:flex">
        <span className="text-[11px] text-muted-foreground">Carrito</span>
        <span className="text-sm font-semibold tabular-nums">
          {ready ? formatPrice(total) : '—'}
        </span>
      </span>
    </Link>
  )
}
