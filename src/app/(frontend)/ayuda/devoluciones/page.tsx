import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { InfoPage, InfoSection } from '@/components/InfoPage'

// Página estática: sin datos, se prerenderiza completa en el shell.

export const metadata: Metadata = {
  title: 'Devoluciones',
  description:
    'Tienes 7 días desde la entrega para devolver tu compra en smartime. Condiciones, cómo iniciar la devolución y cómo se emite el reembolso.',
  alternates: { canonical: '/ayuda/devoluciones' },
}

// Mismo idioma de enlace en línea que login/carrito
const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

export default function DevolucionesPage() {
  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Devoluciones"
      intro="Si cambiaste de opinión o el producto llegó con un defecto, tienes 7 días desde la entrega para devolverlo. Así funciona."
    >
      <InfoSection title="Plazo: 7 días desde la entrega">
        <p>
          Puedes solicitar la devolución dentro de los <strong>7 días calendario</strong> siguientes
          a la fecha en que recibiste el pedido (o lo retiraste en tienda). Pasado ese plazo, aplica
          únicamente la{' '}
          <Link href="/ayuda/garantia" className={linkClass}>
            garantía del fabricante
          </Link>
          .
        </p>
      </InfoSection>

      <InfoSection title="Condiciones">
        <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
          <li>
            El producto debe estar <strong>sellado y sin uso</strong>, en su empaque original con
            todos sus accesorios.
          </li>
          <li>
            Excepción: si el producto llegó <strong>defectuoso o dañado</strong>, lo aceptamos
            aunque esté abierto — solo documenta el problema con fotos al recibirlo.
          </li>
          <li>Necesitas el número de pedido y la factura de compra.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Cómo iniciar una devolución">
        <p>
          Escríbenos por WhatsApp al{' '}
          <a href="tel:+50494976404" className={linkClass}>
            +504 9497-6404
          </a>{' '}
          o al correo{' '}
          <a href="mailto:hola@smartime.hn" className={linkClass}>
            hola@smartime.hn
          </a>{' '}
          con tu número de pedido y el motivo. Te confirmamos si aplica y coordinamos la entrega del
          producto: puedes llevarlo a nuestra tienda en Tegucigalpa o San Pedro Sula, o coordinar la
          recolección según tu zona.
        </p>
      </InfoSection>

      <InfoSection title="Reembolso">
        <p>
          Una vez recibido y verificado el producto, emitimos el reembolso{' '}
          <strong>al mismo método de pago</strong> que usaste (tu cuenta PayPal o la tarjeta con la
          que pagaste). El tiempo en verse reflejado depende de PayPal y de tu banco; normalmente
          son unos días hábiles tras la aprobación.
        </p>
        <p>
          Si el motivo es un defecto o un error nuestro, también reembolsamos el costo del envío.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
