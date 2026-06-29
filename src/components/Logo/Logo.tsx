import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  showTagline?: boolean
}

/**
 * Logo smartime — monograma ST (anillo azul roto + puntos de velocidad) y wordmark
 * "smar" (color de texto, se adapta a fondo claro/oscuro) + "time" (azul).
 * Vectorial: nítido a cualquier tamaño. Para usar el arte exacto, coloca un SVG/PNG
 * con fondo transparente en /public y lo cambiamos por <img>.
 */
export const Logo = ({ className, showTagline = false }: Props) => {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      {/* Monograma ST */}
      <span className="relative inline-grid size-9 shrink-0 place-items-center">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          className="absolute inset-0 size-full"
          aria-hidden="true"
        >
          <circle
            cx="20"
            cy="20"
            r="17.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="80 30"
            transform="rotate(120 20 20)"
            className="text-primary"
          />
          <rect x="2" y="7" width="3" height="3" rx="0.5" className="fill-primary" />
          <rect x="6.5" y="3.5" width="3" height="3" rx="0.5" className="fill-primary/70" />
          <rect x="6.5" y="10.5" width="3" height="3" rx="0.5" className="fill-primary/40" />
        </svg>
        <span className="text-[13px] font-extrabold italic leading-none tracking-tighter">
          <span className="text-primary">S</span>
          <span className="text-foreground">T</span>
        </span>
      </span>

      {/* Wordmark */}
      <span className="inline-flex flex-col leading-none">
        <span className="text-xl font-extrabold tracking-tight text-foreground">
          smar<span className="text-primary">time</span>
        </span>
        {showTagline && (
          <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Tecnología que te conecta
          </span>
        )}
      </span>
    </span>
  )
}
