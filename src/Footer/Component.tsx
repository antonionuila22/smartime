import Link from 'next/link'
import React from 'react'
import { Facebook, Instagram, Mail, Phone } from 'lucide-react'

import { Logo } from '@/components/Logo/Logo'
import { Button } from '@/components/ui/button'

const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Comprar',
    links: [
      ['Mac', '/tienda?categoria=mac'],
      ['iPhone', '/tienda?categoria=iphone'],
      ['Ofertas', '/tienda?oferta=1'],
      ['Todos los productos', '/tienda'],
    ],
  },
  {
    title: 'Ayuda',
    links: [
      ['Cómo comprar', '#'],
      ['Envíos', '#'],
      ['Garantía', '#'],
      ['Devoluciones', '#'],
      ['Preguntas frecuentes', '#'],
    ],
  },
  {
    title: 'Empresa',
    links: [
      ['Sobre smartime', '#'],
      ['Nuestras tiendas', '#'],
      ['Términos y condiciones', '#'],
      ['Privacidad', '#'],
    ],
  },
]

// Estilos compartidos para mantener el ritmo visual del pie de página
const footerLinkClass =
  'inline-block rounded-sm transition-colors duration-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const socialLinkClass =
  'grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      {/* Banda 1: marca + newsletter */}
      <div className="container grid gap-10 py-12 md:py-16 lg:grid-cols-2 lg:gap-16">
        <div>
          <Logo showTagline />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Mac y iPhone originales en Honduras, con garantía y envío a todo el país.
          </p>
          <div className="mt-5 flex gap-2">
            <a href="#" aria-label="Facebook de smartime" className={socialLinkClass}>
              <Facebook className="size-4" aria-hidden />
            </a>
            <a href="#" aria-label="Instagram de smartime" className={socialLinkClass}>
              <Instagram className="size-4" aria-hidden />
            </a>
          </div>
        </div>

        <div className="lg:justify-self-end lg:text-left">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Newsletter
          </h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Recibe ofertas y novedades antes que nadie.
          </p>
          <div className="mt-4 flex w-full max-w-md gap-2">
            <input
              type="email"
              placeholder="Tu correo"
              aria-label="Tu correo electrónico"
              className="h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none transition duration-300 hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <Button type="button" className="h-11 shrink-0 rounded-full px-5">
              Suscribirme
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Sin spam. Puedes darte de baja cuando quieras.
          </p>
        </div>
      </div>

      {/* Banda 2: columnas de enlaces + contacto */}
      <div className="border-t border-border">
        <div className="container grid grid-cols-2 gap-x-8 gap-y-10 py-10 md:grid-cols-4">
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className={footerLinkClass}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Contacto
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a
                  href="tel:+50494976404"
                  className={`${footerLinkClass} inline-flex items-center gap-2`}
                >
                  <Phone className="size-4 shrink-0 text-primary" aria-hidden /> +504 9497-6404
                </a>
              </li>
              <li>
                <a
                  href="mailto:hola@smartime.hn"
                  className={`${footerLinkClass} inline-flex items-center gap-2`}
                >
                  <Mail className="size-4 shrink-0 text-primary" aria-hidden /> hola@smartime.hn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Banda 3: legal + métodos de pago */}
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground md:flex-row">
          <span>© 2026 smartime · Apple Mac &amp; iPhone en Honduras</span>
          <div className="flex items-center gap-2">
            <span>Pago seguro:</span>
            {['VISA', 'Mastercard', 'PayPal'].map((m) => (
              <span
                key={m}
                className="rounded-full border border-border bg-background px-2.5 py-1 font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
