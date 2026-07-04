import { describe, it, expect } from 'vitest'

import {
  startingMonthly,
  financingTable,
  MIN_FINANCING_AMOUNT,
  FINANCING_PLANS,
} from '@/utilities/financing'

describe('startingMonthly (cuota más baja disponible)', () => {
  it('elige el plazo más largo (cuota más baja) con 0% de interés', () => {
    // 12000 / 12 = 1000 (el plazo de 12 meses da la cuota mínima).
    expect(startingMonthly(12000)).toEqual({ amount: 1000, months: 12 })
  })

  it('la cuota es price / months cuando el plan es 0% interés', () => {
    const price = 6000
    const res = startingMonthly(price)
    expect(res).not.toBeNull()
    // El mejor plan (12 meses) → 6000/12 = 500.
    expect(res!.months).toBe(12)
    expect(res!.amount).toBeCloseTo(price / 12, 6)
  })

  it('precio por debajo del mínimo → null (no califica)', () => {
    expect(startingMonthly(MIN_FINANCING_AMOUNT - 1)).toBeNull()
    expect(startingMonthly(2999)).toBeNull()
  })

  it('precio exactamente en el mínimo → sí califica', () => {
    const res = startingMonthly(MIN_FINANCING_AMOUNT)
    expect(res).not.toBeNull()
    expect(res!.months).toBe(12)
    expect(res!.amount).toBeCloseTo(MIN_FINANCING_AMOUNT / 12, 6)
  })

  it('precio ausente / null / 0 → null', () => {
    expect(startingMonthly(undefined)).toBeNull()
    expect(startingMonthly(null)).toBeNull()
    expect(startingMonthly(0)).toBeNull()
  })
})

describe('financingTable (tabla de cuotas para el modal de la PDP)', () => {
  it('devuelve una fila por cada plan configurado', () => {
    const tabla = financingTable(12000)
    expect(tabla).toHaveLength(FINANCING_PLANS.length)
    expect(tabla.map((r) => r.months)).toEqual([3, 6, 12])
  })

  it('con 0% de interés: monthly = price/months y total = price', () => {
    const price = 12000
    const tabla = financingTable(price)
    for (const fila of tabla) {
      expect(fila.interest).toBe(0)
      expect(fila.monthly).toBeCloseTo(price / fila.months, 6)
      // Sin intereses: la suma de cuotas equivale al precio.
      expect(fila.total).toBeCloseTo(price, 6)
    }
  })

  it('valores concretos por plazo (precio 12000, 0%)', () => {
    const tabla = financingTable(12000)
    const byMonths = Object.fromEntries(tabla.map((r) => [r.months, r]))
    expect(byMonths[3].monthly).toBeCloseTo(4000, 6)
    expect(byMonths[6].monthly).toBeCloseTo(2000, 6)
    expect(byMonths[12].monthly).toBeCloseTo(1000, 6)
  })

  it('precio por debajo del mínimo → tabla vacía', () => {
    expect(financingTable(MIN_FINANCING_AMOUNT - 1)).toEqual([])
    expect(financingTable(2999)).toEqual([])
  })

  it('precio ausente / null / 0 → tabla vacía', () => {
    expect(financingTable(undefined)).toEqual([])
    expect(financingTable(null)).toEqual([])
    expect(financingTable(0)).toEqual([])
  })
})
