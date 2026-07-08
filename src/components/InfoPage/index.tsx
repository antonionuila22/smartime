import React from 'react'

/**
 * Plantilla compartida para páginas informativas (ayuda, legal, empresa).
 * Server component 100% estático: sin datos ni estado, se prerenderiza en el shell.
 * Cabecera con el mismo ritmo visual del resto de la tienda (eyebrow + titular serif).
 */
export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string
  title: string
  intro?: string
  children: React.ReactNode
}) {
  return (
    <div className="container py-12 md:py-16">
      <article className="mx-auto max-w-3xl">
        <header>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
          )}
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {intro && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{intro}</p>}
        </header>
        <div className="mt-10 space-y-10">{children}</div>
      </article>
    </div>
  )
}

/**
 * Sección con título propio dentro de una InfoPage: h2 (serif vía capa base) + contenido espaciado.
 */
export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  )
}
