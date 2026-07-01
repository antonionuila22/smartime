import React from 'react'

import { defaultTheme, themeLocalStorageKey } from '../shared'

/**
 * Script anti-parpadeo (no-FOUC): fija `data-theme` en <html> ANTES de la primera
 * pintura, leyendo la preferencia guardada o cayendo al tema por defecto.
 *
 * Es un <script> plano (no `next/script`): al renderizarse en el <head> del servidor
 * se ejecuta de forma síncrona durante el parseo del HTML, antes de la hidratación.
 * `next/script` es un client component y, en React 19, renderizar su <script> en
 * cliente dispara el aviso "Scripts inside React components are never executed…".
 */
export const InitTheme: React.FC = () => {
  return (
    <script
      id="theme-script"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
  (function () {
    function themeIsValid(theme) {
      return theme === 'light' || theme === 'dark'
    }

    var themeToSet = '${defaultTheme}'
    var preference = window.localStorage.getItem('${themeLocalStorageKey}')

    // Solo respetamos una preferencia explícita guardada por el usuario; si no,
    // usamos el tema por defecto (oscuro, look premium).
    if (themeIsValid(preference)) {
      themeToSet = preference
    }

    document.documentElement.setAttribute('data-theme', themeToSet)
  })();
  `,
      }}
    />
  )
}
