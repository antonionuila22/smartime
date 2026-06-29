'use client'

import Link from 'next/link'
import React from 'react'
import { Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCart } from '@/providers/Cart'
import { formatPrice } from '@/utilities/format'

export default function CheckoutPage() {
  const { cart, count, total, ready } = useCart()

  if (!ready) return <div className="container min-h-[40vh] py-20" />

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">No hay nada que pagar</h1>
        <Button asChild className="mt-6">
          <Link href="/tienda">Ir a la tienda</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Finalizar compra</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Datos de envío</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completa tus datos para recibir tu pedido en Honduras.
          </p>
          <div className="mt-6 rounded-lg border border-dashed bg-primary/5 p-6 text-center">
            <Lock className="mx-auto size-7 text-primary" />
            <p className="mt-3 font-medium">Pago con PayPal — en camino</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              El checkout seguro con PayPal (a través del módulo de pagos de Medusa) se activa en la
              siguiente fase. Tu carrito y tu pedido ya viven en Medusa.
            </p>
          </div>
        </div>

        <aside className="h-fit rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Tu pedido ({count})</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.product_title || item.title}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </span>
                <span className="shrink-0 font-medium">{formatPrice(item.total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-4 text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Button size="lg" className="mt-6 w-full" disabled>
            Pagar con PayPal (próximamente)
          </Button>
          <Link
            href="/carrito"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Volver al carrito
          </Link>
        </aside>
      </div>
    </div>
  )
}
