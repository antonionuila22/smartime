'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCart } from '@/providers/Cart'
import { medusa } from '@/lib/medusa/sdk'
import { formatPrice } from '@/utilities/format'

export default function CarritoPage() {
  const { cart, count, total, updateItem, removeItem, ready, loading } = useCart()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    medusa.store.customer
      .retrieve()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
  }, [])

  if (!ready) {
    return (
      <div className="container py-12">
        <div className="mb-8 h-9 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-72 animate-pulse rounded-xl border bg-card" />
          <div className="h-64 animate-pulse rounded-xl border bg-card" />
        </div>
      </div>
    )
  }

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="size-8" strokeWidth={1.5} />
          </div>
          <h1 className="mt-5 text-2xl md:text-3xl font-bold tracking-tight">
            Tu carrito está vacío
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Descubre nuestros Mac y iPhone originales y añade productos para empezar.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full">
            <Link href="/tienda">Ir a la tienda</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-2xl md:text-3xl font-bold tracking-tight">Carrito</h1>
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

              <div className="flex items-center rounded-full border">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => updateItem(item.id, item.quantity - 1)}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                  aria-label="Restar"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-9 text-center text-sm font-medium tabular-nums">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => updateItem(item.id, item.quantity + 1)}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
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
                className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                aria-label="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
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
          <div className="mt-4 flex items-baseline justify-between border-t pt-4 font-bold">
            <span className="text-base">Total</span>
            <span className="text-xl text-foreground">{formatPrice(total)}</span>
          </div>
          {authed === false ? (
            <>
              <Button asChild size="lg" className="mt-6 w-full rounded-full">
                <Link href="/registro?redirect=/checkout">Crear cuenta y finalizar</Link>
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Tu carrito se guarda al registrarte ·{' '}
                <Link
                  href="/login?redirect=/checkout"
                  className="font-medium text-primary hover:underline"
                >
                  ya tengo cuenta
                </Link>
              </p>
            </>
          ) : (
            <Button asChild size="lg" className="mt-6 w-full rounded-full">
              <Link href="/checkout">Tramitar pedido</Link>
            </Button>
          )}
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
