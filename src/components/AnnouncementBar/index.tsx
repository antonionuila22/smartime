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

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="border-b border-border bg-card/70 text-foreground backdrop-blur">
      <div className="container flex h-9 items-center justify-between gap-4 text-xs font-medium">
        <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-foreground/80 sm:inline">
          Tecnología original · Garantía oficial
        </span>
        <span key={i} className="mx-auto truncate animate-in fade-in tracking-wide duration-500 sm:mx-0">
          {MESSAGES[i]}
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
