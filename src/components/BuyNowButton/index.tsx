'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCart } from '@/providers/Cart'
import { cn } from '@/utilities/ui'

/** "Comprar ahora": agrega al carrito y va directo al checkout. */
export const BuyNowButton: React.FC<{
  variantId?: string | null
  className?: string
}> = ({ variantId, className }) => {
  const { addItem } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!variantId) return
    setLoading(true)
    try {
      await addItem(variantId)
      router.push('/checkout')
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handle}
      disabled={!variantId || loading}
      variant="outline"
      size="xl"
      // Misma altura que "Agregar al carrito" (xl) para que el par de CTAs quede alineado
      className={cn('transition duration-300 hover:border-primary/40', className)}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Zap className="size-4 fill-current" />
      )}
      Comprar ahora
    </Button>
  )
}
