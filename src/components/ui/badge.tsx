import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utilities/ui'

/**
 * Insignia de estado/etiqueta. Reemplaza los ~16 `<span>` de píldora hechos a mano con las mismas
 * combinaciones de tokens. Las variantes mapean a los tokens de color ya definidos en globals.css
 * (sale, in-stock, primary, muted), así que respetan claro/oscuro automáticamente.
 */
const badgeVariants = cva('inline-flex items-center gap-1 rounded-full font-semibold', {
  variants: {
    variant: {
      sale: 'bg-sale text-sale-foreground',
      success: 'bg-in-stock/10 text-in-stock',
      primary: 'bg-primary/10 text-primary',
      muted: 'bg-muted text-muted-foreground',
      outline: 'border border-border text-foreground',
      onDark: 'bg-white/15 text-white ring-1 ring-white/20 backdrop-blur',
    },
    size: {
      sm: 'px-2 py-0.5 text-[11px]',
      md: 'px-2.5 py-1 text-xs',
    },
  },
  defaultVariants: { variant: 'muted', size: 'md' },
})

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export const Badge: React.FC<BadgeProps> = ({ className, variant, size, ...props }) => (
  <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
)

export { badgeVariants }
