import { describe, it, expect } from 'vitest'

import { formatPrice, getDiscount } from '@/utilities/format'

describe('getDiscount (porcentaje y ahorro)', () => {
  it('calcula porcentaje redondeado y ahorro cuando hay descuento (compareAt > price)', () => {
    // 100 → 80: 20% de descuento, ahorro 20.
    expect(getDiscount(80, 100)).toEqual({ percent: 20, save: 20 })
  })

  it('redondea el porcentaje al entero más cercano', () => {
    // 999 → 899: (100/999)*100 = 10.01% → redondea a 10; ahorro 100.
    expect(getDiscount(899, 999)).toEqual({ percent: 10, save: 100 })
    // 3 → 2: 33.33% → redondea a 33; ahorro 1.
    expect(getDiscount(2, 3)).toEqual({ percent: 33, save: 1 })
  })

  it('sin descuento → null cuando compareAt <= price', () => {
    // original == price → sin descuento.
    expect(getDiscount(100, 100)).toBeNull()
    // original < price → sin descuento.
    expect(getDiscount(120, 100)).toBeNull()
  })

  it('datos ausentes o cero → null', () => {
    expect(getDiscount(undefined, undefined)).toBeNull()
    expect(getDiscount(null, null)).toBeNull()
    expect(getDiscount(100, undefined)).toBeNull()
    expect(getDiscount(undefined, 100)).toBeNull()
    // price 0 (falsy) → null (guard !price).
    expect(getDiscount(0, 100)).toBeNull()
    // compareAt 0 (falsy) → null.
    expect(getDiscount(50, 0)).toBeNull()
  })
})

describe('formatPrice (formato Lempiras HNL, es-HN)', () => {
  // Intl.NumberFormat separa el símbolo "L" del número con un espacio NO separable (U+00A0),
  // no con un espacio normal. Normalizamos cualquier espacio Unicode a un espacio ASCII para
  // comparar de forma estable entre versiones de ICU/Node.
  const norm = (s: string) => s.replace(/\s/g, ' ')

  it('formatea un entero con separador de miles y símbolo de Lempira', () => {
    const s = formatPrice(32999)
    expect(typeof s).toBe('string')
    // Símbolo de Lempira "L" y el número con separador de miles.
    expect(s).toContain('L')
    expect(s).toContain('32,999')
    // Formato concreto observado en es-HN (con espacio normalizado).
    expect(norm(s)).toBe('L 32,999')
  })

  it('sin decimales cuando el valor es entero (minimumFractionDigits 0)', () => {
    expect(norm(formatPrice(1000))).toBe('L 1,000')
  })

  it('muestra hasta 2 decimales cuando los hay (maximumFractionDigits 2)', () => {
    // 1234.5 conserva el decimal significativo.
    expect(formatPrice(1234.5)).toContain('1,234.5')
  })

  it('valor ausente / null / no finito → 0 (nunca "NaN")', () => {
    expect(norm(formatPrice(undefined))).toBe('L 0')
    expect(norm(formatPrice(null))).toBe('L 0')
    expect(norm(formatPrice(Number.NaN))).toBe('L 0')
    expect(norm(formatPrice(Infinity))).toBe('L 0')
  })
})
