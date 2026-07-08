'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleAlert, Loader2, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCart } from '@/providers/Cart'
import { cn } from '@/utilities/ui'

/** "Comprar ahora": agrega al carrito y va directo al checkout. */
export const BuyNowButton: React.FC<{
  variantId?: string | null
  className?: string
  inStock?: boolean
}> = ({ variantId, className, inStock = true }) => {
  const { addItem } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  // Estado de error local: si addItem falla NO navegamos y avisamos al usuario en vez de tragarlo
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (!variantId) return
    setError(null)
    setLoading(true)
    try {
      await addItem(variantId)
      router.push('/checkout')
    } catch {
      // Fallo: no navegamos, restauramos el botón y mostramos el error inline
      setError('No se pudo iniciar la compra. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  // Producto agotado: botón deshabilitado sin lógica de compra.
  if (!inStock) {
    return (
      <Button
        disabled
        aria-disabled
        variant="outline"
        size="xl"
        className={cn('transition duration-300', className)}
      >
        <Zap className="size-4 fill-current" />
        Agotado
      </Button>
    )
  }

  // Envolvemos en flex-col para apilar el error bajo el botón; el className de layout (flex-1)
  // pasa al contenedor y el botón ocupa todo el ancho, conservando la disposición previa.
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Button
        onClick={handle}
        disabled={!variantId || loading}
        variant="outline"
        size="xl"
        // Misma altura que "Agregar al carrito" (xl) para que el par de CTAs quede alineado
        className="w-full transition duration-300 hover:border-primary/40"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Zap className="size-4 fill-current" />
        )}
        Comprar ahora
      </Button>
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-destructive">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
