'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { formatPrice } from '@/utilities/format'
import { startingMonthly } from '@/utilities/financing'

export type HeroSlide = {
  eyebrow?: string
  title: string
  subtitle: string
  cta: string
  href: string
  image?: string | null
  price?: number | null
  gradient: string
}

export const HeroCarousel: React.FC<{ slides: HeroSlide[] }> = ({ slides }) => {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  useEffect(() => {
    if (paused || count <= 1) return
    const id = setInterval(() => setI((v) => (v + 1) % count), 6000)
    return () => clearInterval(id)
  }, [paused, count])

  if (!count) return null
  const go = (n: number) => setI((n + count) % count)

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Promociones destacadas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[480px] overflow-hidden rounded-2xl md:h-[520px]">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {slides.map((s, idx) => {
            const cuota = startingMonthly(s.price)
            return (
              <div
                key={idx}
                className={`relative h-full w-full shrink-0 bg-gradient-to-br ${s.gradient}`}
              >
                {/* halos + viñeta para dar profundidad al fondo */}
                <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-white/[0.06] blur-3xl" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                {/* content-center: en móvil el grupo texto+imagen se centra vertical y deja aire
                    abajo para los dots (sin colisionar con los botones). */}
                <div className="container grid h-full grid-cols-1 content-center items-center gap-5 md:grid-cols-2 md:gap-6">
                  <div
                    className={cn(
                      'z-10 text-center text-white md:pl-14 md:text-left',
                      // Sin imagen (slide promocional) → el texto ocupa todo el ancho y se centra
                      // también en desktop, para no dejar media columna vacía.
                      !s.image && 'md:col-span-2 md:pl-0 md:text-center',
                    )}
                  >
                    {s.eyebrow && (
                      <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-white/20 backdrop-blur">
                        {s.eyebrow}
                      </span>
                    )}
                    <h2 className="mt-4 text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">
                      {s.title}
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-base text-white/85 md:mx-0 md:text-lg">
                      {s.subtitle}
                    </p>
                    {s.price ? (
                      <p className="mt-4 text-white">
                        <span className="text-sm text-white/70">Desde </span>
                        <span className="text-2xl font-bold">{formatPrice(s.price)}</span>
                        {cuota && (
                          <span className="ml-2 text-sm text-white/80">
                            o {formatPrice(cuota.amount)}/mes
                          </span>
                        )}
                      </p>
                    ) : null}
                    <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                      <Button
                        asChild
                        size="lg"
                        className="bg-white text-primary shadow-md hover:bg-white/90"
                      >
                        <Link href={s.href}>{s.cta}</Link>
                      </Button>
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                      >
                        <Link href="/tienda">Ver todo</Link>
                      </Button>
                    </div>
                  </div>

                  {s.image && (
                    <div className="relative flex items-center justify-center">
                      {/* Móvil: tarjeta contenida (~192px) bajo el texto. Desktop: cuadrado lateral. */}
                      <div className="relative aspect-square w-40 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:w-48 md:w-full md:max-w-[340px]">
                        <Image
                          src={s.image}
                          alt={s.title}
                          fill
                          sizes="(max-width: 768px) 192px, 340px"
                          // El primer slide es el LCP (above the fold) → carga prioritaria
                          // (preload). Los demás rotan a la vista en segundos: eager sin preload,
                          // para que al entrar no aparezcan en blanco ni disparen avisos de LCP.
                          priority={idx === 0}
                          loading={idx === 0 ? undefined : 'eager'}
                          className="object-contain p-6"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            onClick={() => go(i - 1)}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-lg ring-1 ring-black/5 transition duration-300 hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:grid"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => go(i + 1)}
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-lg ring-1 ring-black/5 transition duration-300 hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:grid"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Dots con área táctil ampliada (el punto visual vive en el span interior) */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => go(idx)}
                aria-label={`Ir a la diapositiva ${idx + 1}`}
                aria-current={idx === i}
                className="group/dot flex h-9 items-center rounded-full px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                <span
                  className={`h-2 rounded-full transition-all duration-300 ${idx === i ? 'w-7 bg-white' : 'w-2 bg-white/50 group-hover/dot:bg-white/80'}`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
