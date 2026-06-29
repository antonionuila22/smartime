'use client'

import React, { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'

const MESSAGES = [
  'Envío a todo Honduras 🇭🇳',
  'Mac y iPhone originales · Garantía Apple',
  'Hasta 12 meses sin intereses',
]

export const AnnouncementBar: React.FC = () => {
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % MESSAGES.length), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container flex h-9 items-center justify-between text-xs font-medium">
        <span className="hidden sm:inline opacity-80">Tienda oficial de Mac y iPhone</span>
        <span key={i} className="mx-auto animate-in fade-in duration-500 sm:mx-0 tracking-wide">
          {MESSAGES[i]}
        </span>
        <a href="tel:+504" className="hidden items-center gap-1.5 opacity-90 hover:opacity-100 md:flex">
          <Phone className="size-3.5" /> +504 0000-0000
        </a>
      </div>
    </div>
  )
}
