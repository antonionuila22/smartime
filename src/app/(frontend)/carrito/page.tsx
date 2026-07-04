'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react'

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
      <div className="container py-12 md:py-16">
        <div className="h-3.5 w-24 animate-pulse rounded-full bg-muted" />
        <div className="mt-3 h-9 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    )
  }

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
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
    <div className="container py-12 md:py-16">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tu selección</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Carrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} {count === 1 ? 'artículo' : 'artículos'} listos para tramitar
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="h-fit divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 p-4 sm:p-5">
              <Link
                href={item.product_handle ? `/producto/${item.product_handle}` : '/tienda'}
                aria-label={`Ver ${item.product_title || item.title}`}
                className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white transition duration-300 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-snug">
                      {item.product_title || item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatPrice(item.unit_price)} c/u
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => removeItem(item.id)}
                    className="-mr-1 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition duration-300 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                    aria-label={`Eliminar ${item.product_title || item.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateItem(item.id, item.quantity - 1)}
                      className="grid size-10 place-items-center rounded-full text-muted-foreground transition duration-300 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                      aria-label="Restar una unidad"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      className="grid size-10 place-items-center rounded-full text-muted-foreground transition duration-300 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                      aria-label="Sumar una unidad"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <p className="font-semibold tabular-nums">{formatPrice(item.total)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold tracking-tight">Resumen del pedido</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Artículos</dt>
              <dd className="font-medium tabular-nums">{count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Envío</dt>
              <dd className="text-right text-muted-foreground">Se calcula en el checkout</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-base font-bold">Total</span>
            <span className="text-xl font-bold tabular-nums">{formatPrice(total)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">ISV incluido en el precio.</p>
          {authed === false ? (
            <>
              <Button asChild size="lg" className="mt-6 w-full rounded-full">
                <Link href="/registro?redirect=/checkout">Crear cuenta y finalizar</Link>
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Tu carrito se guarda al registrarte ·{' '}
                <Link
                  href="/login?redirect=/checkout"
                  className="rounded-sm font-medium text-primary transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  ya tengo cuenta
                </Link>
              </p>
            </>
          ) : (
            <Button asChild size="lg" className="mt-6 w-full rounded-full">
              <Link href="/checkout">Finalizar compra</Link>
            </Button>
          )}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> Pago protegido con PayPal
          </p>
          <Link
            href="/tienda"
            className="mt-3 block rounded-full py-1 text-center text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  )
}
