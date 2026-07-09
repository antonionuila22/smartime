import { describe, it, expect, vi } from 'vitest'

// checkout.ts importa `medusa` de './sdk' a nivel de módulo; las funciones PURAS que probamos no lo
// usan, así que lo mockeamos vacío para importar el módulo sin instanciar el cliente real.
vi.mock('@/lib/medusa/sdk', () => ({ medusa: {} }))

import {
  computeCartSummary,
  parsePaymentSession,
  interpretCompleteResult,
} from '@/lib/medusa/checkout'

describe('computeCartSummary — resumen con ISV incluido (reconciliación)', () => {
  it('usa original_item_total (BRUTO) como Subtotal, no cart.subtotal (NETO)', () => {
    // Caso real verificado E2E: MacBook×2 = 65,998 bruto + 150 envío = 66,148 total.
    const s = computeCartSummary({
      total: 66148,
      subtotal: 57520, // neto de ISV — NO debe usarse
      original_item_total: 65998,
      item_total: 65998,
      shipping_total: 150,
      discount_total: 0,
      shipping_methods: [{}],
    })
    expect(s.subtotal).toBe(65998)
    expect(s.total).toBe(66148)
    expect(s.shippingTotal).toBe(150)
    expect(s.hasShipping).toBe(true)
    // La propiedad que importa: Subtotal − Descuento + Envío = Total.
    expect(s.subtotal - s.discountTotal + s.shippingTotal).toBe(s.total)
  })

  it('con descuento reconcilia igual', () => {
    const s = computeCartSummary({
      total: 30000,
      original_item_total: 33000,
      shipping_total: 300,
      discount_total: 3300,
      shipping_methods: [{}],
    })
    expect(s.subtotal - s.discountTotal + s.shippingTotal).toBe(s.total)
  })

  it('cae a item_total y luego a subtotal si falta original_item_total', () => {
    expect(computeCartSummary({ item_total: 100 }).subtotal).toBe(100)
    expect(computeCartSummary({ subtotal: 90 }).subtotal).toBe(90)
  })

  it('null/undefined → ceros, hasShipping false', () => {
    expect(computeCartSummary(null)).toEqual({
      total: 0,
      subtotal: 0,
      shippingTotal: 0,
      discountTotal: 0,
      hasShipping: false,
    })
  })

  it('hasShipping false sin métodos de envío', () => {
    expect(computeCartSummary({ shipping_methods: [] }).hasShipping).toBe(false)
  })
})

describe('parsePaymentSession (datos de la sesión PayPal)', () => {
  it('extrae orderId/usd/fx de session.data', () => {
    expect(
      parsePaymentSession({ data: { id: 'ord_1', usd_value: '12.34', fx_hnl_per_usd: 24.7 } }),
    ).toEqual({ orderId: 'ord_1', usd: '12.34', fx: 24.7 })
  })

  it('session/data ausente → objeto vacío sin lanzar', () => {
    expect(parsePaymentSession(null)).toEqual({ orderId: undefined, usd: undefined, fx: undefined })
    expect(parsePaymentSession({ data: null })).toEqual({
      orderId: undefined,
      usd: undefined,
      fx: undefined,
    })
  })
})

describe('interpretCompleteResult (resultado de completeCart)', () => {
  it('type order con id → ok', () => {
    expect(interpretCompleteResult({ type: 'order', order: { id: 'o1' } })).toEqual({
      ok: true,
      orderId: 'o1',
    })
  })

  it('type cart con error → ok:false con el mensaje del backend', () => {
    expect(interpretCompleteResult({ type: 'cart', error: { message: 'Sin stock' } })).toEqual({
      ok: false,
      message: 'Sin stock',
    })
  })

  it('sin mensaje → texto de fallback (carrito intacto)', () => {
    const r = interpretCompleteResult({ type: 'cart' })
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.message).toMatch(/No pudimos confirmar/)
  })

  it('order sin id → tratado como fallo (no navega a confirmación con id vacío)', () => {
    expect(interpretCompleteResult({ type: 'order', order: {} }).ok).toBe(false)
  })
})
