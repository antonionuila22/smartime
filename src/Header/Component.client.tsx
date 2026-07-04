'use client'

import Link from 'next/link'
import React from 'react'

import { Logo } from '@/components/Logo/Logo'
import { SearchBar } from '@/components/SearchBar'
import { CartButton } from '@/components/Cart/CartButton'
import { FavoritesButton } from '@/components/FavoritesButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AccountButton } from '@/components/account/AccountButton'

export const HeaderClient: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container py-3">
        <div className="flex items-center gap-3 md:gap-6">
          <Link
            href="/"
            aria-label="smartime — ir al inicio"
            className="flex shrink-0 items-center rounded-full px-1 py-0.5 transition-opacity duration-300 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo />
          </Link>

          <SearchBar className="mx-auto hidden w-full max-w-2xl md:block" />

          {/* Acciones: tema · cuenta · favoritos · carrito */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <AccountButton />
            <FavoritesButton />
            <CartButton />
          </div>
        </div>

        {/* Buscador en móvil */}
        <SearchBar className="mt-3 md:hidden" />
      </div>
    </header>
  )
}
