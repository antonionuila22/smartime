import Link from 'next/link'
import React from 'react'
import { CreditCard } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const PromoBanner: React.FC = () => {
  return (
    <section className="container py-10 md:py-12">
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-[#1e3a8a] to-[#0b1220] px-6 py-12 text-white ring-1 ring-white/10 transition-shadow duration-300 hover:shadow-xl sm:px-8 md:px-12 md:py-16">
        {/* Halos suaves para dar profundidad, en línea con el hero */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 size-80 rounded-full bg-white/[0.06] blur-3xl" />
        <CreditCard
          className="absolute right-8 top-1/2 hidden size-40 -translate-y-1/2 -rotate-6 text-white/10 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105 md:block"
          strokeWidth={1}
        />
        <div className="relative max-w-xl">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur">
            Financiamiento
          </span>
          <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">
            Hasta 12 meses sin intereses
          </h3>
          <p className="mt-2 text-white/85">Compra tu Mac o iPhone hoy y paga en cómodas cuotas.</p>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-white text-primary transition duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg"
          >
            <Link href="/tienda">Explorar la tienda</Link>
          </Button>
          <p className="mt-4 text-xs text-white/60">Aplica con tarjetas de crédito participantes.</p>
        </div>
      </div>
    </section>
  )
}
