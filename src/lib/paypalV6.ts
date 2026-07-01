/**
 * Carga del SDK JavaScript v6 de PayPal (https://docs.paypal.ai/.../sdk/js/v6/configuration).
 * Es un script de CDN (no paquete npm). Expone `window.paypal.createInstance`.
 *
 * Sandbox vs live se decide por NEXT_PUBLIC_PAYPAL_ENVIRONMENT (default sandbox).
 * El clientId es público (NEXT_PUBLIC_PAYPAL_CLIENT_ID).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

let instancePromise: Promise<any> | null = null

function scriptUrl(): string {
  const env = (process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || 'sandbox').toLowerCase()
  const live = env === 'live' || env === 'production'
  return live
    ? 'https://www.paypal.com/web-sdk/v6/core'
    : 'https://www.sandbox.paypal.com/web-sdk/v6/core'
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('PayPal SDK solo se carga en el navegador'))
      return
    }
    if ((window as any).paypal?.createInstance) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-v6]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK de PayPal')))
      return
    }
    const s = document.createElement('script')
    s.src = scriptUrl()
    s.async = true
    s.setAttribute('data-paypal-v6', 'true')
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal'))
    document.head.appendChild(s)
  })
}

/** Devuelve (cacheada) la instancia del SDK v6 lista para usar. */
export async function getPayPalInstance(): Promise<any> {
  if (instancePromise) return instancePromise
  instancePromise = (async () => {
    await loadScript()
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    if (!clientId) {
      throw new Error('Falta NEXT_PUBLIC_PAYPAL_CLIENT_ID en el storefront')
    }
    return (window as any).paypal.createInstance({
      clientId,
      components: ['paypal-payments'],
      pageType: 'checkout',
    })
  })().catch((e) => {
    instancePromise = null // permite reintentar si falló la carga
    throw e
  })
  return instancePromise
}
/* eslint-enable @typescript-eslint/no-explicit-any */
