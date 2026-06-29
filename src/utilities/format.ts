/** Formatea un número como moneda Lempira hondureña (HNL, es-HN). Ej: L 32,999 */
export function formatPrice(value?: number | null): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 0,
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
