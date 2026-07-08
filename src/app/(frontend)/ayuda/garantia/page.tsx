import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { InfoPage, InfoSection } from '@/components/InfoPage'

// Página estática: sin datos, se prerenderiza completa en el shell.

export const metadata: Metadata = {
  title: 'Garantía',
  description:
    'Todos los productos de smartime son originales, nuevos y sellados, con garantía del fabricante y factura incluida. Así se hace un reclamo de garantía.',
  alternates: { canonical: '/ayuda/garantia' },
}

// Mismo idioma de enlace en línea que login/carrito
const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

export default function GarantiaPage() {
  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Garantía"
      intro="Vendemos únicamente productos originales y nuevos. Aquí te explicamos qué cubre la garantía y cómo hacer un reclamo si algo sale mal."
    >
      <InfoSection title="Productos originales y sellados">
        <p>
          Todo lo que vendemos — Apple, electrodomésticos, audio, TV, gaming y smart home — es{' '}
          <strong>original, nuevo y sellado de fábrica</strong>. No vendemos productos
          reacondicionados, genéricos ni de segunda mano.
        </p>
      </InfoSection>

      <InfoSection title="Garantía del fabricante">
        <p>
          Cada producto incluye la garantía oficial de su fabricante, que cubre defectos de
          fabricación durante el plazo que el fabricante establece para cada categoría. El plazo y
          las condiciones concretas aparecen en la documentación del producto.
        </p>
        <p>
          La garantía no cubre daños por golpes, líquidos, mal uso o intervenciones de servicios
          técnicos no autorizados.
        </p>
      </InfoSection>

      <InfoSection title="Factura incluida">
        <p>
          Todos los pedidos incluyen su factura. Guárdala: es tu comprobante de compra y el
          documento que respalda cualquier reclamo de garantía. También puedes consultar tus pedidos
          en{' '}
          <Link href="/cuenta" className={linkClass}>
            tu cuenta
          </Link>
          .
        </p>
      </InfoSection>

      <InfoSection title="Cómo hacer un reclamo">
        <p>Si tu producto presenta un defecto de fabricación, contáctanos con estos datos:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
          <li>Número de pedido (lo encuentras en tu cuenta o en el correo de confirmación)</li>
          <li>Descripción del problema, con fotos o video si es posible</li>
        </ul>
        <p>
          Escríbenos por WhatsApp al{' '}
          <a href="tel:+50494976404" className={linkClass}>
            +504 9497-6404
          </a>{' '}
          o al correo{' '}
          <a href="mailto:hola@smartime.hn" className={linkClass}>
            hola@smartime.hn
          </a>
          . Revisamos el caso, te confirmamos si aplica la garantía y coordinamos contigo la gestión
          con el fabricante o el cambio del producto.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
