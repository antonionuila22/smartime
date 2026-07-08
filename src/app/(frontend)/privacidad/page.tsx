import type { Metadata } from 'next'
import React from 'react'

import { InfoPage, InfoSection } from '@/components/InfoPage'

// Página estática: sin datos, se prerenderiza completa en el shell.
// TODO: revisar este texto con un asesor legal antes de publicar en producción.

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Qué datos recoge smartime, para qué los usa, con quién los comparte y cómo ejercer tus derechos de acceso, rectificación y eliminación.',
  alternates: { canonical: '/privacidad' },
}

// Mismo idioma de enlace en línea que login/carrito
const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 transition-colors duration-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'

export default function PrivacidadPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Política de privacidad"
      intro="Tratamos tus datos con el mínimo necesario para operar la tienda. Aquí explicamos qué recogemos, para qué y cómo ejercer tus derechos."
    >
      <InfoSection title="Qué datos recogemos">
        <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
          <li>
            <strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña (almacenada de
            forma cifrada).
          </li>
          <li>
            <strong>Datos de pedido:</strong> productos comprados, direcciones de entrega, teléfono
            de contacto e historial de compras.
          </li>
          <li>
            <strong>Datos de contacto:</strong> los mensajes que nos envías por correo o WhatsApp
            para atender tus consultas.
          </li>
        </ul>
        <p>
          No recibimos ni almacenamos los datos de tu tarjeta: el pago se procesa íntegramente en la
          plataforma de PayPal.
        </p>
      </InfoSection>

      <InfoSection title="Para qué los usamos">
        <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
          <li>Gestionar tu cuenta, tus pedidos y las entregas.</li>
          <li>Emitir la factura de cada compra.</li>
          <li>Atender consultas, reclamos de garantía y devoluciones.</li>
          <li>
            Enviarte novedades y ofertas solo si te suscribes; puedes darte de baja cuando quieras.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Con quién se comparten">
        <p>Compartimos datos únicamente con los proveedores necesarios para completar tu compra:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
          <li>
            <strong>PayPal</strong>, como procesador de pagos, recibe los datos necesarios para
            procesar la transacción bajo su propia política de privacidad.
          </li>
          <li>
            <strong>El proveedor de envío</strong> recibe tu nombre, dirección y teléfono para
            entregar el pedido.
          </li>
        </ul>
        <p>
          <strong>No vendemos ni alquilamos tus datos</strong> a terceros con fines publicitarios.
        </p>
      </InfoSection>

      <InfoSection title="Tus derechos">
        <p>
          Puedes solicitar en cualquier momento el acceso, la rectificación o la eliminación de tus
          datos personales escribiendo a{' '}
          <a href="mailto:hola@smartime.hn" className={linkClass}>
            hola@smartime.hn
          </a>{' '}
          desde el correo asociado a tu cuenta. Respondemos en un plazo razonable y, en el caso de
          eliminación, conservamos solo lo que la legislación fiscal hondureña nos obligue a retener
          (por ejemplo, facturas emitidas).
        </p>
      </InfoSection>

      <InfoSection title="Cookies">
        <p>
          Usamos únicamente cookies técnicas, necesarias para el funcionamiento de la tienda:
          mantener tu sesión iniciada, recordar tu carrito y tu preferencia de tema (claro u
          oscuro). No usamos cookies de publicidad ni de seguimiento de terceros.
        </p>
        <p className="text-xs">Última actualización: julio de 2026.</p>
      </InfoSection>
    </InfoPage>
  )
}
