'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { User } from 'lucide-react'

import { medusa } from '@/lib/medusa/sdk'

export const AccountButton: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    medusa.store.customer
      .retrieve()
      .then(({ customer }) => setLoggedIn(!!customer))
      .catch(() => setLoggedIn(false))
  }, [])

  const href = loggedIn ? '/cuenta' : '/login'
  const top = loggedIn ? 'Hola' : 'Bienvenido'
  const label = loggedIn ? 'Mi cuenta' : 'Iniciar sesión'

  return (
    <Link
      href={href}
      aria-label={label}
      className="hidden items-center gap-2 rounded-full px-3 py-2 transition-colors duration-300 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:flex"
    >
      <User className="size-5 shrink-0 text-primary" aria-hidden="true" />
      <span className="hidden flex-col leading-none lg:flex">
        <span className="text-[11px] text-muted-foreground">{top}</span>
        <span className="text-sm font-semibold">{label}</span>
      </span>
    </Link>
  )
}
