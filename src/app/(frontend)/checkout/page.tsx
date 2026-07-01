'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Check, Loader2, Lock, MapPin, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PayPalButton } from '@/components/checkout/PayPalButton'
import { useCart } from '@/providers/Cart'
import {
  type CheckoutAddress,
  addShipping,
  bindCartToCustomer,
  getCustomerOrNull,
  initPayment,
  listPaymentProviders,
  listShipping,
  retrieveCheckoutCart,
  setAddress as setCartAddress,
  completeCart,
} from '@/lib/medusa/checkout'
import { etaFromShippingData } from '@/utilities/eta'
import { formatPrice } from '@/utilities/format'

/* eslint-disable @typescript-eslint/no-explicit-any */

type Step = 'address' | 'shipping' | 'payment'

const EMPTY_ADDRESS: CheckoutAddress = {
  first_name: '',
  last_name: '',
  address_1: '',
  address_2: '',
  city: '',
  province: '',
  postal_code: '',
  phone: '',
  country_code: 'hn',
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart: miniCart, ready: cartReady, clear } = useCart()

  const [cart, setCart] = useState<any>(null)
  const [step, setStep] = useState<Step>('address')
  const [address, setAddress] = useState<CheckoutAddress>(EMPTY_ADDRESS)
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShip, setSelectedShip] = useState<string | null>(null)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [payment, setPayment] = useState<{ orderId: string; usd?: string; fx?: number } | null>(null)
  const [booting, setBooting] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cartId: string | undefined = miniCart?.id

  // Gate de cuenta + vinculación + carga del carrito de checkout.
  useEffect(() => {
    if (!cartReady) return
    let active = true
    ;(async () => {
      const customer = await getCustomerOrNull()
      if (!active) return
      if (!customer) {
        router.replace('/registro?redirect=/checkout')
        return
      }
      if (!cartId) {
        setBooting(false)
        return
      }
      try {
        await bindCartToCustomer(cartId, customer.email)
        const ck: any = await retrieveCheckoutCart(cartId)
        if (!active) return
        setCart(ck)
        // Prefill de dirección con datos del cliente / dirección previa.
        const prev = ck.shipping_address
        setAddress({
          ...EMPTY_ADDRESS,
          first_name: prev?.first_name || customer.first_name || '',
          last_name: prev?.last_name || customer.last_name || '',
          phone: prev?.phone || customer.phone || '',
          address_1: prev?.address_1 || '',
          address_2: prev?.address_2 || '',
          city: prev?.city || '',
          province: prev?.province || '',
          postal_code: prev?.postal_code || '',
          country_code: 'hn',
        })
        const provs = await listPaymentProviders(ck.region_id)
        const paypal = provs.find((p: any) => /paypal/i.test(p.id))
        setProviderId(paypal?.id ?? null)
      } catch (e: any) {
        setError(String(e?.message || e))
      } finally {
        if (active) setBooting(false)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartReady, cartId])

  const onSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cartId) return
    setBusy(true)
    setError(null)
    try {
      await setCartAddress(cartId, address)
      const opts = await listShipping(cartId)
      setShippingOptions(opts)
      setCart(await retrieveCheckoutCart(cartId))
      setStep('shipping')
    } catch (e: any) {
      setError('No pudimos guardar la dirección. Revisa los datos.')
    } finally {
      setBusy(false)
    }
  }

  const onChooseShipping = async (optionId: string) => {
    if (!cartId) return
    setSelectedShip(optionId)
    setBusy(true)
    setError(null)
    try {
      const opt = shippingOptions.find((o) => o.id === optionId)
      await addShipping(cartId, optionId, opt?.data)
      setCart(await retrieveCheckoutCart(cartId))
    } catch (e: any) {
      setError('No pudimos aplicar el método de envío.')
    } finally {
      setBusy(false)
    }
  }

  const onGoToPayment = async () => {
    if (!cartId || !providerId) {
      setError('No hay un método de pago disponible para tu región.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const ck = await retrieveCheckoutCart(cartId)
      const { cart: updated, session } = await initPayment(ck as any, providerId)
      setCart(updated)
      const data: any = session?.data || {}
      setPayment({ orderId: data.id, usd: data.usd_value, fx: data.fx_hnl_per_usd })
      setStep('payment')
    } catch (e: any) {
      setError('No pudimos iniciar el pago con PayPal. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const onPaid = async () => {
    if (!cartId) return
    setBusy(true)
    setError(null)
    try {
      const res: any = await completeCart(cartId)
      if (res?.type === 'order') {
        clear()
        router.push(`/checkout/confirmacion?order=${res.order.id}`)
        return // navegamos fuera; no reactivamos el botón
      }
      setError(res?.error?.message || 'No pudimos confirmar el pago. Tu carrito sigue intacto.')
      setBusy(false)
    } catch {
      // completeCart LANZA ante un fallo transitorio (red/500/JWT expirado) DESPUÉS de que PayPal
      // ya capturó. El backend es idempotente y auto-compensa, así que no hay doble cobro: en vez
      // de un callejón silencioso, dirigimos al cliente a su cuenta (donde verá el pedido si se creó).
      setError(
        'Tu pago se está procesando. Si no ves la confirmación en un momento, revisa "Mi cuenta" ' +
          'antes de volver a intentarlo.',
      )
      setBusy(false)
    }
  }

  if (!cartReady || booting) {
    return (
      <div className="container py-12">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-80 animate-pulse rounded-2xl border bg-card" />
          <div className="h-64 animate-pulse rounded-2xl border bg-card" />
        </div>
      </div>
    )
  }

  const items = cart?.items ?? []
  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">No hay nada que pagar</h1>
        <Button asChild size="lg" className="mt-6">
          <Link href="/tienda">Ir a la tienda</Link>
        </Button>
      </div>
    )
  }

  const total = cart?.total ?? 0
  const subtotal = cart?.subtotal ?? cart?.item_total ?? 0
  const shippingTotal = cart?.shipping_total ?? 0
  const hasShipping = (cart?.shipping_methods?.length ?? 0) > 0

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-2xl md:text-3xl font-bold tracking-tight">Finalizar compra</h1>

      {error && (
        <p className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* 1) Dirección */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="size-5 text-primary" /> Datos de envío
            </h2>
            {step === 'address' ? (
              <form onSubmit={onSubmitAddress} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre" value={address.first_name} onChange={(v) => setAddress((a) => ({ ...a, first_name: v }))} required />
                <Field label="Apellido" value={address.last_name} onChange={(v) => setAddress((a) => ({ ...a, last_name: v }))} required />
                <Field label="Teléfono" value={address.phone || ''} onChange={(v) => setAddress((a) => ({ ...a, phone: v }))} required className="sm:col-span-2" />
                <Field label="Dirección" value={address.address_1} onChange={(v) => setAddress((a) => ({ ...a, address_1: v }))} required className="sm:col-span-2" />
                <Field label="Referencia (opcional)" value={address.address_2 || ''} onChange={(v) => setAddress((a) => ({ ...a, address_2: v }))} className="sm:col-span-2" />
                <Field label="Ciudad" value={address.city} onChange={(v) => setAddress((a) => ({ ...a, city: v }))} required />
                <Field label="Departamento" value={address.province || ''} onChange={(v) => setAddress((a) => ({ ...a, province: v }))} />
                <Button type="submit" size="lg" disabled={busy} className="sm:col-span-2">
                  {busy && <Loader2 className="size-4 animate-spin" />} Continuar al envío
                </Button>
              </form>
            ) : (
              <div className="mt-2 flex items-start justify-between gap-4 text-sm">
                <p className="text-muted-foreground">
                  {address.first_name} {address.last_name} · {address.address_1}
                  {address.city ? `, ${address.city}` : ''} · {address.phone}
                </p>
                <button type="button" onClick={() => setStep('address')} className="shrink-0 font-medium text-primary hover:underline">
                  Cambiar
                </button>
              </div>
            )}
          </section>

          {/* 2) Envío */}
          {step !== 'address' && (
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Truck className="size-5 text-primary" /> Método de envío
              </h2>
              <div className="mt-4 space-y-3">
                {shippingOptions.map((o) => {
                  const eta = etaFromShippingData(o.data)
                  const price = o.amount ?? o.calculated_price?.calculated_amount ?? 0
                  const active = selectedShip === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onChooseShipping(o.id)}
                      disabled={busy}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${
                        active ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/40'
                      }`}
                    >
                      <span>
                        <span className="flex items-center gap-2 font-medium">
                          {active && <Check className="size-4 text-primary" />}
                          {o.name}
                        </span>
                        {eta && <span className="mt-0.5 block text-xs text-muted-foreground">{eta.label}</span>}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {price > 0 ? formatPrice(price) : 'Gratis'}
                      </span>
                    </button>
                  )
                })}
                {shippingOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay opciones de envío para tu zona.</p>
                )}
              </div>
              {step === 'shipping' && hasShipping && (
                <Button onClick={onGoToPayment} size="lg" disabled={busy} className="mt-4">
                  {busy && <Loader2 className="size-4 animate-spin" />} Continuar al pago
                </Button>
              )}
            </section>
          )}

          {/* 3) Pago */}
          {step === 'payment' && (
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Lock className="size-5 text-primary" /> Pago
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pago seguro con PayPal. El cobro se realiza en dólares (USD)
                {payment?.fx ? ` a la tasa de L ${payment.fx}/US$` : ''}.
              </p>
              {payment?.usd && (
                <p className="mt-3 text-sm">
                  Se cobrará <span className="font-semibold">US$ {payment.usd}</span> (≈{' '}
                  {formatPrice(total)}).
                </p>
              )}
              <div className="mt-4">
                {payment?.orderId && providerId ? (
                  <PayPalButton orderId={payment.orderId} onApprove={onPaid} onError={(m) => setError(m)} />
                ) : (
                  <p className="text-sm text-muted-foreground">Preparando el pago…</p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Resumen */}
        <aside className="h-fit rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Tu pedido</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item: any) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.product_title || item.title}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </span>
                <span className="shrink-0 font-medium">{formatPrice(item.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío</dt>
              <dd>{hasShipping ? (shippingTotal > 0 ? formatPrice(shippingTotal) : 'Gratis') : '—'}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t pt-4 font-bold">
            <span className="text-base">Total</span>
            <span className="text-xl">{formatPrice(total)}</span>
          </div>
          <Link href="/carrito" className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground">
            Volver al carrito
          </Link>
        </aside>
      </div>
    </div>
  )
}

const Field: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  className?: string
}> = ({ label, value, onChange, required, className }) => {
  const id = `chk-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/g, '')}`
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
