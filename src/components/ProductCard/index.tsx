import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Laptop, Package, Smartphone } from 'lucide-react'

import { AddToCart } from '@/components/AddToCart'
import { Badge } from '@/components/ui/badge'
import { CuotaBadge } from '@/components/CuotaBadge'
import { ReviewStars } from '@/components/ReviewStars'
import { WishlistButton } from '@/components/WishlistButton'
import { formatPrice, getDiscount } from '@/utilities/format'
import { cn } from '@/utilities/ui'
import type { ViewProduct } from '@/lib/medusa/types'

export const ProductCard: React.FC<{ product: ViewProduct; className?: string }> = ({
  product,
  className,
}) => {
  const href = `/producto/${product.handle}`
  const discount = getDiscount(product.price, product.originalPrice)
  const cat = product.categoryName ?? ''
  const label = product.brand || cat
  const PlaceholderIcon = /iphone/i.test(cat) ? Smartphone : /mac/i.test(cat) ? Laptop : Package
  const hasReviews = (product.reviewCount ?? 0) > 0
  // Urgencia: solo cuando el inventario se rastrea (stock != null) y quedan pocas unidades.
  const lowStock =
    product.inStock && product.stock != null && product.stock > 0 && product.stock <= 5

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10',
        className,
      )}
    >
      <Link
        href={href}
        aria-label={product.title}
        className="relative block aspect-square overflow-hidden bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <PlaceholderIcon className="size-16 text-primary/30" strokeWidth={1.25} />
          </div>
        )}
        {discount && (
          <Badge variant="sale" className="absolute left-3 top-3 font-bold tabular-nums shadow-sm">
            −{discount.percent}%
          </Badge>
        )}
        {!product.inStock && (
          <Badge variant="muted" className="absolute bottom-3 left-3 shadow-sm">
            Agotado
          </Badge>
        )}
      </Link>

      <WishlistButton
        floating
        className="absolute right-3 top-3 z-10"
        product={{
          id: product.id,
          handle: product.handle,
          title: product.title,
          image: product.image,
          price: product.price,
          variantId: product.variantId,
        }}
      />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {label && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
            {label}
          </span>
        )}
        <Link
          href={href}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-snug transition-colors duration-300 group-hover:text-primary">
            {product.title}
          </h3>
        </Link>

        {hasReviews ? (
          <ReviewStars rating={product.rating ?? 0} count={product.reviewCount} />
        ) : (
          <span className="text-xs text-muted-foreground">Sé el primero en opinar</span>
        )}

        {/* Bloque de precio: jerarquía precio → tachado → ahorro → cuota */}
        <div className="mt-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
              {formatPrice(product.price)}
            </span>
            {discount && (
              <span className="text-sm tabular-nums text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {discount && (
            <span className="text-xs font-medium text-sale">
              Ahorras {formatPrice(discount.save)}
            </span>
          )}
          <CuotaBadge price={product.price} variant="compact" />
        </div>

        {/* Zona inferior anclada: disponibilidad + CTA (visible en móvil, revelado en hover en desktop) */}
        <div className="mt-auto border-t border-border/60 pt-3">
          {product.inStock ? (
            lowStock ? (
              <span className="text-xs font-semibold text-sale">
                ¡Solo quedan {product.stock}!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-in-stock">
                <span className="size-1.5 rounded-full bg-in-stock" aria-hidden /> Disponible
              </span>
            )
          ) : (
            <span className="text-xs font-medium text-muted-foreground">Agotado</span>
          )}
          <div className="mt-2.5 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            {/* Objetivo táctil móvil: el botón (h-10=40px) sube a min 44px vía el div contenedor;
                en desktop (md+) se restablece a 40px para no alterar el layout de la tarjeta. */}
            <AddToCart
              className="w-full [&>button]:min-h-11 md:[&>button]:min-h-0"
              label="Agregar al carrito"
              variantId={product.variantId}
              inStock={product.inStock}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
