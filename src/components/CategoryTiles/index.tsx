import Link from 'next/link'
import React from 'react'
import { ArrowRight, Laptop, Smartphone } from 'lucide-react'

export const CategoryTiles: React.FC<{
  macImage?: string | null
  iphoneImage?: string | null
}> = ({ macImage, iphoneImage }) => {
  const TILES = [
    {
      title: 'Mac',
      desc: 'Portátiles y de escritorio',
      href: '/tienda?categoria=mac',
      icon: Laptop,
      image: macImage,
      gradient: 'from-primary/10 to-primary/5',
    },
    {
      title: 'iPhone',
      desc: 'El último iPhone, original',
      href: '/tienda?categoria=iphone',
      icon: Smartphone,
      image: iphoneImage,
      gradient: 'from-accent to-accent/40',
    },
  ]

  return (
    <section className="container py-12 md:py-16">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {TILES.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.title}
              href={t.href}
              className={`group relative flex min-h-48 items-center justify-between overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${t.gradient} p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:p-8`}
            >
              <div>
                <h3 className="text-2xl font-bold md:text-3xl">{t.title}</h3>
                <p className="mt-1 text-muted-foreground">{t.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Ver productos{' '}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
              {t.image ? (
                <div className="ml-auto size-32 shrink-0 overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 md:size-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.image}
                    alt={t.title}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <Icon
                  className="ml-auto size-28 text-primary/25 transition-transform duration-500 group-hover:scale-105 md:size-36"
                  strokeWidth={1}
                />
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
