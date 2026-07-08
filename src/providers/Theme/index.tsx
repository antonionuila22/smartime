'use client'

import React, { createContext, useCallback, use, useEffect, useState } from 'react'

import type { Theme, ThemeContextType } from './types'

import canUseDOM from '@/utilities/canUseDOM'
import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from './shared'
import { themeIsValid } from './types'

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme | undefined>(
    canUseDOM ? (document.documentElement.getAttribute('data-theme') as Theme) : undefined,
  )

  const setTheme = useCallback((themeToSet: Theme | null) => {
    if (themeToSet === null) {
      // La persistencia puede lanzar (modo privado/permisos); nunca debe impedir
      // aplicar el tema visual, así que la aislamos en try/catch.
      try {
        window.localStorage.removeItem(themeLocalStorageKey)
      } catch {
        /* noop */
      }
      const implicitPreference = getImplicitPreference()
      document.documentElement.setAttribute('data-theme', implicitPreference || '')
      if (implicitPreference) setThemeState(implicitPreference)
    } else {
      setThemeState(themeToSet)
      // La escritura puede lanzar (modo privado/permisos); aplicamos el tema visual igualmente.
      try {
        window.localStorage.setItem(themeLocalStorageKey, themeToSet)
      } catch {
        /* noop */
      }
      document.documentElement.setAttribute('data-theme', themeToSet)
    }
  }, [])

  useEffect(() => {
    // Tema CLARO por defecto; solo respetamos una preferencia explícita del usuario
    // (no seguimos el modo oscuro del sistema, para un look blanco y limpio).
    // La lectura puede lanzar (modo privado/permisos): caemos a defaultTheme sin romper.
    let preference: null | string = null
    try {
      preference = window.localStorage.getItem(themeLocalStorageKey)
    } catch {
      /* noop */
    }
    const themeToSet: Theme = themeIsValid(preference) ? preference : defaultTheme

    document.documentElement.setAttribute('data-theme', themeToSet)
    setThemeState(themeToSet)
  }, [])

  return <ThemeContext value={{ setTheme, theme }}>{children}</ThemeContext>
}

export const useTheme = (): ThemeContextType => use(ThemeContext)
