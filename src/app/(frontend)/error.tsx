'use client'

import Link from 'next/link'
import React, { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

// Error boundary del segmento (frontend): captura errores de render/datos en runtime
// y ofrece reintentar el segmento sin recargar toda la app.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Registro para diagnóstico (el digest llega en errores de servidor)
    console.error(error)
  }, [error])

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-16">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Algo salió mal</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Ocurrió un error inesperado. Puedes intentarlo de nuevo.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()}>Reintentar</Button>
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
