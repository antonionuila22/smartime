import React from 'react'

/**
 * Inserta datos estructurados (JSON-LD) en un <script type="application/ld+json">.
 * Escapa `<` para no romper el cierre del script ni permitir inyección de markup.
 * Acepta un objeto o un array (varios bloques @graph).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
