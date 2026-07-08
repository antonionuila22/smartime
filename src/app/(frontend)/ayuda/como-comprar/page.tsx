import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { InfoPage } from '@/components/InfoPage'

// Página estática: sin datos, se prerenderiza completa en el shell.

export const metadata: Metadata = {
  title: 'Cómo comprar',
  description:
    'Guía paso a paso para comprar en smartime: crea tu cuenta, elige envío o retiro en tienda, paga con PayPal en cuotas o de contado y sigue tu pedido.',
  alternates: { canonical: '/ayuda/como-comprar' },
}

// Mismo idioma de enlace en línea que login/carrito
const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

const PASOS: { titulo: string; contenido: React.ReactNode }[] = [
  {
    titulo: 'Crea tu cuenta',
    contenido: (
      <p>
        Para comprar en smartime necesitas una cuenta: así tu carrito, tus direcciones y el
        historial de pedidos quedan guardados y seguros.{' '}
        <Link href="/registro" className={linkClass}>
          Regístrate aquí
        </Link>{' '}
        con tu correo en menos de un minuto. Si ya tienes cuenta, solo{' '}
        <Link href="/login" className={linkClass}>
          inicia sesión
        </Link>
        .
      </p>
    ),
  },
  {
    titulo: 'Añade productos al carrito',
    contenido: (
      <p>
        Explora la{' '}
        <Link href="/tienda" className={linkClass}>
          tienda
        </Link>{' '}
        — Apple, electrodomésticos, audio, TV, gaming y smart home — y añade al carrito lo que te
        guste. Todos los precios están en Lempiras (HNL) con ISV incluido: lo que ves es lo que
        pagas.
      </p>
    ),
  },
  {
    titulo: 'Elige envío o retiro en tienda',
    contenido: (
      <p>
        En el checkout eliges cómo recibir tu pedido: envío estándar a todo Honduras (2-4 días
        hábiles) o retiro en tienda en Tegucigalpa o San Pedro Sula (listo en 1-2 días hábiles). Más
        detalles en{' '}
        <Link href="/ayuda/envios" className={linkClass}>
          Envíos
        </Link>
        .
      </p>
    ),
  },
  {
    titulo: 'Paga con PayPal',
    contenido: (
      <p>
        Pagas de forma segura a través de PayPal, de contado o hasta en 12 meses sin intereses con
        tarjetas participantes. No guardamos los datos de tu tarjeta: el pago se procesa completo en
        la plataforma de PayPal.
      </p>
    ),
  },
  {
    titulo: 'Sigue tu pedido en tu cuenta',
    contenido: (
      <p>
        Al confirmar el pedido te mostramos la fecha estimada de entrega, que queda congelada para
        ese pedido. Puedes consultarla en cualquier momento junto con el estado del pedido en{' '}
        <Link href="/cuenta" className={linkClass}>
          tu cuenta
        </Link>
        .
      </p>
    ),
  },
]

export default function ComoComprarPage() {
  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Cómo comprar"
      intro="Comprar en smartime toma cinco pasos. Aquí te explicamos cada uno, desde crear tu cuenta hasta recibir tu pedido."
    >
      <ol className="space-y-8">
        {PASOS.map((paso, i) => (
          <li key={paso.titulo} className="flex gap-4">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">{paso.titulo}</h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {paso.contenido}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight">¿Necesitas ayuda con tu compra?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Escríbenos por WhatsApp al{' '}
          <a href="tel:+50494976404" className={linkClass}>
            +504 9497-6404
          </a>{' '}
          o al correo{' '}
          <a href="mailto:hola@smartime.hn" className={linkClass}>
            hola@smartime.hn
          </a>{' '}
          y te acompañamos en el proceso.
        </p>
      </div>
    </InfoPage>
  )
}
