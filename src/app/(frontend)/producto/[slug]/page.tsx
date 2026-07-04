import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { ArrowLeft, BadgeCheck, Check, CreditCard, RotateCcw, Store, Truck } from 'lucide-react'

import { AddToCart } from '@/components/AddToCart'
import { BuyNowButton } from '@/components/BuyNowButton'
import { CuotaBadge } from '@/components/CuotaBadge'
import { ProductCarousel } from '@/components/ProductCarousel'
import { ProductGallery } from '@/components/ProductGallery'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { ReviewStars } from '@/components/ReviewStars'
import { ReviewsSection } from '@/components/ReviewsSection'
import { formatPrice, getDiscount } from '@/utilities/format'
import { getCategory, getProductByHandle, listProductReviews, listProducts } from '@/lib/medusa/data'
import { getServerSideURL } from '@/utilities/getURL'

// Cache Components: prerenderizamos cada PDP por slug. `generateStaticParams` da las muestras
// (los handles del catálogo) para que `params` sea estático; los datos vienen de la capa
// cacheada. Slugs nuevos se renderizan on-demand y se cachean.
//
// IMPORTANTE (Cache Components): esta función DEBE devolver ≥1 resultado o Next lanza
// EmptyGenerateStaticParamsError y rompe TODA la ruta. Por eso, si el backend está caído
// un instante y el catálogo llega vacío, devolvemos un slug centinela que la propia página
// resuelve a notFound() (getProductByHandle → null). Así un hipo del backend degrada a un
// 404 aislado en vez de tumbar /producto/*.
export async function generateStaticParams() {
  const products = await listProducts({ limit: 100 }).catch(() => [])
  if (products.length === 0) return [{ slug: '__placeholder__' }]
  return products.map((p) => ({ slug: p.handle }))
}

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

  // Reseñas y categoría EN PARALELO (no en cascada). El cross-sell pide solo la MISMA
  // categoría (query barata y cacheada), en vez de traer 100 productos y filtrar en memoria.
  const [{ reviews, count: reviewCount, average }, cat0] = await Promise.all([
    listProductReviews(product.id),
    product.categoryName ? getCategory(product.categoryName) : Promise.resolve(null),
  ])
  const related = cat0
    ? (await listProducts({ categoryId: cat0.id, limit: 13 }).catch(() => []))
        .filter((p) => p.handle !== product.handle)
        .slice(0, 12)
    : []

  const discount = getDiscount(product.price, product.originalPrice)
  // Urgencia: inventario rastreado (stock != null) con pocas unidades restantes.
  const lowStock =
    product.inStock && product.stock != null && product.stock > 0 && product.stock <= 5
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
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    category: cat || undefined,
    offers: {
      '@type': 'Offer',
      url: `${getServerSideURL()}/producto/${product.handle}`,
      priceCurrency: 'HNL',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
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
    <>
    <div className="container py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {/* Volver discreto: flecha con micro-desplazamiento en hover */}
      <Link
        href="/tienda"
        className="group mb-6 inline-flex items-center gap-1.5 rounded-full text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />{' '}
        Volver a la tienda
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} title={product.title} kind={kind} />

        <div className="flex flex-col lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {product.brand && (
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                {product.brand}
              </span>
            )}
            {cat && (
              <Link
                href={`/tienda?categoria=${encodeURIComponent(cat)}`}
                className="inline-flex rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-muted-foreground transition duration-300 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {cat}
              </Link>
            )}
          </div>

          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {product.title}
          </h1>

          {reviewCount > 0 && (
            <a
              href="#reviews"
              className="mt-2.5 inline-flex w-fit items-center gap-2 rounded-full hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <ReviewStars rating={average} count={reviewCount} />
            </a>
          )}

          {/* Tarjeta de compra: precio → ahorro → cuotas → confianza → CTAs */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 hover:shadow-md sm:p-6">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                {formatPrice(product.price)}
              </span>
              {discount && (
                <span className="pb-1.5 text-lg tabular-nums text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {discount && (
                <span className="mb-1.5 rounded-full bg-sale px-2.5 py-0.5 text-xs font-bold text-sale-foreground">
                  -{discount.percent}%
                </span>
              )}
            </div>
            {discount && (
              <span className="mt-2 inline-flex w-fit rounded-full bg-sale/10 px-2.5 py-0.5 text-sm font-semibold text-sale">
                Ahorras {formatPrice(discount.save)}
              </span>
            )}

            <div className="mt-3">
              <CuotaBadge price={product.price} variant="full" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
              {product.inStock ? (
                lowStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sale/10 px-2.5 py-1 font-semibold text-sale">
                    <Check className="size-4" /> ¡Solo quedan {product.stock}!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-in-stock/10 px-2.5 py-1 font-semibold text-in-stock">
                    <Check className="size-4" /> En stock
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
                  Agotado
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Truck className="size-4 shrink-0" /> Recíbelo en 24-48h
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Store className="size-4 shrink-0" /> Retiro en Tegucigalpa / SPS
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <AddToCart
                size="xl"
                className="flex-1"
                label="Agregar al carrito"
                variantId={product.variantId}
                inStock={product.inStock}
              />
              <BuyNowButton
                variantId={product.variantId}
                className="flex-1"
                inStock={product.inStock}
              />
            </div>
          </div>

          {product.description && (
            <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          {/* Beneficios: iconos alineados a la primera línea, lead fuerte + detalle en muted */}
          <ul className="mt-6 grid gap-3.5 border-t border-border pt-6 text-sm">
            <li className="flex items-start gap-2.5">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="leading-relaxed">
                <span className="font-medium text-foreground">Apple original, nuevo y sellado</span>{' '}
                <span className="text-muted-foreground">— con garantía y factura</span>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="leading-relaxed">
                <span className="font-medium text-foreground">Cuotas sin intereses</span>{' '}
                <span className="text-muted-foreground">— con tarjetas participantes</span>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <RotateCcw className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="leading-relaxed">
                <span className="font-medium text-foreground">7 días para cambios o devoluciones</span>{' '}
                <span className="text-muted-foreground">— sin complicaciones</span>
              </span>
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

      {related.length > 0 && (
        <ProductCarousel title="También te puede interesar" products={related} />
      )}
      <RecentlyViewed
        current={{
          id: product.id,
          handle: product.handle,
          title: product.title,
          image: product.image,
          price: product.price,
          currencyCode: product.currencyCode,
        }}
        title="Vistos recientemente"
      />
    </>
  )
}
