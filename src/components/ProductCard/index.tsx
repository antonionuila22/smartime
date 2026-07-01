import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Laptop, Package, Smartphone } from 'lucide-react'

import { AddToCart } from '@/components/AddToCart'
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

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10',
        className,
      )}
    >
      <Link href={href} className="relative block aspect-square overflow-hidden bg-white">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <PlaceholderIcon className="size-16 text-primary/30" strokeWidth={1.25} />
          </div>
        )}
        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-sale px-2 py-0.5 text-xs font-bold text-sale-foreground shadow-sm">
            -{discount.percent}%
          </span>
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
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
            {product.title}
          </h3>
        </Link>

        {hasReviews ? (
          <ReviewStars rating={product.rating ?? 0} count={product.reviewCount} />
        ) : (
          <span className="text-xs text-muted-foreground">Sé el primero en opinar</span>
        )}

        <div className="mt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">{formatPrice(product.price)}</span>
            {discount && (
              <span className="text-sm text-muted-foreground line-through">
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

        <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-in-stock">
          <span className="size-1.5 rounded-full bg-in-stock" aria-hidden /> Disponible
        </span>

        <div className="mt-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <AddToCart className="w-full" label="Agregar al carrito" variantId={product.variantId} />
        </div>
      </div>
    </div>
  )
}
