import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Regresión de la capa de catálogo tras la optimización de rendimiento: `listProducts` YA NO
 * consulta la DB por combinación de filtros. Consume `listAllProducts` (una sola lectura del
 * catálogo) y filtra/busca EN MEMORIA. Estos tests fijan ese contrato:
 *   - la query a la DB NO lleva `category_id` ni `q` (trae todo y filtra en memoria),
 *   - el filtro por categoría usa el id (correcto con multi-categoría),
 *   - la búsqueda es insensible a acentos y exige TODOS los términos (AND),
 *   - `limit` recorta el resultado ya filtrado.
 */

vi.mock('next/cache', () => ({ cacheLife: () => {}, cacheTag: () => {} }))

const productList = vi.fn()
vi.mock('@/lib/medusa/sdk', () => ({
  medusa: {
    store: {
      region: { list: async () => ({ regions: [{ id: 'reg_hn', currency_code: 'hnl' }] }) },
      product: { list: (...args: unknown[]) => productList(...args) },
    },
    // getReviewSummaries usa client.fetch; devolvemos vacío (no relevante para el filtrado).
    client: { fetch: async () => ({ summaries: {} }) },
  },
}))

import { listProducts } from '@/lib/medusa/data'

/* eslint-disable @typescript-eslint/no-explicit-any */
const prod = (
  handle: string,
  title: string,
  price: number,
  category: { id: string; name: string },
  brand: string,
  description = '',
): any => ({
  id: `id_${handle}`,
  handle,
  title,
  description,
  thumbnail: null,
  images: [],
  metadata: { brand },
  categories: [category],
  variants: [{ id: `v_${handle}`, calculated_price: { calculated_amount: price, currency_code: 'hnl' } }],
})
/* eslint-enable @typescript-eslint/no-explicit-any */

const IPHONE = { id: 'cat_iphone', name: 'iPhone' }
const MAC = { id: 'cat_mac', name: 'Mac' }
const HOGAR = { id: 'cat_hogar', name: 'Hogar' }

const CATALOG = [
  prod('iphone-15-pro', 'iPhone 15 Pro', 32999, IPHONE, 'Apple', 'Titanio con la mejor cámara de iPhone'),
  prod('macbook-air', 'MacBook Air', 52999, MAC, 'Apple', 'Portátil ultraligero'),
  prod('camara-wifi', 'Cámara de seguridad WiFi', 1299, HOGAR, 'TP-Link', 'Vigilancia para el hogar'),
]

beforeEach(() => {
  productList.mockReset()
  productList.mockResolvedValue({ products: CATALOG })
})

describe('listProducts — filtrado y búsqueda EN MEMORIA', () => {
  it('sin filtros devuelve todo el catálogo', async () => {
    const r = await listProducts()
    expect(r.map((p) => p.handle)).toEqual(['iphone-15-pro', 'macbook-air', 'camara-wifi'])
  })

  it('la query a la DB trae TODO (sin category_id ni q): el filtrado es en memoria', async () => {
    await listProducts({ categoryId: 'cat_mac', q: 'macbook' })
    expect(productList).toHaveBeenCalledTimes(1)
    const arg = productList.mock.calls[0][0]
    expect(arg).not.toHaveProperty('category_id')
    expect(arg).not.toHaveProperty('q')
  })

  it('filtra por categoría por id', async () => {
    expect((await listProducts({ categoryId: 'cat_iphone' })).map((p) => p.handle)).toEqual([
      'iphone-15-pro',
    ])
  })

  it('búsqueda insensible a acentos: "camara" encuentra "Cámara" y descripciones con "cámara"', async () => {
    const r = await listProducts({ q: 'camara' })
    expect(r.map((p) => p.handle).sort()).toEqual(['camara-wifi', 'iphone-15-pro'])
  })

  it('busca también por marca', async () => {
    expect((await listProducts({ q: 'apple' })).map((p) => p.handle)).toEqual([
      'iphone-15-pro',
      'macbook-air',
    ])
  })

  it('exige TODOS los términos (AND)', async () => {
    expect((await listProducts({ q: 'iphone titanio' })).map((p) => p.handle)).toEqual([
      'iphone-15-pro',
    ])
    expect(await listProducts({ q: 'iphone portatil' })).toEqual([])
  })

  it('sin coincidencias devuelve array vacío', async () => {
    expect(await listProducts({ q: 'xyzzy-nada' })).toEqual([])
  })

  it('respeta limit sobre el resultado ya filtrado', async () => {
    expect((await listProducts({ limit: 2 })).length).toBe(2)
  })
})
