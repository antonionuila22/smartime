import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { InfoPage, InfoSection } from '@/components/InfoPage'

// Página estática: sin datos, se prerenderiza completa en el shell.

export const metadata: Metadata = {
  title: 'Envíos',
  description:
    'Envío estándar en 2-4 días hábiles a todo Honduras o retiro en tienda en Tegucigalpa y San Pedro Sula en 1-2 días hábiles. Así funciona la entrega en smartime.',
  alternates: { canonical: '/ayuda/envios' },
}

// Mismo idioma de enlace en línea que login/carrito
const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

export default function EnviosPage() {
  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Envíos"
      intro="Enviamos a todo Honduras y también puedes retirar tu pedido en tienda. Aquí tienes los plazos reales y cómo calculamos tu fecha de entrega."
    >
      <InfoSection title="Envío estándar a todo Honduras">
        <p>
          El envío estándar llega en <strong>2 a 4 días hábiles</strong> a cualquier punto del país.
          El costo exacto se calcula en el checkout según tu dirección de entrega, antes de
          confirmar el pago.
        </p>
        <p>
          Los días hábiles son de lunes a viernes; los pedidos confirmados en fin de semana o
          feriado empiezan a contar el siguiente día hábil.
        </p>
      </InfoSection>

      <InfoSection title="Retiro en tienda">
        <p>
          Si prefieres recoger tu pedido, ofrecemos retiro en tienda en{' '}
          <strong>Tegucigalpa y San Pedro Sula</strong>. Tu pedido queda listo en{' '}
          <strong>1 a 2 días hábiles</strong> y te avisamos por correo cuando puedas pasar a
          recogerlo. Solo necesitas tu número de pedido y una identificación.
        </p>
      </InfoSection>

      <InfoSection title="¿Cómo se calcula la fecha estimada?">
        <p>
          Al confirmar tu pedido calculamos la fecha estimada de entrega según el método elegido y
          los días hábiles en Honduras. Esa fecha <strong>queda congelada</strong> para tu pedido —
          no cambia después — y puedes consultarla en cualquier momento en{' '}
          <Link href="/cuenta" className={linkClass}>
            tu cuenta
          </Link>
          , junto con el estado del pedido.
        </p>
      </InfoSection>

      <InfoSection title="Cobertura">
        <p>
          Llegamos a los 18 departamentos de Honduras: ciudades principales, cabeceras
          departamentales y la mayoría de municipios. Si tu zona es de difícil acceso, te
          contactamos antes de despachar para coordinar la entrega.
        </p>
        <p>
          ¿Dudas sobre tu envío? Escríbenos por WhatsApp al{' '}
          <a href="tel:+50494976404" className={linkClass}>
            +504 9497-6404
          </a>{' '}
          o a{' '}
          <a href="mailto:hola@smartime.hn" className={linkClass}>
            hola@smartime.hn
          </a>
          .
        </p>
      </InfoSection>
    </InfoPage>
  )
}
