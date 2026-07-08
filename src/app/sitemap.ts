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
    // Páginas informativas (ayuda, legal, empresa): contenido estable
    { url: base + '/ayuda/como-comprar', changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/ayuda/envios', changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/ayuda/garantia', changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/ayuda/devoluciones', changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/ayuda/preguntas-frecuentes', changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/terminos', changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/privacidad', changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/sobre-nosotros', changeFrequency: 'monthly', priority: 0.5 },
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
