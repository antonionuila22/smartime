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
  'id,email,currency_code,region_id,total,subtotal,shipping_total,item_total,discount_total,' +
  '*items,*items.variant,*items.product,' +
  '*shipping_address,*billing_address,*shipping_methods,*promotions,' +
  '*payment_collection,*payment_collection.payment_sessions'

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
