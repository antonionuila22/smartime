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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      // Backend Medusa en local (imágenes servidas desde /static).
      { protocol: 'http', hostname: 'localhost' },
      // TODO: añade aquí el dominio real del backend/CDN en producción, p. ej.:
      // { protocol: 'https', hostname: 'api.smartime.hn' },
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
