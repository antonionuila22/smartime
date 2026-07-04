'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { getPayPalInstance } from '@/lib/paypalV6'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Botón de pago con el SDK v6 de PayPal.
 * - createInstance → findEligibleMethods → createPayPalOneTimePaymentSession.
 * - Al hacer clic, `session.start` abre PayPal con la orden que YA creó el backend
 *   (initiatePaymentSession). El `orderId` es el id de la orden PayPal del provider.
 * - PRESENTACIÓN: intentamos primero `'modal'` (capa embebida → el comprador NO siente que
 *   sale del sitio), con degradación a `'popup'` y, como último recurso, `'redirect'`, por si
 *   un navegador no puede abrir el modo preferido (p. ej. popup bloqueado). PayPal exige su
 *   propio dominio para AUTENTICAR al comprador (no podemos loguearlo desde aquí): el modal es
 *   lo más cercano a "pagar dentro de la tienda".
 * - `onApprove` (tras aprobar el comprador) completa el carrito (captura) en el padre.
 */
// Orden de preferencia de presentación (mejor experiencia → más compatible).
const PRESENTATION_MODES = ['modal', 'popup', 'redirect'] as const
export const PayPalButton: React.FC<{
  orderId: string
  onApprove: () => Promise<void>
  onError?: (message: string) => void
}> = ({ orderId, onApprove, onError }) => {
  const [ready, setReady] = useState(false)
  const [eligible, setEligible] = useState<boolean | null>(null)
  const [paying, setPaying] = useState(false)
  const sessionRef = useRef<any>(null)
  const orderIdRef = useRef(orderId)
  orderIdRef.current = orderId

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const sdk = await getPayPalInstance()
        const methods = await sdk.findEligibleMethods({ currencyCode: 'USD' })
        if (cancelled) return
        const ok = typeof methods?.isEligible === 'function' ? methods.isEligible('paypal') : true
        setEligible(ok)
        if (!ok) return
        sessionRef.current = sdk.createPayPalOneTimePaymentSession({
          onApprove: async () => {
            try {
              await onApprove()
            } finally {
              setPaying(false)
            }
          },
          onCancel: () => setPaying(false),
          onError: (e: any) => {
            setPaying(false)
            onError?.(String(e?.message || e || 'Error de PayPal'))
          },
        })
        setReady(true)
      } catch (e: any) {
        if (cancelled) return
        setEligible(false)
        onError?.(String(e?.message || e || 'No se pudo inicializar PayPal'))
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = async () => {
    if (!sessionRef.current || paying) return
    setPaying(true)
    const order = Promise.resolve({ orderId: orderIdRef.current })
    // Probar los modos en orden; si uno no se puede abrir, caer al siguiente.
    for (let i = 0; i < PRESENTATION_MODES.length; i++) {
      try {
        await sessionRef.current.start({ presentationMode: PRESENTATION_MODES[i] }, order)
        return
      } catch (e: any) {
        const isLast = i === PRESENTATION_MODES.length - 1
        if (isLast) {
          setPaying(false)
          onError?.(String(e?.message || e || 'No se pudo iniciar el pago'))
        }
        // si no es el último, se intenta el siguiente modo de presentación
      }
    }
  }

  if (eligible === false) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
      >
        PayPal no está disponible en este momento. Inténtalo de nuevo o contáctanos.
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready || paying}
      aria-busy={paying}
      className="flex h-12 w-full select-none items-center justify-center gap-2 rounded-full bg-[#ffc439] font-bold text-[#003087] transition duration-300 hover:bg-[#f0b72f] hover:shadow-lg hover:shadow-[#ffc439]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
    >
      {paying ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Procesando…
        </>
      ) : !ready ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Cargando PayPal…
        </>
      ) : (
        <>Pagar con PayPal</>
      )}
    </button>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
