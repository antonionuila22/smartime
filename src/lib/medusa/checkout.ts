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
  'id,email,currency_code,region_id,total,subtotal,shipping_total,item_total,' +
  '*items,*items.variant,*items.product,' +
  '*shipping_address,*billing_address,*shipping_methods,' +
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
