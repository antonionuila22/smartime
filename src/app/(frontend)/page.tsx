import type { Metadata } from 'next'
import React from 'react'
import { CreditCard, Headphones, ShieldCheck, Truck } from 'lucide-react'

import { HeroCarousel, type HeroSlide } from '@/components/HeroCarousel'
import { ProductCarousel } from '@/components/ProductCarousel'
import { BrandStrip } from '@/components/BrandStrip'
import { CategoryGrid, type CatTile } from '@/components/CategoryGrid'
import { PromoBanner } from '@/components/PromoBanner'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { TrustBand } from '@/components/TrustBand'
import { JsonLd } from '@/components/JsonLd'
import { listCategories, listProducts } from '@/lib/medusa/data'
import type { ViewProduct } from '@/lib/medusa/types'
import { organizationJsonLd, websiteJsonLd } from '@/utilities/structuredData'
import { getServerSideURL } from '@/utilities/getURL'

// Cache Components: la home consume solo datos cacheados (`'use cache'` en lib/medusa/data.ts),
// así que se prerenderiza completa en el shell estático. Sin `revalidate` a nivel de ruta: el TTL
// lo gobierna `cacheLife` en la capa de datos.

export const metadata: Metadata = {
  // `absolute` evita el sufijo "— smartime" de la plantilla (el título ya lleva la marca).
  title: { absolute: 'smartime — Tecnología que te conecta | Honduras' },
  description:
    'Apple, electrodomésticos, audio, gaming y smart home con garantía y envío a todo Honduras. Precios en Lempiras y cuotas sin intereses.',
  alternates: { canonical: '/' },
}

const PROMO_TILES = [
  { icon: Truck, title: 'Envío a todo Honduras', desc: 'Recíbelo en 24-48h' },
  { icon: CreditCard, title: 'Hasta 12 meses', desc: 'Sin intereses' },
  { icon: ShieldCheck, title: 'Garantía y originales', desc: 'Productos sellados' },
  { icon: Headphones, title: 'Asesoría experta', desc: 'Te ayudamos a elegir' },
]

export default async function HomePage() {
  // Independientes → en paralelo (recomendación Next 16: no encadenar awaits sin dependencia).
  const [products, categories] = await Promise.all([
    listProducts({ limit: 100 }).catch((): ViewProduct[] => []),
    listCategories().catch(() => []),
  ])

  // Agrupar por categoría
  const byCat = new Map<string, ViewProduct[]>()
  for (const p of products) {
    const c = p.categoryName ?? 'Otros'
    if (!byCat.has(c)) byCat.set(c, [])
    byCat.get(c)!.push(p)
  }

  const catTiles: CatTile[] = categories
    .map((c) => {
      const items = byCat.get(c.name) ?? []
      return {
        name: c.name,
        href: `/tienda?categoria=${c.handle ?? c.id}`,
        image: items[0]?.image,
        count: items.length,
      }
    })
    .filter((t) => t.count > 0)

  const ofertas = products.filter((p) => p.originalPrice)
  const featured = products.slice(0, 12)
  const bySlug = (h: string) => products.find((p) => p.handle === h)

  const slides: HeroSlide[] = [
    bySlug('macbook-air-13-m3') && {
      eyebrow: 'Mac',
      title: bySlug('macbook-air-13-m3')!.title,
      subtitle: 'Potencia profesional y batería para todo el día.',
      cta: 'Comprar ahora',
      href: `/producto/macbook-air-13-m3`,
      image: bySlug('macbook-air-13-m3')!.image,
      price: bySlug('macbook-air-13-m3')!.price,
      gradient: 'from-[#1e3a8a] to-[#0b1220]',
    },
    bySlug('iphone-15-pro') && {
      eyebrow: 'iPhone',
      title: bySlug('iphone-15-pro')!.title,
      subtitle: 'Titanio. Chip A17 Pro. La mejor cámara de iPhone.',
      cta: 'Comprar ahora',
      href: `/producto/iphone-15-pro`,
      image: bySlug('iphone-15-pro')!.image,
      price: bySlug('iphone-15-pro')!.price,
      gradient: 'from-[#172554] to-[#0b1220]',
    },
    bySlug('playstation-5') && {
      eyebrow: 'Gaming',
      title: 'PlayStation 5',
      subtitle: 'Juegos de nueva generación con velocidad de carga ultrarrápida.',
      cta: 'Ver consola',
      href: `/producto/playstation-5`,
      image: bySlug('playstation-5')!.image,
      price: bySlug('playstation-5')!.price,
      gradient: 'from-[#0b1220] to-[#1e3a8a]',
    },
    {
      eyebrow: 'Hasta 12 meses sin intereses',
      title: 'Equipa tu hogar y tu vida',
      subtitle: 'Apple, electrodomésticos, audio y más. Paga en cómodas cuotas.',
      cta: 'Ver ofertas',
      href: `/tienda?oferta=1`,
      image: bySlug('smart-tv-samsung-55')?.image ?? bySlug('dyson-cordless')?.image,
      price: bySlug('smart-tv-samsung-55')?.price,
      gradient: 'from-[#1e3a8a] via-[#1e40af] to-[#0b1220]',
    },
  ].filter(Boolean) as HeroSlide[]

  // Carruseles por categoría (en el orden de las categorías)
  const categoryRows = categories
    .map((c) => ({ c, items: byCat.get(c.name) ?? [] }))
    .filter((r) => r.items.length > 0)

  const base = getServerSideURL()

  return (
    <div className="flex flex-col">
      {/* Entidad de marca + WebSite con búsqueda para la sitelinks searchbox de Google. */}
      <JsonLd data={[organizationJsonLd(base), websiteJsonLd(base)]} />
      <section className="container pt-6 md:pt-8">
        <HeroCarousel slides={slides} />
        {/* Beneficios rápidos bajo el hero: sombra solo en hover para mantener el fondo limpio */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {PROMO_TILES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-md md:p-5"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary md:size-12">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BrandStrip />

      <CategoryGrid categories={catTiles} />

      {ofertas.length > 0 && (
        <ProductCarousel title="Ofertas de la semana" viewAllHref="/tienda?oferta=1" products={ofertas} />
      )}

      <ProductCarousel title="Destacados" viewAllHref="/tienda" products={featured} />

      <PromoBanner />

      {categoryRows.map(({ c, items }) => (
        <ProductCarousel
          key={c.id}
          title={c.name}
          viewAllHref={`/tienda?categoria=${c.handle ?? c.id}`}
          products={items}
        />
      ))}

      <RecentlyViewed />

      <TrustBand />
    </div>
  )
}
