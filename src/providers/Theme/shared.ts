import type { Theme } from './types'

export const themeLocalStorageKey = 'smartime-theme'

// Tema por defecto: oscuro (look premium/lujo). El usuario puede cambiarlo y se respeta su preferencia.
export const defaultTheme = 'dark'

export const getImplicitPreference = (): Theme | null => {
  const mediaQuery = '(prefers-color-scheme: dark)'
  const mql = window.matchMedia(mediaQuery)
  const hasImplicitPreference = typeof mql.matches === 'boolean'

  if (hasImplicitPreference) {
    return mql.matches ? 'dark' : 'light'
  }

  return null
}
