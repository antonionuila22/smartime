/**
 * Formatea un número como moneda Lempira hondureña (HNL, es-HN).
 * - Enteros → sin decimales (precio de etiqueta limpio): L 32,999
 * - Con céntimos → SIEMPRE 2 decimales (nunca uno solo): L 2,749.92, L 250.50
 * Antes usaba minimumFractionDigits:0/max:2, que renderizaba 250.5 como "L 250.5" (un decimal).
 */
export function formatPrice(value?: number | null): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  const hasCents = Math.round(n * 100) % 100 !== 0
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n)
}

/** Calcula el descuento entre precio actual y precio anterior. */
export function getDiscount(
  price?: number | null,
  compareAt?: number | null,
): { percent: number; save: number } | null {
  if (!price || !compareAt || compareAt <= price) return null
  const percent = Math.round(((compareAt - price) / compareAt) * 100)
  return { percent, save: compareAt - price }
}
