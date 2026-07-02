import type { MetadataRoute } from 'next'

import { listProducts } from '@/lib/medusa/data'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Sitemap dinámico: rutas estáticas + una entrada por producto.
 * Nota: se omite `lastModified` a propósito — con cacheComponents la hora
 * actual cuenta como IO dinámica durante el prerender y rompería la caché.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getServerSideURL()

  // Rutas estáticas principales de la tienda
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base + '/', changeFrequency: 'daily', priority: 1 },
    { url: base + '/tienda', changeFrequency: 'daily', priority: 0.9 },
  ]

  // Productos publicados (listProducts ya viene cacheada con 'use cache').
  // SIN .catch: si la regeneración ISR falla (backend caído un instante), el error debe
  // propagar para que Next conserve y siga sirviendo la versión anterior del sitemap,
  // en vez de cachear 1 hora un sitemap "válido" con solo 2 URLs.
  const products = await listProducts({ limit: 100 })
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: base + '/producto/' + p.handle,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
