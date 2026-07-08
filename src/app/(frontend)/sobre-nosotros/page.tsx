import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { InfoPage, InfoSection } from '@/components/InfoPage'

// Página estática: sin datos, se prerenderiza completa en el shell.

export const metadata: Metadata = {
  title: 'Sobre smartime',
  description:
    'smartime es una tienda hondureña de tecnología original: Apple, electrodomésticos, audio, TV, gaming y smart home, con envío a todo el país y retiro en Tegucigalpa y San Pedro Sula.',
  alternates: { canonical: '/sobre-nosotros' },
}

// Mismo idioma de enlace en línea que login/carrito
const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

export default function SobreNosotrosPage() {
  return (
    <InfoPage
      eyebrow="Empresa"
      title="Sobre smartime"
      intro="Somos una tienda hondureña de tecnología. Vendemos productos originales, con precios claros en Lempiras y entrega en todo el país."
    >
      <InfoSection title="Nuestra misión">
        <p>
          Que comprar tecnología en Honduras sea simple y confiable: productos originales y
          sellados, precios en Lempiras con ISV incluido, cuotas sin intereses y plazos de entrega
          que se cumplen. Sin letra pequeña y con alguien real al otro lado del WhatsApp cuando lo
          necesitas.
        </p>
      </InfoSection>

      <InfoSection title="Qué vendemos">
        <p>
          Tecnología original para tu día a día: Apple (Mac, iPhone y accesorios),
          electrodomésticos, audio, televisores, gaming y smart home. Todo nuevo, sellado de fábrica
          y con garantía del fabricante y factura incluida. Explora el catálogo completo en{' '}
          <Link href="/tienda" className={linkClass}>
            la tienda
          </Link>
          .
        </p>
      </InfoSection>

      <InfoSection title="Dónde estamos">
        <p>
          Operamos en línea para todo Honduras, con envío estándar de 2 a 4 días hábiles a cualquier
          punto del país. Si prefieres recoger tu pedido en persona, ofrecemos retiro en tienda en{' '}
          <strong>Tegucigalpa y San Pedro Sula</strong>, listo en 1 a 2 días hábiles.
        </p>
      </InfoSection>

      <InfoSection title="Contacto">
        <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
          <li>
            WhatsApp y teléfono:{' '}
            <a href="tel:+50494976404" className={linkClass}>
              +504 9497-6404
            </a>
          </li>
          <li>
            Correo:{' '}
            <a href="mailto:hola@smartime.hn" className={linkClass}>
              hola@smartime.hn
            </a>
          </li>
        </ul>
        <p>
          Atendemos consultas de compra, seguimiento de pedidos, garantía y devoluciones. Si estás
          eligiendo entre varios productos, también te asesoramos sin compromiso.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
