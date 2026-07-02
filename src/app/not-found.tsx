import Link from 'next/link'
import React from 'react'
import { SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'

// 404 RAÍZ: al vivir junto al root layout (src/app/), captura cualquier URL desconocida
// con HTTP 404 REAL y se renderiza con el layout completo (header/nav/footer) — sin
// necesidad de un catch-all, que con PPR devolvía 200 (soft-404). Alineado con error.tsx.
export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-16">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent text-muted-foreground">
          <SearchX className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Página no encontrada</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tienda">Ver la tienda</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
