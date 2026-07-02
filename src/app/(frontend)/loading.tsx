import React from 'react'
import { Loader2 } from 'lucide-react'

// Loading global de navegación: NEUTRO a propósito (un spinner centrado), porque este
// fallback aplica a TODAS las rutas del grupo — un skeleton de grid de productos se vería
// incoherente en checkout/cuenta y duplicaría los skeletons propios de cada página
// (p. ej. TiendaSkeleton). Los skeletons específicos viven en cada página/Suspense.
export default function Loading() {
  return (
    <div className="container grid min-h-[50vh] place-items-center py-16">
      <Loader2 className="size-8 animate-spin text-primary" aria-label="Cargando" />
    </div>
  )
}
