import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { InfoPage, InfoSection } from '@/components/InfoPage'

// Página estática: sin datos, se prerenderiza completa en el shell.
// TODO: revisar este texto con un asesor legal antes de publicar en producción.

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description:
    'Términos y condiciones de compra en smartime: precios en Lempiras con ISV, pagos vía PayPal, envíos y retiro en tienda, devoluciones y garantía.',
  alternates: { canonical: '/terminos' },
}

// Mismo idioma de enlace en línea que login/carrito
const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

export default function TerminosPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Términos y condiciones"
      intro="Estos términos regulan el uso de la tienda en línea de smartime y las compras que realices en ella. Al comprar, aceptas estas condiciones."
    >
      <InfoSection title="1. Quiénes somos">
        <p>
          smartime es una tienda en línea hondureña de tecnología que opera en smartime.hn, con
          puntos de retiro en Tegucigalpa y San Pedro Sula. Puedes contactarnos por WhatsApp o
          teléfono al{' '}
          <a href="tel:+50494976404" className={linkClass}>
            +504 9497-6404
          </a>{' '}
          o por correo a{' '}
          <a href="mailto:hola@smartime.hn" className={linkClass}>
            hola@smartime.hn
          </a>
          .
        </p>
      </InfoSection>

      <InfoSection title="2. Precios e impuestos">
        <p>
          Todos los precios se expresan en Lempiras (HNL) e incluyen el Impuesto sobre Ventas (ISV).
          El precio aplicable es el vigente al momento de confirmar el pedido. Nos reservamos el
          derecho de corregir errores evidentes de precio o descripción; si esto afecta un pedido ya
          realizado, te contactaremos antes de procesarlo para que decidas si lo mantienes o lo
          cancelas con reembolso completo.
        </p>
      </InfoSection>

      <InfoSection title="3. Proceso de compra">
        <p>
          Para comprar es necesario crear una cuenta con datos veraces y mantenerlos actualizados.
          El pedido se considera confirmado cuando el pago es aprobado y recibes el correo de
          confirmación. La disponibilidad de los productos está sujeta a existencias; si un producto
          no está disponible tras la compra, te lo notificaremos y reembolsaremos el importe
          correspondiente.
        </p>
      </InfoSection>

      <InfoSection title="4. Pagos">
        <p>
          Los pagos se procesan a través de PayPal, de contado o hasta en 12 meses sin intereses con
          tarjetas participantes. smartime no recibe ni almacena los datos de tu tarjeta: el
          procesamiento del pago ocurre íntegramente en la plataforma de PayPal, bajo sus propios
          términos de servicio.
        </p>
      </InfoSection>

      <InfoSection title="5. Envíos y retiro en tienda">
        <p>
          Ofrecemos envío estándar a todo Honduras (2 a 4 días hábiles) y retiro en tienda en
          Tegucigalpa y San Pedro Sula (1 a 2 días hábiles). La fecha estimada de entrega se calcula
          y se congela al confirmar el pedido, y es consultable en tu cuenta. Los plazos se expresan
          en días hábiles y pueden verse afectados por causas de fuerza mayor. Más detalles en{' '}
          <Link href="/ayuda/envios" className={linkClass}>
            Envíos
          </Link>
          .
        </p>
      </InfoSection>

      <InfoSection title="6. Devoluciones">
        <p>
          Aceptamos devoluciones dentro de los 7 días calendario siguientes a la entrega, con el
          producto sellado y sin uso, salvo que haya llegado defectuoso. El reembolso se emite al
          mismo método de pago. Las condiciones completas están en{' '}
          <Link href="/ayuda/devoluciones" className={linkClass}>
            Devoluciones
          </Link>
          .
        </p>
      </InfoSection>

      <InfoSection title="7. Garantía">
        <p>
          Todos los productos son originales, nuevos y sellados, y cuentan con la garantía del
          fabricante contra defectos de fabricación, según el plazo y las condiciones de cada
          fabricante. Cada pedido incluye su factura como comprobante. Más información en{' '}
          <Link href="/ayuda/garantia" className={linkClass}>
            Garantía
          </Link>
          .
        </p>
      </InfoSection>

      <InfoSection title="8. Limitación de responsabilidad">
        <p>
          smartime responde por la entrega de los productos comprados y por las obligaciones que la
          ley hondureña de protección al consumidor le impone. No somos responsables de daños
          indirectos derivados del uso o la imposibilidad de uso de los productos, más allá de lo
          que establezca la legislación aplicable, ni de interrupciones del sitio por causas fuera
          de nuestro control razonable.
        </p>
      </InfoSection>

      <InfoSection title="9. Ley aplicable">
        <p>
          Estos términos se rigen por las leyes de la República de Honduras. Cualquier controversia
          se someterá a los tribunales competentes de Honduras, sin perjuicio de los derechos que la
          normativa de protección al consumidor te reconozca.
        </p>
        <p className="text-xs">Última actualización: julio de 2026.</p>
      </InfoSection>
    </InfoPage>
  )
}
