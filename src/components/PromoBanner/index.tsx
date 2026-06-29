import Link from 'next/link'
import React from 'react'
import { CreditCard } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const PromoBanner: React.FC = () => {
  return (
    <section className="container py-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-[#1e3a8a] px-8 py-12 text-white md:px-12 md:py-16">
        <CreditCard
          className="absolute right-6 top-1/2 hidden size-40 -translate-y-1/2 text-white/10 md:block"
          strokeWidth={1}
        />
        <div className="relative max-w-xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-white/80">
            Financiamiento
          </span>
          <h3 className="mt-2 text-2xl font-bold md:text-4xl">Hasta 12 meses sin intereses</h3>
          <p className="mt-2 text-white/85">
            Compra tu Mac o iPhone hoy y paga en cómodas cuotas.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link href="/tienda">Comprar ahora</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
