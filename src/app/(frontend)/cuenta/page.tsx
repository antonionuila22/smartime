'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Mail, Package, Truck, User as UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/account/LogoutButton'
import { medusa } from '@/lib/medusa/sdk'
import { etaForMethodName, etaFromOrderMetadata, etaFromShippingData } from '@/utilities/eta'
import { formatPrice } from '@/utilities/format'
import { orderState, toneClasses } from '@/utilities/orderStatus'

/* eslint-disable @typescript-eslint/no-explicit-any */

const ORDER_FIELDS =
  'id,display_id,status,payment_status,fulfillment_status,total,currency_code,created_at,metadata,' +
  '*items,*shipping_methods,*shipping_methods.shipping_option'

const dateFmt = new Intl.DateTimeFormat('es-HN', { day: 'numeric', month: 'long', year: 'numeric' })

export default function CuentaPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    medusa.store.customer
      .retrieve()
      .then(async ({ customer }) => {
        setCustomer(customer)
        setLoading(false)
        try {
          const { orders } = await medusa.store.order.list({ fields: ORDER_FIELDS, limit: 20 } as any)
          setOrders(orders as any[])
        } catch {
          setOrders([])
        }
      })
      .catch(() => router.replace('/login?redirect=/cuenta'))
  }, [router])

  if (loading)
    return (
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="size-14 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-52 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-8 h-40 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    )
  if (!customer) return null

  const name = customer.first_name || customer.email?.split('@')[0]

  return (
    <div className="container py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Cabecera de perfil */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
              <UserIcon className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Mi cuenta
              </p>
              <h1 className="mt-0.5 text-2xl md:text-3xl font-bold tracking-tight">
                Hola, {name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{customer.email}</span>
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>

        {/* Mis pedidos */}
        <section className="mt-10 md:mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Package className="size-5 text-primary" aria-hidden="true" /> Mis pedidos
            </h2>
            {orders !== null && orders.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            )}
          </div>

          {orders === null ? (
            <div className="mt-4 space-y-4">
              <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
              <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Package className="size-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm font-medium">Aún no tienes pedidos</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cuando compres algo, aquí verás su estado y fecha de entrega.
              </p>
              <Button asChild variant="outline" className="mt-5 rounded-full">
                <Link href="/tienda">Ir a comprar</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {orders.map((order) => {
                const st = orderState(order)
                const method = order.shipping_methods?.[0]
                const delivered = order.fulfillment_status === 'delivered'
                const created = new Date(order.created_at)
                const etaData =
                  method?.data && Object.keys(method.data).length
                    ? method.data
                    : method?.shipping_option?.data
                const eta =
                  // 1) ETA congelada en el pedido (autoritativa, no se mueve)
                  etaFromOrderMetadata(order.metadata) ??
                  // 2) data de la opción de envío (relativa a la fecha del pedido)
                  (etaData ? etaFromShippingData(etaData, created) : null) ??
                  // 3) último recurso: por nombre del método
                  etaForMethodName(method?.name, created)
                const itemCount = (order.items ?? []).reduce((s: number, i: any) => s + (i.quantity || 0), 0)
                return (
                  <li
                    key={order.id}
                    className="rounded-2xl border border-border bg-card p-5 transition duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/cuenta/pedidos/${order.id}`}
                          className="rounded-sm font-semibold transition-colors duration-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          Pedido #{order.display_id}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {dateFmt.format(new Date(order.created_at))} · {itemCount}{' '}
                          {itemCount === 1 ? 'artículo' : 'artículos'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses(st.tone)}`}
                      >
                        {st.label}
                      </span>
                    </div>

                    <ul className="mt-3 space-y-1 text-sm">
                      {(order.items ?? []).slice(0, 3).map((item: any) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span className="min-w-0 truncate text-muted-foreground">
                            {item.product_title || item.title}
                            {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                          </span>
                          <span className="shrink-0">{formatPrice(item.total)}</span>
                        </li>
                      ))}
                      {(order.items?.length ?? 0) > 3 && (
                        <li className="text-xs text-muted-foreground">
                          y {order.items.length - 3} más…
                        </li>
                      )}
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Truck className="size-4 shrink-0 text-primary/70" aria-hidden="true" />
                        {delivered
                          ? 'Entregado'
                          : eta
                            ? eta.label
                            : method?.name || 'Envío por confirmar'}
                      </span>
                      <span className="text-base font-bold">{formatPrice(order.total)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Datos de la cuenta */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <UserIcon className="size-5 text-primary" aria-hidden="true" /> Datos de la cuenta
          </h2>
          <dl className="mt-3 divide-y divide-border text-sm">
            <div className="flex justify-between gap-3 py-2.5">
              <dt className="text-muted-foreground">Nombre</dt>
              <dd className="min-w-0 truncate font-medium">{name}</dd>
            </div>
            <div className="flex justify-between gap-3 py-2.5">
              <dt className="text-muted-foreground">Correo</dt>
              <dd className="min-w-0 truncate font-medium">{customer.email}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
