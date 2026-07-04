import { describe, it, expect, vi } from 'vitest'

// `data.ts` importa `next/cache` (cacheLife/cacheTag) en el nivel de módulo; fuera del build de
// Next esas funciones no existen, así que las mockeamos con no-ops para poder importar el módulo
// y probar la función PURA `toViewProduct` de forma aislada. También mockeamos `./sdk` para no
// instanciar el cliente real de Medusa (no hace falta para esta función pura).
vi.mock('next/cache', () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}))
vi.mock('@/lib/medusa/sdk', () => ({ medusa: {} }))

import { toViewProduct } from '@/lib/medusa/data'

// Producto base mínimo; cada test sobreescribe la 1ª variante para el escenario de inventario.
function makeProduct(variant: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    id: 'prod_1',
    handle: 'macbook-air',
    title: 'MacBook Air',
    description: 'Portátil',
    thumbnail: 'https://cdn/thumb.jpg',
    metadata: {},
    categories: [{ name: 'Mac' }],
    images: [{ url: 'https://cdn/1.jpg' }, { url: 'https://cdn/2.jpg' }],
    variants: [{ id: 'var_1', calculated_price: { calculated_amount: 32999, currency_code: 'hnl' }, ...variant }],
    ...extra,
  }
}

describe('toViewProduct — inStock / stock a partir de la 1ª variante', () => {
  it('en stock: inventario rastreado sin backorder y qty > 0 → inStock true, stock = qty', () => {
    const v = toViewProduct(
      makeProduct({ manage_inventory: true, allow_backorder: false, inventory_quantity: 5 }),
    )
    expect(v.inStock).toBe(true)
    expect(v.stock).toBe(5)
  })

  it('agotado: inventario rastreado, sin backorder y qty 0 → inStock false, stock 0', () => {
    const v = toViewProduct(
      makeProduct({ manage_inventory: true, allow_backorder: false, inventory_quantity: 0 }),
    )
    expect(v.inStock).toBe(false)
    expect(v.stock).toBe(0)
  })

  it('ilimitado: manage_inventory false → stock null, inStock true (no se rastrea)', () => {
    const v = toViewProduct(
      makeProduct({ manage_inventory: false, allow_backorder: false, inventory_quantity: 0 }),
    )
    expect(v.inStock).toBe(true)
    expect(v.stock).toBeNull()
  })

  it('backorder: allow_backorder true (aunque qty 0) → inStock true, stock null', () => {
    const v = toViewProduct(
      makeProduct({ manage_inventory: true, allow_backorder: true, inventory_quantity: 0 }),
    )
    expect(v.inStock).toBe(true)
    expect(v.stock).toBeNull()
  })

  it('sin variantes → inStock true (no se rastrea), stock null', () => {
    const v = toViewProduct({ id: 'p', handle: 'h', title: 't', variants: [] })
    expect(v.inStock).toBe(true)
    expect(v.stock).toBeNull()
  })
})

describe('toViewProduct — precio / originalPrice desde calculated_price', () => {
  it('toma price desde calculated_amount', () => {
    const v = toViewProduct(
      makeProduct({ manage_inventory: false, inventory_quantity: 0 }),
    )
    expect(v.price).toBe(32999)
    expect(v.currencyCode).toBe('hnl')
  })

  it('originalPrice = original_amount cuando es mayor que price', () => {
    const v = toViewProduct(
      makeProduct({
        manage_inventory: false,
        calculated_price: { calculated_amount: 30000, original_amount: 35000, currency_code: 'hnl' },
      }),
    )
    expect(v.price).toBe(30000)
    expect(v.originalPrice).toBe(35000)
  })

  it('originalPrice null cuando original_amount <= price (sin descuento)', () => {
    const v = toViewProduct(
      makeProduct({
        manage_inventory: false,
        calculated_price: { calculated_amount: 30000, original_amount: 30000, currency_code: 'hnl' },
      }),
    )
    expect(v.price).toBe(30000)
    expect(v.originalPrice).toBeNull()
  })

  it('originalPrice cae a metadata.compare_at_price cuando no hay original_amount y es mayor que price', () => {
    const v = toViewProduct(
      makeProduct(
        {
          manage_inventory: false,
          calculated_price: { calculated_amount: 30000, currency_code: 'hnl' },
        },
        { metadata: { compare_at_price: 40000 } },
      ),
    )
    expect(v.price).toBe(30000)
    expect(v.originalPrice).toBe(40000)
  })

  it('sin calculated_price → price 0 y currency por defecto "hnl"', () => {
    const v = toViewProduct({ id: 'p', handle: 'h', title: 't', variants: [{ id: 'var' }] })
    expect(v.price).toBe(0)
    expect(v.currencyCode).toBe('hnl')
    expect(v.originalPrice).toBeNull()
  })

  it('mapea imágenes, thumbnail, categoría y marca correctamente', () => {
    const v = toViewProduct(
      makeProduct(
        { manage_inventory: false },
        { metadata: { brand: 'Apple' } },
      ),
    )
    expect(v.image).toBe('https://cdn/thumb.jpg')
    expect(v.images).toEqual(['https://cdn/1.jpg', 'https://cdn/2.jpg'])
    expect(v.categoryName).toBe('Mac')
    expect(v.brand).toBe('Apple')
    expect(v.variantId).toBe('var_1')
  })
})
