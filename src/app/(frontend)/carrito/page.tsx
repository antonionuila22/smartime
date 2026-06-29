'use client'

import Link from 'next/link'
import React from 'react'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCart } from '@/providers/Cart'
import { formatPrice } from '@/utilities/format'

export default function CarritoPage() {
  const { cart, count, total, updateItem, removeItem, ready, loading } = useCart()

  if (!ready) {
    return <div className="container min-h-[40vh] py-20" />
  }

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-dashed py-16 text-center">
          <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Tu carrito está vacío</h1>
          <p className="mt-1 text-sm text-muted-foreground">Añade productos para empezar.</p>
          <Button asChild className="mt-6">
            <Link href="/tienda">Ir a la tienda</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Carrito</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 p-4">
              <Link
                href={item.product_handle ? `/producto/${item.product_handle}` : '/tienda'}
                className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border bg-white"
              >
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail}
                    alt={item.product_title || item.title}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <ShoppingBag className="size-6 text-muted-foreground" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.product_title || item.title}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(item.unit_price)}</p>
              </div>

              <div className="flex items-center rounded-lg border">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => updateItem(item.id, item.quantity - 1)}
                  className="grid size-9 place-items-center hover:bg-accent disabled:opacity-50"
                  aria-label="Restar"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-9 text-center text-sm tabular-nums">{item.quantity}</span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => updateItem(item.id, item.quantity + 1)}
                  className="grid size-9 place-items-center hover:bg-accent disabled:opacity-50"
                  aria-label="Sumar"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <div className="w-24 text-right font-semibold">{formatPrice(item.total)}</div>

              <button
                type="button"
                disabled={loading}
                onClick={() => removeItem(item.id)}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-[#dc2626] disabled:opacity-50"
                aria-label="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Artículos</dt>
              <dd>{count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío</dt>
              <dd className="text-muted-foreground">Se calcula en el checkout</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t pt-4 text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/checkout">Tramitar pedido</Link>
          </Button>
          <Link
            href="/tienda"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  )
}
