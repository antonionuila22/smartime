'use client'

import React, { useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'

import { InlineError } from '@/components/ui/inline-error'

import { Button, type ButtonProps } from '@/components/ui/button'
import { useCart } from '@/providers/Cart'
import { cn } from '@/utilities/ui'

export const AddToCart: React.FC<{
  variantId?: string | null
  className?: string
  size?: ButtonProps['size']
  variant?: ButtonProps['variant']
  label?: string
  iconOnly?: boolean
  inStock?: boolean
}> = ({
  variantId,
  className,
  size = 'default',
  variant = 'default',
  label,
  iconOnly = false,
  inStock = true,
}) => {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  // Estado de error local: si addItem falla lo mostramos inline en vez de tragarlo (catch silencioso)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (!variantId) return
    setError(null)
    // Feedback OPTIMISTA: el check ✓ aparece al instante (y el badge del carrito ya sube por el
    // conteo optimista del provider); la escritura al servidor —lenta contra la DB remota— va
    // detrás. El botón NO se bloquea, así se pueden añadir varias unidades sin esperar.
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
    try {
      await addItem(variantId)
    } catch {
      // Si la escritura falla, revertimos el check y avisamos (el provider ya revirtió el conteo).
      setAdded(false)
      setError('No se pudo agregar al carrito. Inténtalo de nuevo.')
    }
  }

  // Mensaje de error inline bajo el botón (primitivo compartido del design system)
  const errorAlert = <InlineError>{error}</InlineError>

  // Producto agotado: botón deshabilitado sin lógica de carrito. Respeta iconOnly.
  if (!inStock) {
    return (
      <Button
        disabled
        aria-disabled
        className={className}
        size={iconOnly ? 'icon' : size}
        variant={variant}
        aria-label={iconOnly ? 'Agotado' : undefined}
      >
        <ShoppingCart />
        {!iconOnly && 'Agotado'}
      </Button>
    )
  }

  if (iconOnly) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <Button
          onClick={handle}
          disabled={!variantId}
          className={className}
          size="icon"
          variant={variant}
          aria-label="Agregar al carrito"
        >
          {added ? <Check className="animate-in zoom-in-50 duration-200" /> : <ShoppingCart />}
        </Button>
        {errorAlert}
      </div>
    )
  }

  // Envolvemos en flex-col para apilar el error bajo el botón; el className de layout (flex-1/w-full)
  // pasa al contenedor y el botón ocupa todo el ancho, conservando la disposición previa.
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Button
        onClick={handle}
        disabled={!variantId}
        className="w-full"
        size={size}
        variant={variant}
      >
        {/* El texto visible es el nombre accesible: así el lector anuncia «Añadido» al confirmar */}
        {added ? <Check className="animate-in zoom-in-50 duration-200" /> : <ShoppingCart />}
        {added ? 'Añadido' : (label ?? 'Agregar')}
      </Button>
      {errorAlert}
    </div>
  )
}
