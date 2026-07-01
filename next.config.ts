import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

// Cabeceras de seguridad aplicadas a todas las rutas.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS solo surte efecto sobre HTTPS; los navegadores lo ignoran en HTTP local.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  // Cache Components (Next 16): habilita la directiva `'use cache'` + `cacheLife`/`cacheTag`
  // y el Partial Prerendering (shell estático + huecos dinámicos en streaming) por defecto.
  cacheComponents: true,
  images: {
    // Negociación de formato moderno: sirve AVIF/WebP a navegadores compatibles (imágenes
    // mucho más ligeras → mejor LCP) y cae a PNG/JPG en el resto.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // El catálogo (seed) enlaza imágenes de CDNs externos variados (Amazon, Apple, Wikimedia…).
      // Se permite cualquier host HTTPS para no romper next/image.
      // PRODUCCIÓN: sirve las imágenes desde tu propio backend/CDN (subidas a Medusa) y
      // restringe esto al dominio real (p. ej. { hostname: 'cdn.smartime.hn' }) para evitar
      // usar el optimizador como proxy abierto.
      { protocol: 'https', hostname: '**' },
      // Backend Medusa en local (imágenes servidas desde /static).
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  reactStrictMode: true,
  redirects,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default nextConfig
