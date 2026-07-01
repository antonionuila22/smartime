'use client'

import React, { useEffect, useState } from 'react'

import { ProductCarousel } from '@/components/ProductCarousel'
import { getRecentlyViewed, recordRecentlyViewed, type RecentItem } from '@/lib/recentlyViewed'
import type { ViewProduct } from '@/lib/medusa/types'

function toView(i: RecentItem): ViewProduct {
  return {
    id: i.id,
    handle: i.handle,
    title: i.title,
    image: i.image ?? null,
    images: i.image ? [i.image] : [],
    price: i.price,
    currencyCode: i.currencyCode ?? 'hnl',
    inStock: true,
  }
}

/**
 * Fila de "Vistos recientemente". Si se pasa `current`, lo registra al montar
 * (úsalo en la PDP) y lo excluye de la lista mostrada. En la home, omite `current`.
 * Solo renderiza tras montar (lee localStorage) para evitar desajustes de hidratación.
 */
export const RecentlyViewed: React.FC<{
  current?: RecentItem
  title?: string
}> = ({ current, title = 'Vistos recientemente' }) => {
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    if (current) recordRecentlyViewed(current)
    const all = getRecentlyViewed().filter((i) => i.id !== current?.id)
    setItems(all)
  }, [current])

  if (items.length === 0) return null

  return <ProductCarousel title={title} products={items.map(toView)} />
}
