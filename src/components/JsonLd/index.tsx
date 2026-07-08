import React from 'react'

/**
 * Inserta datos estructurados (JSON-LD) en un <script type="application/ld+json">.
 * Escapa `<` para no romper el cierre del script ni permitir inyección de markup.
 * Acepta un objeto o un array (varios bloques @graph).
 *
 * Nota de implementación: el script va DENTRO de un wrapper con dangerouslySetInnerHTML en vez
 * de renderizar React un elemento <script> directamente. Si React crea el <script> en una
 * navegación cliente (RSC soft-nav), react-dom registra el error "Encountered a script tag while
 * rendering React component" en consola. Con innerHTML el navegador inserta el nodo sin que
 * React lo "posea" → sin error, y los crawlers lo leen igual (el JSON-LD es solo datos, nunca
 * se ejecuta). El wrapper lleva `hidden` por higiene; no afecta al parseo de los buscadores.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <div
      hidden
      dangerouslySetInnerHTML={{ __html: `<script type="application/ld+json">${json}</script>` }}
    />
  )
}
