import * as React from 'react'
import { CircleAlert } from 'lucide-react'

import { cn } from '@/utilities/ui'

/**
 * Mensaje de error/aviso accesible: DUEÑO ÚNICO del patrón `role="alert"` + icono de alerta, que
 * antes estaba copy-pasteado ~10 veces (login, registro, checkout, carrito, direcciones, AddToCart,
 * BuyNowButton, PayPalButton). Dos formas:
 *  - `inline` (por defecto): texto pequeño bajo un campo/control.
 *  - `banner`: caja con borde y fondo para errores a nivel de sección (p. ej. el error global del checkout).
 * Renderiza `null` si no hay mensaje, para poder usarlo directamente con estado nullable.
 */
export const InlineError: React.FC<{
  children?: React.ReactNode
  variant?: 'inline' | 'banner'
  className?: string
  id?: string
  ref?: React.Ref<HTMLParagraphElement>
}> = ({ children, variant = 'inline', className, id, ref }) => {
  if (!children) return null
  const banner = variant === 'banner'
  return (
    <p
      ref={ref}
      id={id}
      role="alert"
      className={cn(
        'flex items-start font-medium text-destructive',
        banner
          ? 'gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm'
          : 'gap-1.5 text-xs',
        className,
      )}
    >
      <CircleAlert
        className={cn('shrink-0', banner ? 'mt-0.5 size-4' : 'mt-px size-3.5')}
        aria-hidden="true"
      />
      <span>{children}</span>
    </p>
  )
}
