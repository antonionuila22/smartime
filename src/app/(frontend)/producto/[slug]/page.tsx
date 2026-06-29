import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { ArrowLeft, BadgeCheck, Check, CreditCard, RotateCcw, Store, Truck } from 'lucide-react'

import { AddToCart } from '@/components/AddToCart'
import { BuyNowButton } from '@/components/BuyNowButton'
import { CuotaBadge } from '@/components/CuotaBadge'
import { ProductGallery } from '@/components/ProductGallery'
import { ReviewStars } from '@/components/ReviewStars'
import { ReviewsSection } from '@/components/ReviewsSection'
import { formatPrice, getDiscount } from '@/utilities/format'
import { getProductByHandle, listProductReviews } from '@/lib/medusa/data'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductByHandle(slug).catch(() => null)
  if (!product) return { title: 'Producto no encontrado — smartime' }
  return { title: `${product.title} — smartime`, description: product.description ?? undefined }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductByHandle(slug).catch(() => null)
  if (!product) notFound()

  const { reviews, count: reviewCount, average } = await listProductReviews(product.id)
  const discount = getDiscount(product.price, product.originalPrice)
  const cat = product.categoryName ?? ''
  const kind: 'mac' | 'iphone' | 'other' = /iphone/i.test(cat)
    ? 'iphone'
    : /mac/i.test(cat)
      ? 'mac'
      : 'other'
  const images = product.images.map((url) => ({ url, alt: product.title }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? undefined,
    image: product.images.length ? product.images : undefined,
    brand: { '@type': 'Brand', name: 'Apple' },
    category: cat || undefined,
    offers: {
      '@type': 'Offer',
      url: `${getServerSideURL()}/producto/${product.handle}`,
      priceCurrency: 'HNL',
      price: product.price,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: average,
            reviewCount,
          },
        }
      : {}),
  }

  return (
    <div className="container py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Link
        href="/tienda"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={images} title={product.title} kind={kind} />

        <div className="flex flex-col lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {product.brand && (
              <span className="text-xs font-bold uppercase tracking-wide text-primary">
                {product.brand}
              </span>
            )}
            {cat && (
              <Link
                href={`/tienda?categoria=${encodeURIComponent(cat)}`}
                className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-primary"
              >
                {cat}
              </Link>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{product.title}</h1>

          {reviewCount > 0 && (
            <a href="#reviews" className="mt-2 inline-flex w-fit items-center gap-2 hover:underline">
              <ReviewStars rating={average} count={reviewCount} />
            </a>
          )}

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {discount && (
              <span className="pb-1 text-lg text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {discount && (
              <span className="mb-1 rounded-full bg-[#dc2626] px-2 py-0.5 text-xs font-bold text-white">
                -{discount.percent}%
              </span>
            )}
          </div>
          {discount && (
            <span className="mt-1 text-sm font-medium text-[#dc2626]">
              Ahorras {formatPrice(discount.save)}
            </span>
          )}

          <CuotaBadge price={product.price} variant="full" />

          {product.description && (
            <p className="mt-4 text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#16a34a]">
              <Check className="size-4" /> En stock
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Truck className="size-4" /> Recíbelo en 24-48h
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Store className="size-4" /> Retiro en Tegucigalpa / SPS
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToCart
              size="lg"
              className="flex-1"
              label="Agregar al carrito"
              variantId={product.variantId}
            />
            <BuyNowButton variantId={product.variantId} className="flex-1" />
          </div>

          <ul className="mt-6 grid gap-2.5 border-t pt-6 text-sm">
            <li className="flex items-center gap-2.5">
              <BadgeCheck className="size-4 shrink-0 text-primary" /> Apple original, nuevo y sellado
              — con garantía y factura
            </li>
            <li className="flex items-center gap-2.5">
              <CreditCard className="size-4 shrink-0 text-primary" /> Cuotas sin intereses con
              tarjetas participantes
            </li>
            <li className="flex items-center gap-2.5">
              <RotateCcw className="size-4 shrink-0 text-primary" /> 7 días para cambios o
              devoluciones
            </li>
          </ul>
        </div>
      </div>

      <ReviewsSection
        productId={product.id}
        initialReviews={reviews}
        average={average}
        count={reviewCount}
      />
    </div>
  )
}
