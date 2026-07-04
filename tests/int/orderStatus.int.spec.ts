import { describe, it, expect } from 'vitest'

import { orderState, toneClasses } from '@/utilities/orderStatus'

describe('orderState (mapa estado → {label, tone})', () => {
  it('cancelado por status → "Cancelado" / destructive', () => {
    expect(orderState({ status: 'canceled' })).toEqual({
      label: 'Cancelado',
      tone: 'destructive',
    })
  })

  it('cancelado por payment_status → "Cancelado" / destructive', () => {
    expect(orderState({ payment_status: 'canceled' })).toEqual({
      label: 'Cancelado',
      tone: 'destructive',
    })
  })

  it('cancelado tiene prioridad sobre entregado/enviado', () => {
    expect(
      orderState({ status: 'canceled', fulfillment_status: 'delivered' }),
    ).toEqual({ label: 'Cancelado', tone: 'destructive' })
  })

  it('entregado → "Entregado" / in-stock', () => {
    expect(orderState({ fulfillment_status: 'delivered' })).toEqual({
      label: 'Entregado',
      tone: 'in-stock',
    })
  })

  it('enviado (shipped y partially_shipped) → "Enviado" / in-stock', () => {
    expect(orderState({ fulfillment_status: 'shipped' })).toEqual({
      label: 'Enviado',
      tone: 'in-stock',
    })
    expect(orderState({ fulfillment_status: 'partially_shipped' })).toEqual({
      label: 'Enviado',
      tone: 'in-stock',
    })
  })

  it('en preparación (fulfilled y partially_fulfilled) → "En preparación" / primary', () => {
    expect(orderState({ fulfillment_status: 'fulfilled' })).toEqual({
      label: 'En preparación',
      tone: 'primary',
    })
    expect(orderState({ fulfillment_status: 'partially_fulfilled' })).toEqual({
      label: 'En preparación',
      tone: 'primary',
    })
  })

  it('pago confirmado (captured / partially_captured) → "Pago confirmado" / primary', () => {
    expect(orderState({ payment_status: 'captured' })).toEqual({
      label: 'Pago confirmado',
      tone: 'primary',
    })
    expect(orderState({ payment_status: 'partially_captured' })).toEqual({
      label: 'Pago confirmado',
      tone: 'primary',
    })
  })

  it('reembolsado (refunded / partially_refunded) → "Reembolsado" / muted', () => {
    expect(orderState({ payment_status: 'refunded' })).toEqual({
      label: 'Reembolsado',
      tone: 'muted',
    })
    expect(orderState({ payment_status: 'partially_refunded' })).toEqual({
      label: 'Reembolsado',
      tone: 'muted',
    })
  })

  it('pendiente de pago (awaiting / not_paid) → "Pendiente de pago" / warning', () => {
    expect(orderState({ payment_status: 'awaiting' })).toEqual({
      label: 'Pendiente de pago',
      tone: 'warning',
    })
    expect(orderState({ payment_status: 'not_paid' })).toEqual({
      label: 'Pendiente de pago',
      tone: 'warning',
    })
  })

  it('sin coincidencias / vacío / null → "Procesando" / muted', () => {
    expect(orderState({})).toEqual({ label: 'Procesando', tone: 'muted' })
    expect(orderState(null)).toEqual({ label: 'Procesando', tone: 'muted' })
    expect(orderState(undefined)).toEqual({ label: 'Procesando', tone: 'muted' })
    expect(orderState({ status: 'pending', payment_status: 'x' })).toEqual({
      label: 'Procesando',
      tone: 'muted',
    })
  })

  it('precedencia: fulfillment "delivered" gana sobre payment "captured"', () => {
    expect(
      orderState({ fulfillment_status: 'delivered', payment_status: 'captured' }),
    ).toEqual({ label: 'Entregado', tone: 'in-stock' })
  })

  it('precedencia: fulfillment "shipped" gana sobre payment "captured"', () => {
    expect(
      orderState({ fulfillment_status: 'shipped', payment_status: 'captured' }),
    ).toEqual({ label: 'Enviado', tone: 'in-stock' })
  })
})

describe('toneClasses (clases Tailwind por tono)', () => {
  it('cada tono devuelve sus clases y "muted" es el fallback por defecto', () => {
    expect(toneClasses('in-stock')).toContain('in-stock')
    expect(toneClasses('primary')).toContain('primary')
    expect(toneClasses('warning')).toContain('warning')
    expect(toneClasses('destructive')).toContain('destructive')
    expect(toneClasses('muted')).toContain('muted')
  })
})
