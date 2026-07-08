'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { medusa } from '@/lib/medusa/sdk'
import { etaForMethodName, etaFromOrderMetadata, etaFromShippingData } from '@/utilities/eta'
import { formatPrice } from '@/utilities/format'

/* eslint-disable @typescript-eslint/no-explicit-any */

const ORDER_FIELDS =
  // `original_item_total` = BRUTO de ítems antes de descuento (para que Subtotal reconcilie con el
  // Total tax-inclusive; `subtotal` es NETO de ISV). Ver checkout/page.tsx.
  'id,display_id,status,total,subtotal,original_item_total,discount_total,shipping_total,currency_code,email,metadata,created_at,' +
  '*items,*shipping_address,*shipping_methods,*shipping_methods.shipping_option'

export default function ConfirmacionPage() {
  const [order, setOrder] = useState<any>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('order')
    if (!id) {
      setState('error')
      return
    }
    medusa.store.order
      .retrieve(id, { fields: ORDER_FIELDS })
      .then(({ order }) => {
        setOrder(order)
        setState('ok')
      })
      .catch(() => setState('error'))
  }, [])

  if (state === 'loading') {
    return (
      <div className="container grid min-h-[50vh] place-items-center py-12 md:py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Confirmando tu pedido…</p>
        </div>
      </div>
    )
  }

  if (state === 'error' || !order) {
    return (
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
            <Package className="size-8" strokeWidth={1.5} />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">No encontramos el pedido</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Revisa tus pedidos en tu cuenta.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full">
            <Link href="/cuenta">Ir a mi cuenta</Link>
          </Button>
        </div>
      </div>
    )
  }

  const method = order.shipping_methods?.[0]
  // La ETA congelada (metadata.eta) puede no existir todavía: el subscriber `order.placed`
  // corre async y esta página se abre justo tras completar el pedido. El fallback se ancla a
  // la FECHA DEL PEDIDO (no a "ahora") con la misma lógica HN que el subscriber, así que la
  // fecha mostrada aquí coincide exactamente con la ETA congelada que se verá luego en /cuenta.
  const created = order.created_at ? new Date(order.created_at) : new Date()
  const eta =
    etaFromOrderMetadata(order.metadata) ??
    etaFromShippingData(
      method?.data && Object.keys(method.data).length ? method.data : method?.shipping_option?.data,
      created,
    ) ??
    etaForMethodName(method?.name, created)

  return (
    <div className="container max-w-2xl py-12 md:py-16">
      <div className="rounded-2xl border border-border bg-card p-8 text-center md:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-in-stock/10 text-in-stock ring-8 ring-in-stock/5">
          <CheckCircle2 className="size-8" strokeWidth={1.75} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-in-stock">
          Pedido confirmado
        </p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">
          ¡Gracias por tu compra!
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground md:text-base">
          Tu pedido <span className="font-semibold text-foreground">#{order.display_id}</span> está
          confirmado. Te enviamos un correo a{' '}
          <span className="font-medium text-foreground">{order.email}</span>.
        </p>
        {eta && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary">
            <Package className="size-4" aria-hidden="true" /> {eta.label}
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Resumen del pedido</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(order.items ?? []).map((item: any) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-muted-foreground">
                {item.product_title || item.title}
                {item.quantity > 1 ? ` × ${item.quantity}` : ''}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatPrice(item.original_total ?? item.total)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
          {(order.original_item_total ?? order.subtotal) != null && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">
                {formatPrice(order.original_item_total ?? order.subtotal)}
              </dd>
            </div>
          )}
          {(order.discount_total ?? 0) > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Descuento</dt>
              <dd className="font-medium tabular-nums text-in-stock">
                -{formatPrice(order.discount_total)}
              </dd>
            </div>
          )}
          {method && (
            <div className="flex justify-between gap-4">
              <dt className="min-w-0 truncate text-muted-foreground">
                Envío · <span className="text-foreground">{method.name}</span>
              </dt>
              <dd
                className={`shrink-0 font-medium tabular-nums ${
                  (order.shipping_total ?? 0) > 0 ? '' : 'text-in-stock'
                }`}
              >
                {(order.shipping_total ?? 0) > 0 ? formatPrice(order.shipping_total) : 'Gratis'}
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-base font-bold">Total</span>
          <span className="text-xl font-bold tabular-nums">{formatPrice(order.total)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">ISV incluido en el precio.</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1 rounded-full">
          <Link href="/cuenta">Ver mis pedidos</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1 rounded-full">
          <Link href="/tienda">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
