# 08 — Pasarelas de pago en Honduras (cobro local + PayPal) — smartime

> Estado: investigación + decisión de arquitectura. Fecha: 2026-06-30.
> Alcance: cómo COBRAR en Honduras (HNL) integrando pasarelas locales como **Payment Provider custom** de Medusa v2, en convivencia multi-proveedor con PayPal.
> **Lectura previa obligatoria:** `02-TRD.md §5` (Pagos PayPal), `07-fase1-checkout-spec.md §3` (Payment Module v2, registro y service skeleton), `06-implementation-plan.md` Fase 5 (pagos locales HN).

### Documentos relacionados (cruce de referencias)

| Doc | Sección | Qué aporta a este documento |
|---|---|---|
| `02-TRD.md` | §5.1–5.4 | Arquitectura de pago como Payment Provider; flujo authorize/capture; precios server-side; R2 moneda de liquidación (HNL no soportado por PayPal). |
| `07-fase1-checkout-spec.md` | §3.1–3.7, §4.2 | Registro EXACTO del módulo en `medusa-config.ts`; convención de `provider_id` (`pp_{id}_{identifier}`); skeleton del service v2; ruta de webhook `/hooks/payment/{id}_{identifier}`; checkout **agnóstico** (`listPaymentProviders` + render por `session.provider_id`). |
| `06-implementation-plan.md` | Fase 5 (líneas 329–397) | Pagos locales HN son **L**, post-MVP, dependen de proveedor externo; el pago local **extiende** el Payment Module ya configurado en Fase 1. |
| `01-PRD.md` | §10.1 R2, P1.2 | Riesgo abierto de moneda; requisito de "pago local sin cargos extra → pedido Pagado". |

---

## 1. Contexto

El consumidor hondureño paga mayoritariamente con **tarjeta local (Visa/Mastercard de BAC Credomatic y otros emisores)** y valora el **pago en cuotas** del adquirente local. PayPal (MVP, Fase 1) **no liquida en HNL** y no resuelve la tarjeta local: cubre al cliente internacional, no al comprador típico de Honduras. Por eso, post-MVP (Fase 5) se añade **al menos una pasarela local**.

La pieza clave ya está resuelta en el diseño: **el checkout es agnóstico al proveedor**. Como se especifica en `07 §4.2`, el storefront:

1. Llama `medusa.store.payment.listPaymentProviders({ region_id })` para obtener los proveedores habilitados en la región Honduras.
2. Inicia la sesión con `initiatePaymentSession(cart, { provider_id })` (⚠️ arg1 = objeto `cart`, no el id — verificado en `.d.ts`).
3. **Ramifica la UI por `session.provider_id`** (no hardcodea PayPal): cada proveedor aporta su propio render (botón redirect vs. formulario embebido).

Esto significa que **añadir una pasarela local es escribir un nuevo Payment Provider custom + habilitarlo en la región**, sin reescribir el checkout. El total siempre se toma de `cart.total` server-side (`02 §5.3`): ninguna pasarela recibe importes como input de confianza.

> **No existe ningún plugin/provider de Medusa público para pasarelas hondureñas** (PixelPay, BAC/FAC, TodoPago). Para cada una hay que escribir un `AbstractPaymentProvider` custom. (Confianza ALTA.)

---

## 2. Tabla comparativa de opciones

Columnas: modelo · UX · carga PCI · cuotas · moneda/liquidación · sandbox · esfuerzo Medusa · madurez/confianza.

| Opción | Modelo | UX | Carga PCI | Cuotas | Moneda / liquidación | Sandbox | Esfuerzo en Medusa | Madurez / confianza |
|---|---|---|---|---|---|---|---|---|
| **PixelPay** (fintech HN) | Embebido (SDK/API directo) **o** redirect (Hosted Payment Gateway / link de pago) | Mejor: formulario inline sin salir del sitio; tokeniza tarjeta | **SAQ A-EP/D** si embebes el form; SAQ A si usas su página hospedada | **Sí, nativo** (`setInstallment(months, type)`) | **HNL confirmado**; USD probable **no confirmado**. Liquidación no documentada | **Sí** (`setupSandbox()`; tarjetas `4111…`, `5555…`; tokens caducan ~5 h) | **Media** — un provider custom con su SDK (`@pixelpay/sdk-core`); 3DS añade complejidad | **Media-alta**. SDK oficial JS/TS público y activo (v2.5.2, 2026-05). Docs tras Cloudflare JS-challenge |
| **BAC "Compra Click"** (link de pago) | **Link de pago / redirect** generado en banca en línea BAC | Cliente paga en página BAC; soporta cuotas BAC y puntos | SAQ A (página del banco) | **Sí** (0% Cuotas / Extra 0%, programa BAC) | HNL y USD; liquida a cuenta BAC | n/d | **Bajo en código / Alto operativo** — **sin API pública de creación de links confirmada** → modelar como **manual/offline** | **Media**. El producto existe (confianza ALTA); la creación por API **NO está confirmada** (parece solo-portal) |
| **FAC / PowerTranz** (motor que usa BAC e-commerce) | Embebido (form propio) + **redirect 3DS** (challenge ACS) | Híbrida: captura tarjeta inline + redirección al banco para 3DS y retorno | **SAQ A-EP/D** (form embebido); SAQ A si HPP | Vía adquirente BAC (cuotas BAC) | Multimoneda (USD, XCD, JMD…); **HNL depende del adquirente BAC — no confirmado directo** | **Sí** (`https://staging.ptranz.com/api/`) | **Alto** — flujo 3DS en 2+ pasos (Auth → SpiToken + RedirectData → challenge → Payment) + manejo de retorno | **Media-alta técnica**; docs FAC públicas (PDFs). Pero **onboarding bancario BAC obligatorio** (~6-7 días, credenciales tras contrato) |
| **PayPal** (ya en Fase 1) | Redirect / SDK botón | Botón PayPal; aprueba en PayPal | SAQ A | No (cuotas BAC no aplican) | **No liquida HNL** → mostrar HNL, liquidar en USD con tasa transparente (`02 §5.4` opción A) | Sí (sandbox PayPal) | Ya implementado (`07 §3`) | **Alta**. Provider de referencia ya especificado |
| **Transferencia / manual** | **Offline / manual** | Cliente recibe datos bancarios o link Compra Click; sube comprobante; operador confirma | Ninguna (fuera del sistema) | Según banco emisor | HNL directo a cuenta del comercio | No aplica | **Bajo** — provider manual (existe `pp_system_default`) o custom mínimo | **Alta** disponibilidad / **baja** automatización (confirmación humana) |

> Costos referenciales BAC/FAC observados (negociables, **confianza MEDIA**): ~US$100–200 inscripción + ~US$45–50/mes + ~US$0.12–0.18/transacción.

---

## 3. Mapeo a `AbstractPaymentProvider` de Medusa v2

Toda pasarela se implementa igual que PayPal en `07 §3.3`: un módulo cuyo service **extiende `AbstractPaymentProvider`** (de `@medusajs/framework/utils`), con `static identifier`, registrado en el array `providers` del módulo `@medusajs/payment` en `medusa-config.ts`. El `provider_id` final es **`pp_{id}_{identifier}`** y el webhook automático queda en **`POST {server_url}/hooks/payment/{id}_{identifier}`** (sin crear ruta manual). Lo que cambia entre **embebido** y **redirect** es **qué devuelve `initiatePayment` en `data`** y **cómo reacciona el front**.

Firmas v2 (objeto único `XInput → Promise<XOutput>`, igual que el skeleton PayPal de `07 §3.3`):

| Método | Embebido (PixelPay-SDK) | Redirect / link (FAC-HPP, Compra Click, PixelPay-hosted) | Manual (transferencia) |
|---|---|---|---|
| `initiatePayment` | Crea sesión/orden con la pasarela; devuelve `{ id, data: { payment_uuid, token } }`. El front monta el SDK inline. | Devuelve `{ id, data: { approval_url } }`; el front lee `session.data.approval_url` y **redirige**. | `{ id, data: {} }`; muestra instrucciones de transferencia. |
| `authorizePayment` | Llama `doAuth`/`doSale` (PixelPay) o `Auth/Sale` (FAC). 3DS → status `requires_more` (`PaymentActions.REQUIRES_MORE`) con `RedirectData` para el challenge ACS. Frictionless / `IsoResponseCode='00'` → `authorized`. | El cierre **real** llega por **webhook** (`getWebhookActionAndData`); `authorizePayment` puede quedar pendiente hasta el retorno. | Permanece `pending` hasta confirmación manual del operador (capture manual). |
| `capturePayment` | `doCapture(payment_uuid, amount)` / `Capture(TransactionIdentifier, TotalAmount)`. | idem; o automático tras webhook `captured`. | Operador marca capturado al verificar comprobante. |
| `cancelPayment` | `doVoid` (PixelPay) / `Void` (FAC). | idem. | no-op / cancelación manual. |
| `refundPayment` | **PixelPay no tiene `refund` nativo** → solo `doVoid` (anulación pre-liquidación); reembolso post-liquidación por panel/soporte ⚠️. FAC sí tiene `Refund` total/parcial. | idem según pasarela. | Reembolso manual fuera del sistema. |
| `getPaymentStatus` / `retrievePayment` | `getStatus(payment_uuid)` / mapear `Approved`/`IsoResponseCode`. | idem. | Estado manual. |
| `getWebhookActionAndData` | Validar integridad (PixelPay: `verifyPaymentHash(hash, order_id, secret)`) y mapear a `AUTHORIZED`/`CAPTURED`/`FAILED`; devolver `{ action, data: { session_id, amount } }`. **`session_id` debe casar con la payment session** → pasar un identificador estable (`order_id`/`OrderIdentifier`) entre `initiate` y webhook. | **Crítico para redirect**: si el server no es alcanzable en `/hooks/payment/{id}_{identifier}`, el cargo se cobra pero el pedido **no se completa**. | No aplica (sin webhook). |

**Patrón de cierre por webhook** (idéntico al de PayPal en `02 §5.1`): cuando `getWebhookActionAndData` devuelve `AUTHORIZED`/`CAPTURED`, Medusa marca la sesión y, si el carrito no está completado, lo completa (`processPaymentWorkflow`). Idempotente (`02 §5.2`).

**Registro multi-proveedor** (`medusa-config.ts`, ampliando `07 §3.4`):

```ts
modules: [
  {
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        { resolve: "./src/modules/paypal",   id: "paypal",   options: { /* … */ } }, // pp_paypal_paypal (Fase 1)
        { resolve: "./src/modules/pixelpay",  id: "pixelpay", options: { /* … */ } }, // pp_pixelpay_pixelpay (Fase 5)
        // { resolve: "./src/modules/fac",    id: "fac",      options: { /* … */ } }, // pp_fac_fac (opcional)
      ],
    },
  },
]
```

Cada provider se **habilita en la región Honduras** desde Admin → Settings → Regions → Payment Providers (o programáticamente vía el modelo `PaymentProvider.is_enabled`, ampliando un seed como en `07 §3.6`). Si no está habilitado en la región, **no aparece** en `listPaymentProviders`.

---

## 4. Arquitectura recomendada (multi-proveedor)

**Diseño:** registrar **PayPal + 1 pasarela local + opción manual** bajo el mismo Payment Module, habilitar los que correspondan en la región Honduras (HNL), y dejar que el checkout agnóstico (`listPaymentProviders` + render por `session.provider_id`, `07 §4.2`) muestre las opciones para que el cliente elija.

**Qué construir PRIMERO para HN y por qué:**

1. **PixelPay (PRIMERO).** Es la única opción local **developer-friendly sin fricción de onboarding bancario**: SDK oficial JS/TS público y activo (`@pixelpay/sdk-core`), sandbox abierto, **HNL confirmado**, soporta **embebido** (mejor UX, mapea al patrón Stripe-like de Medusa) y **cuotas nativas**. Permite **prototipar hoy** sin esperar contrato. Mapea directo a un provider embebido con `authorize/capture/void/status`.
2. **Transferencia / manual (en paralelo, barato).** Provider manual como red de seguridad: cubre al cliente que no quiere tarjeta y no depende de ninguna API. Esfuerzo bajo; entrega valor inmediato mientras se cierra cualquier contrato.
3. **BAC / FAC-PowerTranz (DESPUÉS).** Máxima cobertura de tarjeta local y cuotas BAC, pero **bloqueado por onboarding bancario** (~6-7 días, credenciales solo tras firmar contrato) y flujo 3DS en 2+ pasos (esfuerzo Alto). Iniciar el **trámite de afiliación en paralelo** desde el principio porque es la dependencia de calendario más larga.
4. **BAC Compra Click (link de pago)** como complemento **manual/offline**, no como integración embebida, mientras no se confirme una API de creación de links.

**Orden sugerido (Fase 5, ampliando `06` líneas 329–397):**

```
Fase 1 (hecho): PayPal (pp_paypal_paypal) — base del Payment Module
Fase 5.a: PixelPay embebido (HNL, cuotas, sandbox)  ← construir primero
Fase 5.b: Transferencia/manual                       ← en paralelo, barato
Fase 5.c: BAC/FAC redirect+3DS                        ← tras onboarding (iniciar trámite ya)
(opcional) BAC Compra Click como provider manual/offline
```

> **Decisión de moneda (cruza `02 §5.4` / `01 R2`):** PixelPay y BAC liquidan **HNL nativo**, eliminando la conversión que PayPal exige (opción A de `02 §5.4`). Esto refuerza añadir un proveedor local cuanto antes.

---

## 5. Credenciales / cuentas que necesita el negocio

| Proveedor | Qué hay que conseguir |
|---|---|
| **PixelPay** | Cuenta de comercio afiliado (comercio en HN; `pixelpay.com/afiliation`). Del panel: **Endpoint**, **Key ID** (`x-auth-key`) y **Secret Key**. ⚠️ La Secret se usa como **hash SHA512** (`x-auth-hash`); MD5 solo para plugins tipo Shopify. Opcional: `auth_user` (plataforma), `public_key` (cifrado E2E), credenciales de **sandbox** para pruebas. |
| **BAC / FAC** | Cuenta bancaria **BAC en Honduras**; **RTN** (inscrito en SAR); **contrato de afiliación e-commerce** firmado. BAC entrega en ~6-7 días: **llaves de seguridad**, **Processor/Merchant ID**, manuales. Para FAC directo: **PowerTranzId** (GUID) + **PowerTranzPassword**. Certificado **TLS 1.2/1.3**, 3DS 2.0, sitio con catálogo/políticas/logos de tarjetas. |
| **BAC Compra Click** | Cuenta BAC + RTN; alta de Compra Click en banca en línea (`baccredomatic.com/es-hn/personas/solicitud-compra-click/solicitud`). Sin credenciales de API confirmadas. |
| **PayPal** | `client_id` / `client_secret` de la app + `webhook_id` (ya configurado, `07 §3.5`). |
| **Transferencia / manual** | Datos de cuenta bancaria del comercio. Sin credenciales técnicas. |
| **Medusa (todas)** | Definir cada provider en `medusa-config.ts` y **habilitarlo en la región Honduras** (Admin o `is_enabled`); la región debe tener **HNL** configurada. |

---

## 6. Riesgos e incertidumbres (con nivel de confianza) y qué validar

| # | Riesgo / incertidumbre | Confianza | Qué validar antes de prometerlo |
|---|---|---|---|
| R1 | **BAC Compra Click sin API pública de creación de links.** Parece solo-portal. | Media-alta (en que es solo-portal) | Confirmar con ejecutivo BAC si existe API; si no, modelar como **manual/offline** (no automatizar). |
| R2 | **PixelPay no tiene `refund` nativo** (solo `doVoid` = anulación pre-liquidación). | Alta (ausencia de `refund` en SDK) | Confirmar con PixelPay cómo gestionar reembolsos post-liquidación (panel/soporte). Mapear gap en el provider. |
| R3 | **USD no confirmado en PixelPay** (HNL sí). | Media-baja | Validar con PixelPay si el catálogo necesita cobrar USD además de HNL. |
| R4 | **HNL en FAC depende del adquirente BAC**, no de FAC directo. | Media | Confirmar moneda de liquidación en el contrato BAC; no asumir HNL sin BAC. |
| R5 | **Cierre por webhook en redirect** (FAC/Compra Click/PixelPay-hosted): si el server Medusa no es público en `/hooks/payment/{id}_{identifier}`, se cobra pero el pedido no se completa. | Alta | URL pública + verificación de firma; en prod, **Redis** para idempotencia/workflows (`07 §3.4` nota). |
| R6 | **3DS de PixelPay/FAC requiere paso en el navegador** (no Node puro): `withAuthenticationRequest()` (PixelPay) / `RedirectData`+ACS (FAC). | Media (PixelPay) / Alta (FAC) | Modelar `REQUIRES_MORE` en `authorizePayment` y el retorno (ResponseUrl). El provider de servidor por sí solo no completa 3DS. |
| R7 | **Soporte de cuotas BAC a nivel API** (vs. acuerdo con el adquirente). | Alta (API expone cuotas) / Baja (condiciones banco) | Confirmar con BAC qué planes/bancos aplican sin acuerdo adicional. |
| R8 | **Onboarding bancario BAC/FAC** (~6-7 días, docs solo tras contrato) bloquea prototipado. | Alta | Iniciar el trámite **en paralelo** desde el inicio de Fase 5; planificarlo como dependencia crítica. |
| R9 | **PCI según modelo**: form embebido (PixelPay/FAC directo) = SAQ A-EP/D; página hospedada/HPP = SAQ A. | Alta | Decidir temprano el alcance PCI; preferir hosted si se quiere minimizar carga. |
| R10 | **Mecánica exacta de webhooks PixelPay** (eventos/firma) viene de doc Zendesk, no del código. | Media | Validar formato (query string vs `x-www-form-urlencoded`) y usar `verifyPaymentHash`. |
| R11 | **`CurrencyCode` de FAC es ISO numérico** (no alfabético). | Alta | Mapear desde Medusa: HNL=340, USD=840. |
| R12 | **No hay provider Medusa público para ninguna pasarela HN.** | Alta | Presupuestar el desarrollo de cada `AbstractPaymentProvider` custom. |

**Marcado NO confirmado (resumen):** API de creación de links Compra Click (R1); `refund` y USD en PixelPay (R2, R3); HNL directo en FAC sin BAC (R4); detalle de cuotas/condiciones BAC (R7); mecánica exacta de webhook PixelPay (R10). TodoPago (mencionado en investigación previa) se **descarta de la recomendación**: sin SDK ni docs públicas (confianza media-baja).

---

## 7. Próximos pasos

1. Crear cuenta de **sandbox PixelPay** y validar `@pixelpay/sdk-core` (HNL, cuotas, void) en un spike aislado.
2. Implementar `src/modules/pixelpay` siguiendo el skeleton de `07 §3.3`; registrar en `medusa-config.ts`; habilitar en región Honduras.
3. Añadir render embebido por `session.provider_id` en el checkout (ya agnóstico, `07 §4.2`).
4. Iniciar **en paralelo** el trámite de afiliación BAC e-commerce (dependencia larga).
5. Confirmar con BAC/PixelPay los puntos abiertos R1–R4, R7, R10.
