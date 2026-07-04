import Link from 'next/link'
import React from 'react'

import { listCategories } from '@/lib/medusa/data'

export async function CategoryNav() {
  let categories: { id: string; name: string; handle?: string | null }[] = []
  try {
    categories = await listCategories()
  } catch {
    categories = []
  }

  // Estilo compartido de las píldoras: borde transparente para que el hover no
  // desplace el layout, y tap-target de 40 px de alto en móvil.
  const pillClass =
    'whitespace-nowrap rounded-full border border-transparent px-3.5 py-2.5 leading-none text-muted-foreground transition-colors duration-300 hover:border-primary/40 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  return (
    <nav aria-label="Categorías de productos" className="relative border-b border-border bg-background">
      <div className="container flex items-center gap-1 overflow-x-auto py-1.5 text-sm font-medium [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href="/tienda" className={pillClass}>
          Todos los productos
        </Link>
        {categories.length > 0 && (
          <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />
        )}
        {categories.map((c) => (
          <Link key={c.id} href={`/tienda?categoria=${c.handle ?? c.id}`} className={pillClass}>
            {c.name}
          </Link>
        ))}
      </div>
      {/* Pista visual de scroll horizontal en móvil */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent md:hidden"
      />
    </nav>
  )
}
