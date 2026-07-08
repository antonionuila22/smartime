/** Forma normalizada de producto que consumen los componentes de UI del storefront. */
export type ViewProduct = {
  id: string
  handle: string
  title: string
  description?: string | null
  image?: string | null
  images: string[]
  price: number
  originalPrice?: number | null
  currencyCode: string
  categoryName?: string | null
  /** Todas las categorías a las que pertenece (ids). Permite filtrar en memoria por categoría
   *  igual que el backend (`category_id`), incluso con productos multi-categoría. Opcional: los
   *  ítems reconstruidos desde localStorage (favoritos/vistos) no llevan categorías. */
  categoryIds?: string[]
  brand?: string | null
  variantId?: string | null
  inStock: boolean
  /** Unidades disponibles cuando el inventario se rastrea sin backorder; null = no rastreado / ilimitado. */
  stock?: number | null
  rating?: number | null
  reviewCount?: number
}

/** Reseña de producto (Store API de Medusa). */
export type ReviewItem = {
  id: string
  title?: string | null
  content: string
  rating: number
  first_name: string
  last_name?: string | null
  verified: boolean
  created_at: string
}
