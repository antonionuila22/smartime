'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { getPayPalInstance } from '@/lib/paypalV6'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Botón de pago con el SDK v6 de PayPal.
 * - createInstance → findEligibleMethods → createPayPalOneTimePaymentSession.
 * - Al hacer clic, `session.start({presentationMode:'auto'}, {orderId})` abre PayPal
 *   con la orden que YA creó el backend (initiatePaymentSession). El `orderId` es el
 *   id de la orden PayPal devuelto por el provider de Medusa.
 * - `onApprove` (tras aprobar el comprador) completa el carrito (captura) en el padre.
 */
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
    try {
      await sessionRef.current.start(
        { presentationMode: 'auto' },
        Promise.resolve({ orderId: orderIdRef.current }),
      )
    } catch (e: any) {
      setPaying(false)
      onError?.(String(e?.message || e || 'No se pudo iniciar el pago'))
    }
  }

  if (eligible === false) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
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
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ffc439] font-bold text-[#003087] shadow-sm transition hover:bg-[#f0b72f] active:scale-[0.99] disabled:opacity-60"
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
