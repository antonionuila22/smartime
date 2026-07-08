import type { Metadata, Viewport } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { Poppins } from 'next/font/google'
import React from 'react'

// Una sola familia de texto (Poppins) para titulares y cuerpo → look tecnología limpio y una
// fuente web menos que descargar (mejor LCP). Se retiró la serif Fraunces.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

import { AnnouncementBar } from '@/components/AnnouncementBar'
import { CategoryNav } from '@/components/CategoryNav'
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={cn(poppins.variable, GeistMono.variable)}
      lang="es"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          {/* Accesibilidad (WCAG 2.4.1 "Evitar bloques"): enlace para saltar la cabecera/menú
              directamente al contenido. Oculto visualmente, aparece al recibir foco por teclado. */}
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            Saltar al contenido
          </a>
          <AnnouncementBar />
          <Header />
          <CategoryNav />
          {/* Landmark principal para lectores de pantalla; `tabIndex={-1}` permite que el enlace
              de salto lo enfoque como destino. */}
          <main id="contenido" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>
          <Footer />
          <FloatingWhatsApp />
        </Providers>
      </body>
    </html>
  )
}

export const viewport: Viewport = {
  // La tienda es OSCURA por defecto → la barra del navegador móvil combina con el fondo premium
  // (evita una franja clara chocante sobre el tema oscuro en Chrome/Safari móvil).
  themeColor: '#0f1319',
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  // Plantilla de título: cada página aporta solo su parte y se le añade el sufijo de marca.
  // `default` cubre las páginas que no definen título propio.
  title: {
    default: 'smartime — Tecnología original en Honduras',
    template: '%s — smartime',
  },
  description:
    'Tecnología original en Honduras: Apple, electrodomésticos, audio, gaming y smart home, con garantía y envío a todo el país. Precios en Lempiras.',
  applicationName: 'smartime',
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@smartime',
  },
}
