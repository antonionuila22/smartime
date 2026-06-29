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

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <Logo showTagline />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Mac y iPhone originales en Honduras, con garantía y envío a todo el país.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href="#"
              aria-label="Facebook"
              className="grid size-9 place-items-center rounded-full border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="grid size-9 place-items-center rounded-full border text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Instagram className="size-4" />
            </a>
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold">{col.title}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-sm font-semibold">Newsletter</h4>
          <p className="mt-3 text-sm text-muted-foreground">Recibe ofertas y novedades.</p>
          <div className="mt-3 flex gap-2">
            <input
              type="email"
              placeholder="Tu correo"
              aria-label="Tu correo"
              className="h-10 w-full rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <Button type="button" className="shrink-0 rounded-full">
              Suscribirme
            </Button>
          </div>
          <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Phone className="size-4" /> +504 0000-0000
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4" /> hola@smartime.hn
            </p>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground md:flex-row">
          <span>© 2026 smartime · Apple Mac &amp; iPhone en Honduras</span>
          <div className="flex items-center gap-2">
            <span>Pago seguro:</span>
            {['VISA', 'Mastercard', 'PayPal'].map((m) => (
              <span key={m} className="rounded border bg-background px-2 py-0.5 font-medium">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
