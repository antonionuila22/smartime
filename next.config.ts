import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

// URL del backend Medusa (mismo valor que consume el SDK del cliente). Debe figurar en
// `connect-src` porque el navegador hace fetch directo a esa API desde el storefront.
// PRODUCCIÓN: sustituye/añade aquí el dominio real del backend desplegado
// (p. ej. 'https://api.smartime.hn'); las llamadas fallarán si no está en la lista.
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'http://localhost:9000'

// Content-Security-Policy PRAGMÁTICA: pensada para NO romper la app (PPR + SDK de PayPal v6 +
// imágenes de CDNs externos + el script de tema inline + el runtime de Next). Notas de diseño:
//   - script-src incluye 'unsafe-inline' A PROPÓSITO: el script de tema (anti-flash de modo
//     oscuro) va inline en el <head> y Next/PPR también inyecta scripts inline. Por eso NO se
//     usan nonces: un nonce invalidaría 'unsafe-inline' y ese script inline dejaría de ejecutar.
//   - img-src permite https: y data: porque el catálogo (seed) enlaza imágenes de hosts
//     externos variados (Amazon, Apple, Wikimedia…) y next/image emite algún data: URI.
//   - connect-src abre PayPal + el backend Medusa (fetch del SDK y del checkout).
//   - frame-src/style-src cubren el iframe y los estilos que inyecta el SDK de PayPal.
//   - object-src 'none' + base-uri 'self' + form-action 'self' endurecen vectores clásicos.
// IMPORTANTE: verifica en el NAVEGADOR (consola → violaciones de CSP) el flujo real de pago con
// PayPal y la carga de imágenes; si PayPal introduce nuevos hosts (p. ej. objects/c.paypal.com)
// o algún CDN de imagen se bloquea, añádelos a la directiva correspondiente.
// Solo en DESARROLLO: React/Next usan eval() para HMR y herramientas de depuración, que la CSP
// bloquea sin 'unsafe-eval'. En PRODUCCIÓN React nunca usa eval(), así que NO lo incluimos ahí
// (mantener 'unsafe-eval' fuera de prod es justo el punto de la CSP).
const isDev = process.env.NODE_ENV !== 'production'
const scriptSrc =
  "script-src 'self' 'unsafe-inline'" +
  (isDev ? " 'unsafe-eval'" : '') +
  ' https://www.paypal.com https://www.sandbox.paypal.com https://www.paypalobjects.com'

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  `connect-src 'self' https://www.paypal.com https://www.sandbox.paypal.com ${MEDUSA_BACKEND_URL}`,
  "frame-src https://www.paypal.com https://www.sandbox.paypal.com",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

// Cabeceras de seguridad aplicadas a todas las rutas.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS solo surte efecto sobre HTTPS; los navegadores lo ignoran en HTTP local.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Content-Security-Policy: ver el bloque de notas arriba. Verificar en navegador (PayPal + imágenes).
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
]

const nextConfig: NextConfig = {
  // Cache Components (Next 16): habilita la directiva `'use cache'` + `cacheLife`/`cacheTag`
  // y el Partial Prerendering (shell estático + huecos dinámicos en streaming) por defecto.
  cacheComponents: true,
  // React Compiler (React 19 + Next 16): auto-memoiza componentes (menos re-renders sin
  // useMemo/useCallback/memo manuales). Conservador por diseño: omite los componentes que no
  // puede optimizar con seguridad, no los rompe. Beneficia la superficie cliente (carrito,
  // checkout, cuenta, header). Requiere babel-plugin-react-compiler.
  //
  // SOLO EN PRODUCCIÓN: su beneficio es en RUNTIME (memoización del build). En `next dev` el
  // plugin Babel corre en cada compilación en caliente y multiplica el tiempo de compilación de
  // la primera visita a cada ruta (medido: una PDP tardaba ~14s en compilar en dev). Desactivarlo
  // en dev recorta esa compilación drásticamente sin cambiar el bundle de producción.
  reactCompiler: !isDev,
  experimental: {
    // Inserta el CSS crítico EN LÍNEA en el <head> en vez de un <link> que bloquea el render.
    // Recomendación de rendimiento de Next 16: mejora el LCP en la primera carga (evita un
    // round-trip que bloquea la pintura). Tailwind v4 genera un CSS compacto, ideal para esto.
    inlineCss: true,
  },
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
