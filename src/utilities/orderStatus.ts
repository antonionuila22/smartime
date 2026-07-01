/**
 * Traduce el estado de un pedido de Medusa (status / payment_status / fulfillment_status)
 * a una etiqueta clara para el cliente + un "tono" para el color del badge.
 */

export type OrderTone = 'in-stock' | 'primary' | 'warning' | 'destructive' | 'muted'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function orderState(order: any): { label: string; tone: OrderTone } {
  const status: string = order?.status
  const fulfillment: string = order?.fulfillment_status
  const payment: string = order?.payment_status

  if (status === 'canceled' || payment === 'canceled') return { label: 'Cancelado', tone: 'destructive' }
  if (fulfillment === 'delivered') return { label: 'Entregado', tone: 'in-stock' }
  if (fulfillment === 'shipped' || fulfillment === 'partially_shipped')
    return { label: 'Enviado', tone: 'in-stock' }
  if (fulfillment === 'fulfilled' || fulfillment === 'partially_fulfilled')
    return { label: 'En preparación', tone: 'primary' }
  if (payment === 'captured' || payment === 'partially_captured')
    return { label: 'Pago confirmado', tone: 'primary' }
  if (payment === 'refunded' || payment === 'partially_refunded')
    return { label: 'Reembolsado', tone: 'muted' }
  if (payment === 'awaiting' || payment === 'not_paid')
    return { label: 'Pendiente de pago', tone: 'warning' }
  return { label: 'Procesando', tone: 'muted' }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Clases Tailwind del badge según el tono. */
export function toneClasses(tone: OrderTone): string {
  switch (tone) {
    case 'in-stock':
      return 'bg-in-stock/10 text-in-stock'
    case 'primary':
      return 'bg-primary/10 text-primary'
    case 'warning':
      return 'bg-warning/15 text-warning'
    case 'destructive':
      return 'bg-destructive/10 text-destructive'
    default:
      return 'bg-muted text-muted-foreground'
  }
}
