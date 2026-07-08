import Link from 'next/link'
import React from 'react'
import { Mail, Phone } from 'lucide-react'

import { Logo } from '@/components/Logo/Logo'
import { Button } from '@/components/ui/button'

const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Comprar',
    links: [
      ['Mac', '/tienda?categoria=mac'],
      ['iPhone', '/tienda?categoria=iphone'],
      ['Electrodomésticos', '/tienda?categoria=electrodom'],
      ['Audio', '/tienda?categoria=audio'],
      ['Ofertas', '/tienda?oferta=1'],
      ['Todos los productos', '/tienda'],
    ],
  },
  {
    title: 'Ayuda',
    links: [
      ['Cómo comprar', '/ayuda/como-comprar'],
      ['Envíos', '/ayuda/envios'],
      ['Garantía', '/ayuda/garantia'],
      ['Devoluciones', '/ayuda/devoluciones'],
      ['Preguntas frecuentes', '/ayuda/preguntas-frecuentes'],
    ],
  },
  {
    title: 'Empresa',
    links: [
      ['Sobre smartime', '/sobre-nosotros'],
      ['Términos y condiciones', '/terminos'],
      ['Privacidad', '/privacidad'],
    ],
  },
]

// Estilos compartidos para mantener el ritmo visual del pie de página
const footerLinkClass =
  'inline-block rounded-sm transition-colors duration-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function Footer() {
  // Mismo patrón que FloatingWhatsApp: número internacional sin "+" (ej. 50499998888)
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, quiero recibir ofertas de smartime')}`
    : null

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      {/* Banda 1: marca + ofertas por WhatsApp */}
      <div className="container grid gap-10 py-12 md:py-16 lg:grid-cols-2 lg:gap-16">
        <div>
          <Logo showTagline />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Tecnología original en Honduras: Apple, audio, gaming y hogar inteligente, con garantía
            y envío a todo el país.
          </p>
        </div>

        {whatsappHref && (
          <div className="lg:justify-self-end lg:text-left">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Ofertas por WhatsApp
            </h4>
            <p className="mt-3 text-sm text-muted-foreground">
              Recibe ofertas y novedades antes que nadie, sin spam.
            </p>
            <Button asChild className="mt-4 h-11 rounded-full px-5">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                Recibir ofertas por WhatsApp
              </a>
            </Button>
          </div>
        )}
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
          <span>© 2026 smartime · Tecnología original en Honduras</span>
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
