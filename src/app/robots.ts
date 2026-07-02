import type { MetadataRoute } from 'next'

import { getServerSideURL } from '@/utilities/getURL'

/** robots.txt: bloquea rutas privadas/transaccionales y publica el sitemap. */
export default function robots(): MetadataRoute.Robots {
  const base = getServerSideURL()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/carrito', '/cuenta', '/favoritos', '/login', '/registro', '/api/'],
    },
    sitemap: base + '/sitemap.xml',
  }
}
