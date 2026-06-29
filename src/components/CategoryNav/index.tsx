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

  return (
    <nav className="border-b bg-background">
      <div className="container flex items-center gap-1 overflow-x-auto py-2 text-sm font-medium [-ms-overflow-style:none] [scrollbar-width:none]">
        <Link
          href="/tienda"
          className="whitespace-nowrap rounded-full px-3 py-1.5 transition hover:bg-accent hover:text-primary"
        >
          Todos los productos
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/tienda?categoria=${c.handle ?? c.id}`}
            className="whitespace-nowrap rounded-full px-3 py-1.5 transition hover:bg-accent hover:text-primary"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </nav>
  )
}
