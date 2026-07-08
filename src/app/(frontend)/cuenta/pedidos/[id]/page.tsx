'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, CreditCard, MapPin, Package, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { medusa } from '@/lib/medusa/sdk'
import { resolveOrderEta } from '@/utilities/eta'
import { formatPrice } from '@/utilities/format'
import { orderState, toneClasses } from '@/utilities/orderStatus'

/* eslint-disable @typescript-eslint/no-explicit-any */

const ORDER_FIELDS =
  'id,display_id,status,payment_status,fulfillment_status,created_at,email,metadata,' +
  'total,subtotal,shipping_total,tax_total,currency_code,' +
  '*items,*shipping_address,*shipping_methods,*shipping_methods.shipping_option'

const dateFmt = new Intl.DateTimeFormat('es-HN', { day: 'numeric', month: 'long', year: 'numeric' })

/** Estado de pago de Medusa → etiqueta legible en español. */
const PAYMENT_LABELS: Record<string, string> = {
  captured: 'Pagado',
  partially_captured: 'Pago parcial',
  authorized: 'Autorizado',
  partially_authorized: 'Autorizado parcialmente',
  awaiting: 'Pendiente de pago',
  not_paid: 'Pendiente de pago',
  refunded: 'Reembolsado',
  partially_refunded: 'Reembolso parcial',
  canceled: 'Cancelado',
  requires_action: 'Requiere acción',
}

export default function PedidoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : params.id?.[0]
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    // El backend exige cliente autenticado Y dueño del pedido (anti-IDOR en
    // medusa/src/api/middlewares.ts): 401 sin sesión, 404 si el pedido es de otro.
    // En cualquier fallo volvemos a /cuenta, que a su vez redirige a /login si no hay sesión.
    medusa.store.order
      .retrieve(id, { fields: ORDER_FIELDS })
      .then(({ order }) => setOrder(order))
      .catch(() => router.replace('/cuenta'))
  }, [id, router])

  if (!order)
    return (
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-6 h-64 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="mt-6 h-40 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    )

  const st = orderState(order)
  const method = order.shipping_methods?.[0]
  const address = order.shipping_address
  const delivered = order.fulfillment_status === 'delivered'
  const created = new Date(order.created_at)
  // Cadena de ETA centralizada (metadata congelada → opción de envío → nombre del método).
  const eta = resolveOrderEta(order)
  const paymentLabel = PAYMENT_LABELS[order.payment_status] ?? 'Procesando'

  return (
    <div className="container py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/cuenta"
          className="inline-flex items-center gap-1.5 rounded-full text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver a mis pedidos
        </Link>

        {/* Cabecera */}
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detalle del pedido
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">
              Pedido #{order.display_id}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{dateFmt.format(created)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses(st.tone)}`}>
            {st.label}
          </span>
        </div>

        {/* Línea de entrega */}
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/20">
          <Truck className="size-4 shrink-0" aria-hidden="true" />
          {delivered ? 'Entregado' : eta ? eta.label : method?.name || 'Envío por confirmar'}
        </p>

        {/* Artículos */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Package className="size-5 text-primary" aria-hidden="true" /> Artículos
          </h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {(order.items ?? []).map((item: any) => (
              <li key={item.id} className="flex justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.product_title || item.title}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </span>
                <span className="shrink-0 font-medium">{formatPrice(item.total)}</span>
              </li>
            ))}
          </ul>

          {/* Totales */}
          <dl className="mt-2 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío</dt>
              <dd>{formatPrice(order.shipping_total)}</dd>
            </div>
            {(order.tax_total ?? 0) > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ISV</dt>
                <dd>{formatPrice(order.tax_total)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-border pt-3 font-bold">
              <dt>Total</dt>
              <dd className="text-xl">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* Envío y pago */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6">
          {address && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <MapPin className="size-5 text-primary" aria-hidden="true" /> Dirección de envío
              </h2>
              <div className="mt-3 space-y-0.5 text-sm text-muted-foreground">
                {(address.first_name || address.last_name) && (
                  <p className="font-medium text-foreground">
                    {[address.first_name, address.last_name].filter(Boolean).join(' ')}
                  </p>
                )}
                {address.address_1 && <p>{address.address_1}</p>}
                {address.address_2 && <p>{address.address_2}</p>}
                {(address.city || address.province) && (
                  <p>{[address.city, address.province].filter(Boolean).join(', ')}</p>
                )}
                {address.phone && <p>Tel: {address.phone}</p>}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <CreditCard className="size-5 text-primary" aria-hidden="true" /> Envío y pago
            </h2>
            <dl className="mt-3 divide-y divide-border text-sm">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">Método de envío</dt>
                <dd className="text-right font-medium">{method?.name || 'Por confirmar'}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">Estado de pago</dt>
                <dd className="text-right font-medium">{paymentLabel}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" variant="outline" className="flex-1 rounded-full">
            <Link href="/cuenta">
              <ArrowLeft className="size-4" aria-hidden="true" /> Volver a mis pedidos
            </Link>
          </Button>
          <Button asChild size="lg" className="flex-1 rounded-full">
            <Link href="/tienda">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
