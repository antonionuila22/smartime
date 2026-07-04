'use client'

import React, { useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { useCart } from '@/providers/Cart'

export const AddToCart: React.FC<{
  variantId?: string | null
  className?: string
  size?: ButtonProps['size']
  variant?: ButtonProps['variant']
  label?: string
  iconOnly?: boolean
}> = ({ variantId, className, size = 'default', variant = 'default', label, iconOnly = false }) => {
  const { addItem, loading } = useCart()
  const [added, setAdded] = useState(false)

  const handle = async () => {
    if (!variantId) return
    try {
      await addItem(variantId)
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1500)
    } catch {
      /* noop */
    }
  }

  if (iconOnly) {
    return (
      <Button
        onClick={handle}
        disabled={!variantId || loading}
        className={className}
        size="icon"
        variant={variant}
        aria-label="Agregar al carrito"
      >
        {added ? <Check className="animate-in zoom-in-50 duration-200" /> : <ShoppingCart />}
      </Button>
    )
  }

  return (
    <Button
      onClick={handle}
      disabled={!variantId || loading}
      className={className}
      size={size}
      variant={variant}
    >
      {/* El texto visible es el nombre accesible: así el lector anuncia «Añadido» al confirmar */}
      {added ? <Check className="animate-in zoom-in-50 duration-200" /> : <ShoppingCart />}
      {added ? 'Añadido' : (label ?? 'Agregar')}
    </Button>
  )
}
