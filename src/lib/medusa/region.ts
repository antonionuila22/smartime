/**
 * Región de Honduras: la de moneda HNL, o la primera como último recurso.
 *
 * FUENTE ÚNICA de esta regla, compartida por la capa de datos del catálogo (server, `data.ts`) y
 * el `CartProvider` (cliente). Antes estaba escrita dos veces; si divergían, el carrito podía
 * crearse contra una región distinta de la que precia el catálogo. Función pura → segura en ambos
 * entornos (no importa nada server-only).
 */
export function pickHnRegion<T extends { currency_code: string }>(regions: T[]): T | undefined {
  return regions.find((r) => r.currency_code === 'hnl') ?? regions[0]
}
