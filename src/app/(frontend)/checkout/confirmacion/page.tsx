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
  'id,display_id,status,total,subtotal,shipping_total,currency_code,email,metadata,created_at,' +
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
      <div className="container grid min-h-[50vh] place-items-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (state === 'error' || !order) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">No encontramos el pedido</h1>
        <p className="mt-2 text-muted-foreground">Revisa tus pedidos en tu cuenta.</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/cuenta">Ir a mi cuenta</Link>
        </Button>
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
    <div className="container max-w-2xl py-12">
      <div className="rounded-2xl border bg-card p-8 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-in-stock/10 text-in-stock">
          <CheckCircle2 className="size-9" />
        </div>
        <h1 className="mt-5 text-2xl md:text-3xl font-bold tracking-tight">¡Gracias por tu compra!</h1>
        <p className="mt-2 text-muted-foreground">
          Tu pedido <span className="font-semibold text-foreground">#{order.display_id}</span> está
          confirmado. Te enviamos un correo a {order.email}.
        </p>
        {eta && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <Package className="size-4" /> {eta.label}
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(order.items ?? []).map((item: any) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-muted-foreground">
                {item.product_title || item.title}
                {item.quantity > 1 ? ` × ${item.quantity}` : ''}
              </span>
              <span className="shrink-0 font-medium">{formatPrice(item.total)}</span>
            </li>
          ))}
        </ul>
        {method && (
          <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
            Envío: <span className="font-medium text-foreground">{method.name}</span>
          </p>
        )}
        <div className="mt-2 flex items-baseline justify-between border-t pt-4 font-bold">
          <span>Total</span>
          <span className="text-xl">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/cuenta">Ver mis pedidos</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link href="/tienda">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
