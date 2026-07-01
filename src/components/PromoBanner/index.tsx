import Link from 'next/link'
import React from 'react'
import { CreditCard } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const PromoBanner: React.FC = () => {
  return (
    <section className="container py-8">
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-[#1e3a8a] to-[#0b1220] px-8 py-12 text-white shadow-lg ring-1 ring-white/10 transition duration-300 hover:shadow-xl md:px-12 md:py-16">
        <CreditCard
          className="absolute right-6 top-1/2 hidden size-40 -translate-y-1/2 text-white/10 transition-transform duration-500 group-hover:scale-105 md:block"
          strokeWidth={1}
        />
        <div className="relative max-w-xl">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
            Financiamiento
          </span>
          <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">
            Hasta 12 meses sin intereses
          </h3>
          <p className="mt-2 text-white/85">
            Compra tu Mac o iPhone hoy y paga en cómodas cuotas.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-white text-primary transition duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg"
          >
            <Link href="/tienda">Comprar ahora</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
