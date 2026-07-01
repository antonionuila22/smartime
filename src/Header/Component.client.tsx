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
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Logo />
          </Link>

          <SearchBar className="mx-auto hidden w-full max-w-2xl md:block" />

          <div className="ml-auto flex items-center gap-2">
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
