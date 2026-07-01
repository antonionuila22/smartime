'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { medusa } from '@/lib/medusa/sdk'

const CART_KEY = 'smartime_medusa_cart_id'
const FIELDS =
  'id,currency_code,total,subtotal,item_total,*items,*items.product,*items.variant'

export type CartLine = {
  id: string
  title: string
  product_title?: string | null
  product_handle?: string | null
  thumbnail?: string | null
  quantity: number
  unit_price: number
  total: number
}

type MedusaCart = {
  id: string
  currency_code: string
  total: number
  items: CartLine[]
} | null

type CartContextValue = {
  cart: MedusaCart
  count: number
  total: number
  ready: boolean
  loading: boolean
  addItem: (variantId: string, qty?: number) => Promise<void>
  updateItem: (lineId: string, qty: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  /** Asocia el carrito anónimo al cliente recién autenticado (no pierde productos). */
  claimForCustomer: () => Promise<void>
  /** Vacía el carrito local tras completar un pedido. */
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

async function getRegionId(): Promise<string | undefined> {
  const { regions } = await medusa.store.region.list()
  return (regions.find((r) => r.currency_code === 'hnl') ?? regions[0])?.id
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<MedusaCart>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem(CART_KEY) : null
    if (!id) {
      setReady(true)
      return
    }
    medusa.store.cart
      .retrieve(id, { fields: FIELDS })
      .then(({ cart }) => setCart(cart as any))
      .catch(() => localStorage.removeItem(CART_KEY))
      .finally(() => setReady(true))
  }, [])

  // Promesa de creación EN CURSO: si dos addItem concurrentes (o un doble clic) no encuentran
  // carrito, ambos crearían uno y el segundo pisaría CART_KEY, huérfanando el ítem del primero.
  // Memoizándola, el segundo reusa la misma creación → un solo carrito, sin ítems perdidos.
  const creatingRef = useRef<Promise<string> | null>(null)

  const ensureCart = useCallback(async (): Promise<string> => {
    const existing = localStorage.getItem(CART_KEY)
    if (existing) return existing
    if (creatingRef.current) return creatingRef.current

    const creation = (async () => {
      const region_id = await getRegionId()
      const { cart: created } = await medusa.store.cart.create({ region_id })
      localStorage.setItem(CART_KEY, created.id)
      setCart(created as any)
      return created.id
    })()
    creatingRef.current = creation
    try {
      return await creation
    } finally {
      creatingRef.current = null
    }
  }, [])

  const addItem = useCallback(
    async (variantId: string, qty = 1) => {
      setLoading(true)
      try {
        const id = await ensureCart()
        const { cart: updated } = await medusa.store.cart.createLineItem(id, {
          variant_id: variantId,
          quantity: qty,
        })
        setCart(updated as any)
      } finally {
        setLoading(false)
      }
    },
    [ensureCart],
  )

  const updateItem = useCallback(
    async (lineId: string, qty: number) => {
      if (!cart) return
      setLoading(true)
      try {
        if (qty <= 0) {
          const res: any = await medusa.store.cart.deleteLineItem(cart.id, lineId)
          if (res?.parent) setCart(res.parent as any)
        } else {
          const { cart: updated } = await medusa.store.cart.updateLineItem(cart.id, lineId, {
            quantity: qty,
          })
          setCart(updated as any)
        }
      } finally {
        setLoading(false)
      }
    },
    [cart],
  )

  const removeItem = useCallback(
    async (lineId: string) => {
      if (!cart) return
      setLoading(true)
      try {
        const res: any = await medusa.store.cart.deleteLineItem(cart.id, lineId)
        if (res?.parent) setCart(res.parent as any)
      } finally {
        setLoading(false)
      }
    },
    [cart],
  )

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(CART_KEY)
    } catch {
      /* noop */
    }
    setCart(null)
  }, [])

  const claimForCustomer = useCallback(async () => {
    const id = typeof window !== 'undefined' ? localStorage.getItem(CART_KEY) : null
    if (!id) return
    try {
      // transferCart asocia el carrito al customer autenticado (requiere sesión/bearer).
      const { cart: updated } = await medusa.store.cart.transferCart(id)
      setCart(updated as any)
    } catch {
      /* si falla, el carrito sigue intacto y se reintenta en el checkout */
    }
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const items = cart?.items ?? []
    const count = items.reduce((s, i) => s + (i.quantity || 0), 0)
    return {
      cart,
      count,
      total: cart?.total ?? 0,
      ready,
      loading,
      addItem,
      updateItem,
      removeItem,
      claimForCustomer,
      clear,
    }
  }, [cart, ready, loading, addItem, updateItem, removeItem, claimForCustomer, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
