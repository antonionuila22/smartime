import { describe, it, expect } from 'vitest'

import {
  etaFromOrderMetadata,
  etaFromShippingData,
  etaForMethodName,
  resolveOrderEta,
} from '@/utilities/eta'

/**
 * Tests de la lógica de ETA (fecha estimada de entrega) para Honduras.
 *
 * ESTOS TESTS SON CLAVE: la lógica tuvo un bug de zona horaria. Todo el cálculo se ancla al
 * calendario de Honduras (UTC-6) y se formatea en UTC; la fecha mostrada debe ser la MISMA en
 * cualquier zona horaria. Para probarlo de verdad, ejecutamos los mismos asserts bajo varias
 * zonas horarias forzando process.env.TZ (independencia de TZ real, no solo teórica).
 */

// Nombres de mes en es-HN, para construir las etiquetas esperadas sin depender del locale del OS.
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

// Etiqueta esperada de "día de mes" a partir de un mediodía-UTC (así lo formatea el módulo).
function etiquetaDia(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}

describe('etaFromOrderMetadata (ETA congelada, fechas ISO mediodía-UTC)', () => {
  it('rango normal → "Llega entre el D de MES y el D de MES"', () => {
    // Mediodía UTC de dos días distintos → rango.
    const min = '2026-07-08T12:00:00.000Z'
    const max = '2026-07-10T12:00:00.000Z'
    const eta = etaFromOrderMetadata({ eta: { min_date: min, max_date: max } })
    expect(eta).not.toBeNull()
    expect(eta!.minDate.toISOString()).toBe(min)
    expect(eta!.maxDate.toISOString()).toBe(max)
    expect(eta!.label).toBe(
      `Llega entre el ${etiquetaDia(min)} y el ${etiquetaDia(max)}`,
    )
    // 8 de julio y 10 de julio, concretamente.
    expect(eta!.label).toBe('Llega entre el 8 de julio y el 10 de julio')
  })

  it('min === max → "Llega el D de MES" (sin rango)', () => {
    const same = '2026-07-08T12:00:00.000Z'
    const eta = etaFromOrderMetadata({ eta: { min_date: same, max_date: same } })
    expect(eta).not.toBeNull()
    expect(eta!.label).toBe('Llega el 8 de julio')
  })

  it('metadata ausente / null / sin eta → null', () => {
    expect(etaFromOrderMetadata(null)).toBeNull()
    expect(etaFromOrderMetadata(undefined)).toBeNull()
    expect(etaFromOrderMetadata({})).toBeNull()
    expect(etaFromOrderMetadata({ eta: {} })).toBeNull()
  })

  it('fechas de tipo incorrecto o no parseables → null (robustez ante corrupción)', () => {
    // No-string → null.
    expect(
      etaFromOrderMetadata({ eta: { min_date: 123, max_date: 456 } }),
    ).toBeNull()
    // String no parseable → null.
    expect(
      etaFromOrderMetadata({ eta: { min_date: 'no-es-fecha', max_date: 'tampoco' } }),
    ).toBeNull()
    // Falta una de las dos → null.
    expect(
      etaFromOrderMetadata({ eta: { min_date: '2026-07-08T12:00:00.000Z' } }),
    ).toBeNull()
  })

  it('la etiqueta es TZ-independiente (mismo resultado bajo distintos process.env.TZ)', () => {
    const min = '2026-07-08T12:00:00.000Z'
    const max = '2026-07-10T12:00:00.000Z'
    const tzOriginal = process.env.TZ
    const esperado = 'Llega entre el 8 de julio y el 10 de julio'
    try {
      for (const tz of ['UTC', 'America/Tegucigalpa', 'Asia/Tokyo', 'Pacific/Kiritimati']) {
        process.env.TZ = tz
        const eta = etaFromOrderMetadata({ eta: { min_date: min, max_date: max } })
        expect(eta!.label, `TZ=${tz}`).toBe(esperado)
      }
    } finally {
      process.env.TZ = tzOriginal
    }
  })
})

describe('etaFromShippingData (base + N días hábiles, salta sáb/dom)', () => {
  // Ancla base en una fecha con reloj-de-pared HN conocido. Elegimos un instante que en Honduras
  // (UTC-6) cae claramente en un día laboral concreto para razonar sobre los días hábiles.
  // Lunes 2026-07-06, 09:00 HN = 15:00 UTC.
  const baseLunes = new Date('2026-07-06T15:00:00.000Z')

  it('rango normal (2..4 días hábiles desde un lunes → mié..vie de esa semana)', () => {
    const eta = etaFromShippingData({ eta_min_dias: 2, eta_max_dias: 4 }, baseLunes)
    expect(eta).not.toBeNull()
    // Lunes + 2 hábiles = miércoles 8; + 4 hábiles = viernes 10. Mediodía UTC.
    expect(eta!.minDate.toISOString()).toBe('2026-07-08T12:00:00.000Z')
    expect(eta!.maxDate.toISOString()).toBe('2026-07-10T12:00:00.000Z')
    expect(eta!.label).toBe('Llega entre el 8 de julio y el 10 de julio')
  })

  it('salta el fin de semana: lunes + 5 días hábiles = lunes siguiente (no sábado)', () => {
    // Lunes 6 + 5 hábiles: mar7, mié8, jue9, vie10, lun13. Salta sáb 11 y dom 12.
    const eta = etaFromShippingData({ eta_min_dias: 5, eta_max_dias: 5 }, baseLunes)
    expect(eta!.minDate.toISOString()).toBe('2026-07-13T12:00:00.000Z')
    // min === max → "Llega el ..."
    expect(eta!.label).toBe('Llega el 13 de julio')
  })

  it('un fin de semana de por medio: desde un viernes, +2 hábiles cruza sáb/dom', () => {
    // Viernes 2026-07-10, 09:00 HN = 15:00 UTC. +1 hábil = lunes 13; +2 = martes 14.
    const baseViernes = new Date('2026-07-10T15:00:00.000Z')
    const eta = etaFromShippingData({ eta_min_dias: 1, eta_max_dias: 2 }, baseViernes)
    expect(eta!.minDate.toISOString()).toBe('2026-07-13T12:00:00.000Z')
    expect(eta!.maxDate.toISOString()).toBe('2026-07-14T12:00:00.000Z')
    expect(eta!.label).toBe('Llega entre el 13 de julio y el 14 de julio')
  })

  it('min === max → etiqueta singular "Llega el ..."', () => {
    const eta = etaFromShippingData({ eta_min_dias: 2, eta_max_dias: 2 }, baseLunes)
    expect(eta!.minDate.toISOString()).toBe(eta!.maxDate.toISOString())
    expect(eta!.label).toBe('Llega el 8 de julio')
  })

  it('datos ausentes o inválidos → null', () => {
    expect(etaFromShippingData(undefined, baseLunes)).toBeNull()
    expect(etaFromShippingData(null, baseLunes)).toBeNull()
    expect(etaFromShippingData({}, baseLunes)).toBeNull()
    // max <= 0 → null.
    expect(etaFromShippingData({ eta_min_dias: 1, eta_max_dias: 0 }, baseLunes)).toBeNull()
    // valores no numéricos → null.
    expect(
      etaFromShippingData({ eta_min_dias: 'x', eta_max_dias: 'y' }, baseLunes),
    ).toBeNull()
  })

  it('el resultado es TZ-independiente (mismas fechas bajo distintos process.env.TZ)', () => {
    const tzOriginal = process.env.TZ
    try {
      for (const tz of ['UTC', 'America/Tegucigalpa', 'Asia/Tokyo', 'Pacific/Kiritimati']) {
        process.env.TZ = tz
        const eta = etaFromShippingData({ eta_min_dias: 2, eta_max_dias: 4 }, baseLunes)
        expect(eta!.minDate.toISOString(), `TZ=${tz}`).toBe('2026-07-08T12:00:00.000Z')
        expect(eta!.maxDate.toISOString(), `TZ=${tz}`).toBe('2026-07-10T12:00:00.000Z')
        expect(eta!.label, `TZ=${tz}`).toBe('Llega entre el 8 de julio y el 10 de julio')
      }
    } finally {
      process.env.TZ = tzOriginal
    }
  })
})

describe('resolveOrderEta (cadena de prioridad centralizada)', () => {
  const CREATED = '2026-07-07T18:00:00.000Z'
  const FROZEN = {
    eta: { min_date: '2026-07-09T12:00:00.000Z', max_date: '2026-07-13T12:00:00.000Z' },
  }

  it('1º prioriza la metadata CONGELADA e ignora la data de envío', () => {
    const order = {
      metadata: FROZEN,
      created_at: CREATED,
      shipping_methods: [{ name: 'Envío estándar Honduras', data: { eta_min_dias: 9, eta_max_dias: 9 } }],
    }
    expect(resolveOrderEta(order)?.label).toBe(etaFromOrderMetadata(FROZEN)?.label)
  })

  it('2º sin metadata usa method.data anclado a la fecha del PEDIDO (no "ahora")', () => {
    const data = { eta_min_dias: 2, eta_max_dias: 4 }
    const order = { metadata: {}, created_at: CREATED, shipping_methods: [{ name: 'X', data }] }
    expect(resolveOrderEta(order)?.label).toBe(etaFromShippingData(data, new Date(CREATED))?.label)
  })

  it('cae a shipping_option.data cuando method.data está vacío', () => {
    const optData = { eta_min_dias: 1, eta_max_dias: 2 }
    const order = {
      metadata: {},
      created_at: CREATED,
      shipping_methods: [{ name: 'X', data: {}, shipping_option: { data: optData } }],
    }
    expect(resolveOrderEta(order)?.label).toBe(etaFromShippingData(optData, new Date(CREATED))?.label)
  })

  it('3º último recurso: por NOMBRE del método', () => {
    const order = {
      metadata: {},
      created_at: CREATED,
      shipping_methods: [{ name: 'Envío estándar Honduras' }],
    }
    expect(resolveOrderEta(order)?.label).toBe(etaForMethodName('Envío estándar Honduras', new Date(CREATED))?.label)
  })

  it('sin método de envío → null', () => {
    expect(resolveOrderEta({ metadata: {}, created_at: CREATED, shipping_methods: [] })).toBeNull()
    expect(resolveOrderEta({ metadata: {}, created_at: CREATED })).toBeNull()
  })
})

describe('etaForMethodName (mapa por nombre del método)', () => {
  const baseLunes = new Date('2026-07-06T15:00:00.000Z')

  it('"Envío Estándar Honduras" → 2..4 días hábiles (normaliza acentos y mayúsculas)', () => {
    const eta = etaForMethodName('Envío Estándar Honduras', baseLunes)
    expect(eta).not.toBeNull()
    expect(eta!.minDate.toISOString()).toBe('2026-07-08T12:00:00.000Z')
    expect(eta!.maxDate.toISOString()).toBe('2026-07-10T12:00:00.000Z')
  })

  it('"Retiro en tienda" → 1..2 días hábiles', () => {
    const eta = etaForMethodName('Retiro en tienda', baseLunes)
    expect(eta).not.toBeNull()
    // Lunes + 1 = martes 7; + 2 = miércoles 8.
    expect(eta!.minDate.toISOString()).toBe('2026-07-07T12:00:00.000Z')
    expect(eta!.maxDate.toISOString()).toBe('2026-07-08T12:00:00.000Z')
  })

  it('nombre desconocido → null', () => {
    expect(etaForMethodName('metodo inexistente', baseLunes)).toBeNull()
  })

  it('nombre ausente (null/undefined/vacío) → null', () => {
    expect(etaForMethodName(null, baseLunes)).toBeNull()
    expect(etaForMethodName(undefined, baseLunes)).toBeNull()
    expect(etaForMethodName('', baseLunes)).toBeNull()
  })
})
