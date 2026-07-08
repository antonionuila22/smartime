'use client'

import React, { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'

const MESSAGES = [
  'Envío a todo Honduras 🇭🇳',
  'Productos originales · Garantía oficial',
  'Hasta 12 meses sin intereses',
]

export const AnnouncementBar: React.FC = () => {
  const [i, setI] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Respeta prefers-reduced-motion: si el usuario pide menos movimiento, NO rotamos (se queda el primero).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Rota salvo hover, foco DENTRO (teclado), movimiento reducido, o 1 solo mensaje.
  // Así cualquier usuario (ratón, teclado, lector) puede detener el movimiento (WCAG 2.2.2).
  const rotating = !hovering && !focusWithin && !reducedMotion && MESSAGES.length > 1
  useEffect(() => {
    if (!rotating) return
    const id = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 4000)
    return () => clearInterval(id)
  }, [rotating])

  return (
    <div
      className="border-b border-border bg-card/70 text-foreground backdrop-blur"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(e) => {
        // Solo reanudar cuando el foco sale de la barra por completo (no al saltar entre sus enlaces).
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false)
      }}
    >
      <div className="container flex h-9 items-center justify-between gap-4 text-xs font-medium">
        <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-foreground/80 sm:inline">
          Tecnología original · Garantía oficial
        </span>
        {/* Región estable con aria-live: el lector anuncia el cambio de mensaje sin
            re-crear el nodo vivo (el fade por-mensaje vive en el span interior con key). */}
        <span aria-live="polite" className="mx-auto truncate tracking-wide sm:mx-0">
          <span key={i} className="animate-in fade-in duration-500">
            {MESSAGES[i]}
          </span>
        </span>
        <a
          href="tel:+50494976404"
          aria-label="Llamar al +504 9497-6404"
          className="hidden items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-foreground/80 transition-colors duration-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:flex"
        >
          <Phone className="size-3.5 text-primary" aria-hidden /> +504 9497-6404
        </a>
      </div>
    </div>
  )
}
