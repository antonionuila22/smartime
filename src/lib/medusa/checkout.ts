import type { HttpTypes } from '@medusajs/types'

import { medusa } from './sdk'

/**
 * Helpers del flujo de checkout (Fase 1). Centralizan las llamadas al Store API
 * de Medusa en el orden correcto (ver store/docs/07-fase1-checkout-spec.md §1.2 y §4.2).
 *
 * Regla de negocio (D1): no se vende sin cuenta. El gate vive en la UI
 * (getCustomerOrNull) y el backend lo refuerza en POST /store/carts/:id/complete.
 */

export type CheckoutAddress = {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code?: string
  phone?: string
  country_code: string // ISO-2 minúscula, "hn"
}

/** Campos del cart que necesita el checkout (no inflar el mini-cart del provider). */
export const CHECKOUT_FIELDS =
  // OJO con precios tax-inclusive (ISV incluido): `subtotal`/`item.subtotal` son NETOS de ISV
  // (precio/(1+tasa)) mientras `total`/`item.total`/`original_item_total` son BRUTOS (lo que se
  // cobra). Para que el resumen reconcilie (Subtotal − Descuento + Envío = Total) usamos el bruto
  // `original_item_total` como "Subtotal", no `subtotal`. Ver checkout/page.tsx.
  'id,email,currency_code,region_id,total,subtotal,original_item_total,tax_total,shipping_total,item_total,discount_total,' +
  '*items,*items.variant,*items.product,' +
  '*shipping_address,*billing_address,*shipping_methods,*promotions,' +
  '*payment_collection,*payment_collection.payment_sessions'

/* ------------------------------------------------------------------ *
 * Lógica PURA de dinero/pago del checkout (extraída de la página para poder TESTEARLA sin montar
 * el componente cliente de 700 líneas — era el código de mayor riesgo sin cobertura). Son funciones
 * sin efectos: mismas entradas → mismas salidas.
 * ------------------------------------------------------------------ */

/** Campos de totales que necesita el resumen (con precios tax-inclusive, ver computeCartSummary). */
type SummarizableCart = {
  total?: number | null
  subtotal?: number | null
  original_item_total?: number | null
  item_total?: number | null
  shipping_total?: number | null
  discount_total?: number | null
  shipping_methods?: unknown[] | null
}

export type CartSummary = {
  subtotal: number
  total: number
  shippingTotal: number
  discountTotal: number
  hasShipping: boolean
}

/**
 * Totales del resumen del pedido. CLAVE con precios tax-inclusive (ISV incluido): "Subtotal" es el
 * BRUTO de ítems ANTES de descuento (`original_item_total`), NO `subtotal` (que es NETO de ISV);
 * así reconcilia Subtotal − Descuento + Envío = Total. Ver el bug de dinero corregido en el audit.
 */
export function computeCartSummary(cart: SummarizableCart | null | undefined): CartSummary {
  return {
    total: cart?.total ?? 0,
    subtotal: cart?.original_item_total ?? cart?.item_total ?? cart?.subtotal ?? 0,
    shippingTotal: cart?.shipping_total ?? 0,
    discountTotal: cart?.discount_total ?? 0,
    hasShipping: (cart?.shipping_methods?.length ?? 0) > 0,
  }
}

type PaymentSessionLike = {
  data?: { id?: string; usd_value?: string; fx_hnl_per_usd?: number } | null
} | null | undefined

export type ParsedPaymentSession = { orderId?: string; usd?: string; fx?: number }

/** Extrae del `session.data` del proveedor PayPal el id de la orden, el monto en USD y la tasa FX. */
export function parsePaymentSession(session: PaymentSessionLike): ParsedPaymentSession {
  const data = session?.data ?? {}
  return { orderId: data.id, usd: data.usd_value, fx: data.fx_hnl_per_usd }
}

type CompleteResultLike = {
  type?: string
  order?: { id?: string } | null
  error?: { message?: string } | null
} | null | undefined

/** Interpreta el resultado de `completeCart`: pedido creado (éxito) o mensaje de fallo. */
export function interpretCompleteResult(
  res: CompleteResultLike,
): { ok: true; orderId: string } | { ok: false; message: string } {
  if (res?.type === 'order' && res.order?.id) return { ok: true, orderId: res.order.id }
  return {
    ok: false,
    message: res?.error?.message || 'No pudimos confirmar el pago. Tu carrito sigue intacto.',
  }
}

/** Gate: cliente autenticado o null (sin lanzar). */
export async function getCustomerOrNull(): Promise<HttpTypes.StoreCustomer | null> {
  try {
    const { customer } = await medusa.store.customer.retrieve()
    return customer
  } catch {
    return null
  }
}

/** Asocia el carrito anónimo al cliente autenticado (email + transferCart). */
export async function bindCartToCustomer(cartId: string, email: string) {
  await medusa.store.cart.update(cartId, { email })
  const { cart } = await medusa.store.cart.transferCart(cartId)
  return cart
}

/** Setea dirección de envío (y de facturación = envío si no se pasa otra). */
export async function setAddress(cartId: string, address: CheckoutAddress, billing?: CheckoutAddress) {
  const { cart } = await medusa.store.cart.update(cartId, {
    shipping_address: address as HttpTypes.StoreAddAddress,
    billing_address: (billing ?? address) as HttpTypes.StoreAddAddress,
  })
  return cart
}

/** Opciones de envío disponibles para el carrito (con su `data` de ETA). */
export async function listShipping(cartId: string) {
  const { shipping_options } = await medusa.store.fulfillment.listCartOptions({ cart_id: cartId })
  return shipping_options
}

/**
 * Añade el método de envío elegido; recalcula el total server-side.
 * `data` (p. ej. la ETA de la opción) se guarda en el shipping_method → llega al pedido,
 * para poder mostrar la fecha estimada de envío en el perfil.
 */
export async function addShipping(cartId: string, optionId: string, data?: Record<string, unknown>) {
  const { cart } = await medusa.store.cart.addShippingMethod(cartId, {
    option_id: optionId,
    ...(data ? { data } : {}),
  })
  return cart
}

/** Proveedores de pago de la región (buscar el de PayPal por id que matchee /paypal/). */
export async function listPaymentProviders(regionId: string) {
  const { payment_providers } = await medusa.store.payment.listPaymentProviders({
    region_id: regionId,
  })
  return payment_providers
}

/**
 * Inicia la sesión de pago (arg1 = OBJETO cart, no el id) y re-lee el carrito
 * con la payment session. Devuelve el cart actualizado y la sesión activa.
 */
export async function initPayment(cart: HttpTypes.StoreCart, providerId: string) {
  await medusa.store.payment.initiatePaymentSession(cart, { provider_id: providerId })
  const { cart: updated } = await medusa.store.cart.retrieve(cart.id, { fields: CHECKOUT_FIELDS })
  const sessions = updated.payment_collection?.payment_sessions ?? []
  const session = sessions.find((s) => s.status === 'pending') ?? sessions[0]
  return { cart: updated, session }
}

/** Carrito con los campos del checkout. */
export async function retrieveCheckoutCart(cartId: string) {
  const { cart } = await medusa.store.cart.retrieve(cartId, { fields: CHECKOUT_FIELDS })
  return cart
}

/**
 * Completa el carrito. Devuelve { type: "order", order } en éxito o
 * { type: "cart", cart, error } si el pago no se concretó (carrito intacto).
 * Solo limpiar el CART_KEY si type === "order".
 */
export async function completeCart(cartId: string) {
  return medusa.store.cart.complete(cartId)
}

/**
 * Resultado de aplicar/quitar un cupón: en éxito devuelve el cart recargado
 * (con discount_total y promotions); en fallo devuelve un mensaje que la UI
 * puede pintar inline sin romper el flujo del checkout.
 */
export type PromoResult =
  | { ok: true; cart: HttpTypes.StoreCart }
  | { ok: false; message: string }

/**
 * Aplica un código de descuento al carrito vía POST /store/carts/:id/promotions
 * (body { promo_codes: [code] }, action ADD server-side) y devuelve el cart
 * recargado con CHECKOUT_FIELDS. Un código inválido responde 400 → el SDK lanza
 * FetchError; lo capturamos y devolvemos { ok:false, message } para la UI.
 */
export async function applyPromo(cartId: string, code: string): Promise<PromoResult> {
  const clean = code.trim()
  if (!clean) return { ok: false, message: 'Escribe un código de descuento.' }
  try {
    // El endpoint ya devuelve el cart, pero re-leemos con CHECKOUT_FIELDS para
    // tener exactamente los mismos campos (totales/promotions) que usa la página.
    const { cart } = await medusa.client.fetch<{ cart: HttpTypes.StoreCart }>(
      `/store/carts/${cartId}/promotions`,
      { method: 'POST', body: { promo_codes: [clean] } },
    )
    const fresh = await retrieveCheckoutCart(cartId)
    return { ok: true, cart: (fresh ?? cart) as HttpTypes.StoreCart }
  } catch (e: any) {
    // FetchError expone .message ("The promotion code X is invalid") y .status.
    const raw = String(e?.message || '')
    const message = /invalid|not\s*found|no\s*existe/i.test(raw)
      ? 'Ese código no es válido o ya no está disponible.'
      : 'No pudimos aplicar el código. Inténtalo de nuevo.'
    return { ok: false, message }
  }
}

/**
 * Quita un código ya aplicado vía DELETE /store/carts/:id/promotions
 * (body { promo_codes: [code] }, action REMOVE) y devuelve el cart recargado.
 */
export async function removePromo(cartId: string, code: string): Promise<PromoResult> {
  try {
    const { cart } = await medusa.client.fetch<{ cart: HttpTypes.StoreCart }>(
      `/store/carts/${cartId}/promotions`,
      { method: 'DELETE', body: { promo_codes: [code] } },
    )
    const fresh = await retrieveCheckoutCart(cartId)
    return { ok: true, cart: (fresh ?? cart) as HttpTypes.StoreCart }
  } catch {
    return { ok: false, message: 'No pudimos quitar el código. Inténtalo de nuevo.' }
  }
}
