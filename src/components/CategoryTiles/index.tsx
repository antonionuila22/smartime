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
      gradient: 'from-[#60a5fa]/15 to-[#60a5fa]/5',
    },
  ]

  return (
    <section className="container py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {TILES.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.title}
              href={t.href}
              className={`group relative flex min-h-48 items-center justify-between overflow-hidden rounded-2xl border bg-gradient-to-br ${t.gradient} p-8 transition hover:shadow-lg`}
            >
              <div>
                <h3 className="text-2xl font-bold md:text-3xl">{t.title}</h3>
                <p className="mt-1 text-muted-foreground">{t.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Ver productos{' '}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
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
                  className="ml-auto size-28 text-primary/25 transition-transform group-hover:scale-110 md:size-36"
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
