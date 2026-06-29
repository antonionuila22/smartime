'use client'

import React, { createContext, use, useEffect, useState } from 'react'

export type WishItem = {
  id: string
  handle: string
  title: string
  image?: string | null
  price: number
  variantId?: string | null
}

type WishlistContextType = {
  items: WishItem[]
  count: number
  has: (id: string) => boolean
  toggle: (item: WishItem) => void
  remove: (id: string) => void
  ready: boolean
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  count: 0,
  has: () => false,
  toggle: () => {},
  remove: () => {},
  ready: false,
})

const KEY = 'smartime_wishlist'

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<WishItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      /* noop */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* noop */
    }
  }, [items, ready])

  const has = (id: string) => items.some((i) => i.id === id)
  const toggle = (item: WishItem) =>
    setItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [item, ...prev],
    )
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  return (
    <WishlistContext value={{ items, count: items.length, has, toggle, remove, ready }}>
      {children}
    </WishlistContext>
  )
}

export const useWishlist = (): WishlistContextType => use(WishlistContext)
