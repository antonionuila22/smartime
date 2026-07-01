'use client'

import React, { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/providers/Theme'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // El tema real solo se conoce en el cliente (data-theme / localStorage). Hasta que el
  // componente monta, el servidor y la primera pintura del cliente renderizan un marcador
  // idéntico (Moon + "Cambiar tema"), evitando desajustes de hidratación.
  useEffect(() => setMounted(true), [])

  const isDark = theme !== 'light'
  const btnClass =
    'grid size-10 place-items-center rounded-full border border-input text-foreground transition hover:border-primary hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

  if (!mounted) {
    return (
      <button type="button" aria-label="Cambiar tema" className={btnClass}>
        <Moon className="size-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={btnClass}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
