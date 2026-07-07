import { describe, it, expect } from 'vitest'

import {
  organizationJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
} from '@/utilities/structuredData'

const BASE = 'https://smartime.hn'

describe('organizationJsonLd', () => {
  it('describe la marca con url, logo y área Honduras', () => {
    const o = organizationJsonLd(BASE)
    expect(o['@type']).toBe('Organization')
    expect(o['@id']).toBe(`${BASE}/#organization`)
    expect(o.name).toBe('smartime')
    expect(o.url).toBe(`${BASE}/`)
    expect(o.logo).toContain(BASE)
    expect(o.areaServed).toMatchObject({ name: 'Honduras' })
  })

  it('omite sameAs cuando no hay perfiles configurados', () => {
    expect('sameAs' in organizationJsonLd(BASE)).toBe(false)
  })
})

describe('websiteJsonLd', () => {
  it('incluye SearchAction apuntando al buscador de la tienda (sitelinks searchbox)', () => {
    const w = websiteJsonLd(BASE)
    expect(w['@type']).toBe('WebSite')
    const action = w.potentialAction as Record<string, any>
    expect(action['@type']).toBe('SearchAction')
    expect(action.target.urlTemplate).toBe(`${BASE}/tienda?q={search_term_string}`)
    expect(action['query-input']).toContain('search_term_string')
    // Enlaza con la entidad Organization por @id.
    expect((w.publisher as Record<string, string>)['@id']).toBe(`${BASE}/#organization`)
  })
})

describe('breadcrumbJsonLd', () => {
  it('numera las posiciones desde 1 y conserva nombre/URL', () => {
    const b = breadcrumbJsonLd([
      { name: 'Inicio', url: `${BASE}/` },
      { name: 'Tienda', url: `${BASE}/tienda` },
      { name: 'MacBook Air', url: `${BASE}/producto/macbook-air` },
    ])
    expect(b['@type']).toBe('BreadcrumbList')
    const items = b.itemListElement as Array<Record<string, any>>
    expect(items).toHaveLength(3)
    expect(items.map((i) => i.position)).toEqual([1, 2, 3])
    expect(items[2]).toMatchObject({
      '@type': 'ListItem',
      name: 'MacBook Air',
      item: `${BASE}/producto/macbook-air`,
    })
  })
})
