import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { InfoPage } from '@/components/InfoPage'
import { JsonLd } from '@/components/JsonLd'

// Página estática: sin datos, se prerenderiza completa en el shell.

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description:
    'Respuestas a las dudas más comunes sobre smartime: métodos de pago, cuotas, envíos a todo Honduras, retiro en tienda, garantía, devoluciones y más.',
  alternates: { canonical: '/ayuda/preguntas-frecuentes' },
}

// Mismo idioma de enlace en línea que login/carrito
const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

// Fuente única de verdad: de este array salen tanto la UI como el JSON-LD (FAQPage).
// Respuestas en texto plano para que sean válidas en schema.org sin markup.
const FAQS: { q: string; a: string }[] = [
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Pagas de forma segura a través de PayPal: con tu saldo PayPal o con tarjeta de crédito o débito (Visa y Mastercard) procesada por PayPal. Todos los precios están en Lempiras (HNL) con ISV incluido.',
  },
  {
    q: '¿Puedo pagar en cuotas?',
    a: 'Sí. Ofrecemos hasta 12 meses sin intereses con tarjetas participantes. La opción de cuotas se elige al momento de pagar, dentro del flujo de PayPal.',
  },
  {
    q: '¿Hacen envíos a todo Honduras?',
    a: 'Sí. El envío estándar llega en 2 a 4 días hábiles a cualquier punto del país. El costo se calcula en el checkout según tu dirección, antes de confirmar el pago.',
  },
  {
    q: '¿Puedo retirar mi pedido en tienda?',
    a: 'Sí, en Tegucigalpa y San Pedro Sula. Tu pedido queda listo en 1 a 2 días hábiles y te avisamos por correo cuando puedas pasar a recogerlo con tu número de pedido y una identificación.',
  },
  {
    q: '¿Necesito una cuenta para comprar?',
    a: 'Sí, la cuenta es obligatoria para comprar. Así tu carrito, tus direcciones y el historial de pedidos quedan guardados y puedes dar seguimiento a cada compra. Crearla toma menos de un minuto.',
  },
  {
    q: '¿Cómo doy seguimiento a mi pedido?',
    a: 'En la sección "Mi cuenta" ves el estado de cada pedido y su fecha estimada de entrega. Esa fecha se calcula al confirmar el pedido y queda congelada, así que siempre sabes qué esperar.',
  },
  {
    q: '¿Los productos son originales?',
    a: 'Sí. Todo lo que vendemos es original, nuevo y sellado de fábrica, con garantía del fabricante. No vendemos productos reacondicionados ni genéricos.',
  },
  {
    q: '¿Puedo devolver un producto?',
    a: 'Sí, tienes 7 días calendario desde la entrega. El producto debe estar sellado y sin uso, salvo que haya llegado defectuoso. El reembolso se emite al mismo método de pago.',
  },
  {
    q: '¿Emiten factura?',
    a: 'Sí, todos los pedidos incluyen su factura. Es tu comprobante de compra y el documento que respalda la garantía del fabricante.',
  },
  {
    q: '¿Cómo los contacto?',
    a: 'Por WhatsApp o teléfono al +504 9497-6404, o por correo a hola@smartime.hn. Atendemos consultas de compra, envíos, garantía y devoluciones.',
  },
]

export default function PreguntasFrecuentesPage() {
  return (
    <>
      {/* Datos estructurados FAQPage, generados del mismo array que la UI */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
          })),
        }}
      />

      <InfoPage
        eyebrow="Ayuda"
        title="Preguntas frecuentes"
        intro="Las dudas que más nos llegan, respondidas de forma directa. Si no encuentras la tuya, escríbenos y te respondemos."
      >
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQS.map((faq) => (
            <section key={faq.q} className="p-5 sm:p-6">
              <h2 className="text-lg font-bold tracking-tight">{faq.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {faq.a}
              </p>
            </section>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          ¿Tu pregunta no está aquí? Escríbenos por WhatsApp al{' '}
          <a href="tel:+50494976404" className={linkClass}>
            +504 9497-6404
          </a>
          , al correo{' '}
          <a href="mailto:hola@smartime.hn" className={linkClass}>
            hola@smartime.hn
          </a>{' '}
          o revisa las guías de{' '}
          <Link href="/ayuda/envios" className={linkClass}>
            envíos
          </Link>
          ,{' '}
          <Link href="/ayuda/garantia" className={linkClass}>
            garantía
          </Link>{' '}
          y{' '}
          <Link href="/ayuda/devoluciones" className={linkClass}>
            devoluciones
          </Link>
          .
        </p>
      </InfoPage>
    </>
  )
}
