'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { Check, CircleAlert, Loader2, Lock, MapPin, ShoppingBag, Tag, Truck, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { InlineError } from '@/components/ui/inline-error'
import { PayPalButton } from '@/components/checkout/PayPalButton'
import { useCart } from '@/providers/Cart'
import {
  type CheckoutAddress,
  addShipping,
  applyPromo,
  bindCartToCustomer,
  completeCart,
  computeCartSummary,
  getCustomerOrNull,
  initPayment,
  interpretCompleteResult,
  type ParsedPaymentSession,
  listPaymentProviders,
  listShipping,
  parsePaymentSession,
  removePromo,
  retrieveCheckoutCart,
  setAddress as setCartAddress,
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

// Pasos visibles del checkout (solo para pintar el progreso; el flujo real vive en `step`).
const STEP_LABELS: ReadonlyArray<{ key: Step; label: string }> = [
  { key: 'address', label: 'Dirección' },
  { key: 'shipping', label: 'Envío' },
  { key: 'payment', label: 'Pago' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { cart: miniCart, ready: cartReady, clear } = useCart()

  const [cart, setCart] = useState<any>(null)
  const [step, setStep] = useState<Step>('address')
  const [address, setAddress] = useState<CheckoutAddress>(EMPTY_ADDRESS)
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShip, setSelectedShip] = useState<string | null>(null)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [payment, setPayment] = useState<ParsedPaymentSession | null>(null)
  const [booting, setBooting] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Estado local del cupón: texto del input, si estamos aplicando/quitando, y el
  // error inline propio (independiente del `error` global para no romper el flujo).
  const [promoCode, setPromoCode] = useState('')
  const [promoBusy, setPromoBusy] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  const cartId: string | undefined = miniCart?.id

  // Lleva a la vista el banner de error dondequiera que ocurra. Sin esto, un fallo del pago (con el
  // botón de PayPal abajo en móvil) mostraría el error arriba, fuera de pantalla.
  const errorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  // Gate de cuenta + vinculación + carga del carrito de checkout.
  // La DB del backend es remota (~170ms/round-trip), así que el arranque se hace en DOS OLAS
  // paralelas en vez de 4 llamadas en cascada: (1) identidad ∥ carrito, (2) vínculo ∥ proveedores.
  useEffect(() => {
    if (!cartReady) return
    let active = true
    ;(async () => {
      // Ola 1: quién es el cliente y el carrito, EN PARALELO (independientes entre sí).
      const [customer, ckRaw] = await Promise.all([
        getCustomerOrNull(),
        cartId ? retrieveCheckoutCart(cartId).catch(() => null) : Promise.resolve(null),
      ])
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
        const ck = ckRaw as any
        if (!ck) throw new Error('No se pudo cargar tu carrito. Recarga la página.')
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
        // Ola 2: vincular carrito↔cliente y listar proveedores de pago, EN PARALELO
        // (el vínculo solo necesita estar hecho antes de iniciar el pago, no antes de pintar).
        const [, provs] = await Promise.all([
          bindCartToCustomer(cartId, customer.email),
          listPaymentProviders(ck.region_id),
        ])
        if (!active) return
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
      setPayment(parsePaymentSession(session))
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
      const outcome = interpretCompleteResult(await completeCart(cartId))
      if (outcome.ok) {
        clear()
        router.push(`/checkout/confirmacion?order=${outcome.orderId}`)
        return // navegamos fuera; no reactivamos el botón
      }
      setError(outcome.message)
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

  // Aplica el cupón escrito. Al OK: refresca el cart en el estado (con discount_total
  // y promotions) y limpia el input; al fallo: mensaje inline sin tocar el resto.
  const onApplyPromo = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!cartId || promoBusy) return
    const code = promoCode.trim()
    if (!code) {
      setPromoError('Escribe un código de descuento.')
      return
    }
    setPromoBusy(true)
    setPromoError(null)
    const res = await applyPromo(cartId, code)
    if (res.ok) {
      setCart(res.cart)
      setPromoCode('')
    } else {
      setPromoError(res.message)
    }
    setPromoBusy(false)
  }

  // Quita un cupón ya aplicado y refresca los totales.
  const onRemovePromo = async (code: string) => {
    if (!cartId || promoBusy) return
    setPromoBusy(true)
    setPromoError(null)
    const res = await removePromo(cartId, code)
    if (res.ok) {
      setCart(res.cart)
    } else {
      setPromoError(res.message)
    }
    setPromoBusy(false)
  }

  if (!cartReady || booting) {
    return (
      <div className="container py-12 md:py-16">
        <div className="h-3.5 w-28 animate-pulse rounded-full bg-muted" />
        <div className="mt-3 h-9 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-7 w-72 max-w-full animate-pulse rounded-full bg-muted" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    )
  }

  // Falló la CARGA del carrito (hay cartId pero el retrieve no devolvió carrito): distinto de
  // "carrito vacío". Mostramos error + recargar en vez de afirmar falsamente "no hay nada que pagar".
  if (cartId && !cart) {
    return (
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
            <CircleAlert className="size-8" strokeWidth={1.5} />
          </div>
          <h1 className="mt-5 text-2xl md:text-3xl font-bold tracking-tight">
            No pudimos cargar tu carrito
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            {error || 'Hubo un problema temporal al cargar tu pedido. Vuelve a intentarlo.'}
          </p>
          <Button size="lg" className="mt-6 rounded-full" onClick={() => window.location.reload()}>
            Recargar la página
          </Button>
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
            No hay nada que pagar
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Añade productos a tu carrito para continuar con la compra.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full">
            <Link href="/tienda">Ir a la tienda</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Totales del resumen vía función PURA testeada (incluye la reconciliación de ISV: "Subtotal" es
  // el bruto de ítems, no cart.subtotal que es neto). Ver computeCartSummary en lib/medusa/checkout.
  const { total, subtotal, shippingTotal, discountTotal, hasShipping } = computeCartSummary(cart)
  // Cupones con código aplicados al carrito (ignoramos los automáticos sin código).
  const appliedPromos: any[] = (cart?.promotions ?? []).filter((p: any) => p?.code)
  // Índice del paso actual, solo para pintar el stepper de progreso.
  const stepIndex = STEP_LABELS.findIndex((s) => s.key === step)

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Compra segura</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight">Finalizar compra</h1>
      </header>

      {/* Stepper de progreso: paso completado (check), activo (resaltado) y pendiente */}
      <ol className="mb-8 flex items-center" aria-label="Pasos del proceso de compra">
        {STEP_LABELS.map((s, i) => {
          const done = i < stepIndex
          const current = i === stepIndex
          return (
            <li
              key={s.key}
              aria-current={current ? 'step' : undefined}
              className={`flex items-center gap-2 ${i > 0 ? 'flex-1' : ''}`}
            >
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`mx-2 h-px flex-1 transition-colors duration-300 sm:mx-3 ${
                    i <= stepIndex ? 'bg-primary/60' : 'bg-border'
                  }`}
                />
              )}
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors duration-300 ${
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : current
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  current ? 'text-foreground' : 'hidden text-muted-foreground sm:block'
                }`}
              >
                {s.label}
              </span>
            </li>
          )
        })}
      </ol>

      <InlineError variant="banner" ref={errorRef} className="mb-6">
        {error}
      </InlineError>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* 1) Dirección */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <MapPin className="size-5 text-primary" /> Datos de envío
              </h2>
              {step !== 'address' && (
                <Badge variant="success" className="shrink-0">
                  <Check className="size-3.5" aria-hidden="true" /> Listo
                </Badge>
              )}
            </div>
            {step === 'address' ? (
              <form onSubmit={onSubmitAddress} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre" autoComplete="given-name" name="given-name" value={address.first_name} onChange={(v) => setAddress((a) => ({ ...a, first_name: v }))} required />
                <Field label="Apellido" autoComplete="family-name" name="family-name" value={address.last_name} onChange={(v) => setAddress((a) => ({ ...a, last_name: v }))} required />
                <Field label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" name="tel" value={address.phone || ''} onChange={(v) => setAddress((a) => ({ ...a, phone: v }))} required className="sm:col-span-2" />
                <Field label="Dirección" autoComplete="address-line1" name="address-line1" value={address.address_1} onChange={(v) => setAddress((a) => ({ ...a, address_1: v }))} required className="sm:col-span-2" />
                <Field label="Referencia (opcional)" autoComplete="address-line2" name="address-line2" value={address.address_2 || ''} onChange={(v) => setAddress((a) => ({ ...a, address_2: v }))} className="sm:col-span-2" />
                <Field label="Ciudad" autoComplete="address-level2" name="address-level2" value={address.city} onChange={(v) => setAddress((a) => ({ ...a, city: v }))} required />
                <Field label="Departamento" autoComplete="address-level1" name="address-level1" value={address.province || ''} onChange={(v) => setAddress((a) => ({ ...a, province: v }))} />
                <Button type="submit" size="lg" disabled={busy} className="rounded-full sm:col-span-2">
                  {busy && <Loader2 className="size-4 animate-spin" />} Continuar al envío
                </Button>
              </form>
            ) : (
              <div className="mt-3 flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    {address.first_name} {address.last_name}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {address.address_1}
                    {address.city ? `, ${address.city}` : ''} · {address.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="shrink-0 rounded-full px-1 font-medium text-primary transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Cambiar
                </button>
              </div>
            )}
          </section>

          {/* 2) Envío */}
          {step !== 'address' && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Truck className="size-5 text-primary" /> Método de envío
                </h2>
                {step === 'payment' && (
                  <Badge variant="success" className="shrink-0">
                    <Check className="size-3.5" aria-hidden="true" /> Listo
                  </Badge>
                )}
              </div>
              <div className="mt-4 space-y-3" role="radiogroup" aria-label="Método de envío">
                {shippingOptions.map((o) => {
                  const eta = etaFromShippingData(o.data)
                  const price = o.amount ?? o.calculated_price?.calculated_amount ?? 0
                  const active = selectedShip === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChooseShipping(o.id)}
                      // En 'payment' la orden de PayPal ya tiene el total CONGELADO: cambiar el envío
                      // aquí descuadraría el monto autorizado → se deshabilita (ya se muestra "Listo").
                      disabled={busy || step === 'payment'}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 ${
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span>
                        <span className="flex items-center gap-2 font-medium">
                          {active && <Check className="size-4 text-primary" aria-hidden="true" />}
                          {o.name}
                        </span>
                        {eta && <span className="mt-0.5 block text-xs text-muted-foreground">{eta.label}</span>}
                      </span>
                      <span
                        className={`shrink-0 font-semibold tabular-nums ${price > 0 ? '' : 'text-in-stock'}`}
                      >
                        {price > 0 ? formatPrice(price) : 'Gratis'}
                      </span>
                    </button>
                  )
                })}
                {shippingOptions.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    No hay opciones de envío para tu zona.
                  </p>
                )}
              </div>
              {step === 'shipping' && hasShipping && (
                <Button onClick={onGoToPayment} size="lg" disabled={busy} className="mt-4 w-full rounded-full sm:w-auto">
                  {busy && <Loader2 className="size-4 animate-spin" />} Continuar al pago
                </Button>
              )}
            </section>
          )}

          {/* 3) Pago */}
          {step === 'payment' && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Lock className="size-5 text-primary" /> Pago
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pago seguro con PayPal. El cobro se realiza en dólares (USD)
                {payment?.fx ? ` a la tasa de L ${payment.fx}/US$` : ''}.
              </p>
              {payment?.usd && (
                <p className="mt-3 rounded-xl bg-muted/40 px-4 py-3 text-sm">
                  Se cobrará <span className="font-semibold">US$ {payment.usd}</span>{' '}
                  <span className="text-muted-foreground">(≈ {formatPrice(total)})</span>.
                </p>
              )}
              <div className="mt-4">
                {payment?.orderId && providerId ? (
                  <PayPalButton orderId={payment.orderId} onApprove={onPaid} onError={(m) => setError(m)} />
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Preparando el pago…
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Resumen */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold tracking-tight">Tu pedido</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item: any) => (
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

          {/* Cupón / código de descuento — SOLO editable ANTES de iniciar el pago. En el paso
              'payment' la orden de PayPal ya está creada con un monto CONGELADO; aplicar o quitar
              un cupón después cambiaría el total del carrito pero no el monto autorizado → se
              cobraría el importe equivocado. Por eso en 'payment' el cupón se muestra en modo
              lectura (el descuento sigue reflejado en los totales). */}
          {step !== 'payment' ? (
          <div className="mt-4 border-t border-border pt-4">
            <label htmlFor="chk-promo" className="flex items-center gap-1.5 text-sm font-medium">
              <Tag className="size-4 text-primary" aria-hidden="true" /> ¿Tienes un código de descuento?
            </label>
            <form onSubmit={onApplyPromo} className="mt-2 flex items-center gap-2">
              <input
                id="chk-promo"
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value)
                  if (promoError) setPromoError(null)
                }}
                placeholder="Ej. SMARTIME10"
                autoCapitalize="characters"
                autoComplete="off"
                disabled={promoBusy}
                aria-invalid={promoError ? true : undefined}
                className="h-10 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm uppercase outline-none transition duration-300 placeholder:normal-case placeholder:text-muted-foreground hover:border-primary/40 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={promoBusy || !promoCode.trim()}
                className="shrink-0 rounded-full"
              >
                {promoBusy ? <Loader2 className="size-4 animate-spin" /> : 'Aplicar'}
              </Button>
            </form>
            <InlineError className="mt-2">{promoError}</InlineError>
            {appliedPromos.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {appliedPromos.map((p) => (
                  <li key={p.id}>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-primary">
                      <Tag className="size-3.5" aria-hidden="true" />
                      {p.code}
                      <button
                        type="button"
                        onClick={() => onRemovePromo(p.code)}
                        disabled={promoBusy}
                        aria-label={`Quitar el código ${p.code}`}
                        className="grid size-5 place-items-center rounded-full text-primary/80 transition-colors duration-300 hover:bg-primary/20 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          ) : (
            appliedPromos.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Tag className="size-4 text-primary" aria-hidden="true" /> Cupón aplicado:
                  </span>
                  {appliedPromos.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      <Tag className="size-3.5" aria-hidden="true" />
                      {p.code}
                    </span>
                  ))}
                </p>
              </div>
            )
          )}

          <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Descuento</dt>
                <dd className="font-medium tabular-nums text-in-stock">-{formatPrice(discountTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío</dt>
              <dd className={`tabular-nums ${hasShipping && shippingTotal === 0 ? 'font-medium text-in-stock' : hasShipping ? 'font-medium' : 'text-muted-foreground'}`}>
                {hasShipping ? (shippingTotal > 0 ? formatPrice(shippingTotal) : 'Gratis') : '—'}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-base font-bold">Total</span>
            <span className="font-mono text-xl font-bold tabular-nums">{formatPrice(total)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">ISV incluido en el precio.</p>
          <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden="true" /> Transacción cifrada y protegida
          </p>
          <Link
            href="/carrito"
            className="mt-2 block rounded-full py-1 text-center text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Volver al carrito
          </Link>
        </aside>
      </div>
    </div>
  )
}

/* eslint-enable @typescript-eslint/no-explicit-any */
