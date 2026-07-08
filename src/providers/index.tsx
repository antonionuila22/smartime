import React from 'react'

import { CartProvider } from './Cart'
import { ThemeProvider } from './Theme'
import { WishlistProvider } from './Wishlist'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <WishlistProvider>
        <CartProvider>{children}</CartProvider>
      </WishlistProvider>
    </ThemeProvider>
  )
}
