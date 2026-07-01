# 07 — Spec de implementación · Fase 1: Checkout con cuenta obligatoria + PayPal + envíos HN

> **Estado:** spec de implementación (tech lead). **Proyecto:** smartime (Honduras, HNL).
> **Stacks verificados:** storefront Next.js `16.2.6` + React `19.2.6` + `@medusajs/js-sdk@^2.17.1`; backend Medusa `@medusajs/medusa@2.17.0` + `@medusajs/framework@2.17.0` (Postgres Supabase).
> **Cruces:** [`02-TRD.md`](./02-TRD.md) §3.5/§4/§5/§6 · [`04-app-flow.md`](./04-app-flow.md) §3.c/§3.d · [`06-implementation-plan.md`](./06-implementation-plan.md) Fase 1 + Fase 2.
> **Alcance:** esta spec une la **Fase 1** (checkout + cuenta + PayPal) y la parte de **envíos HN nativos** que el plan colocó en Fase 2 (porque la tarea de negocio actual los pide juntos). Donde el plan separa fases, se indica.

Todas las firmas de SDK/módulo de abajo están **verificadas contra los `.d.ts` realmente instalados** y/o contra la investigación recabada. Lo que quedó **incierto** se marca con `⚠️ VALIDAR` y se concentra en la §9.

---

## 1. Arquitectura del checkout paso a paso

### 1.1 Principios de diseño

1. **Cuenta obligatoria (D1).** El backend ya protege `POST /store/carts/:id/complete` con `authenticate("customer", ["session","bearer"])` (`medusa/src/api/middlewares.ts`, verificado). El storefront **debe** redirigir a `/login?redirect=/checkout` antes de pagar; el guard es la última línea de defensa, no la única (TRD §3.5).
2. **Precios siempre server-side.** El total que se cobra sale de `cart.total` (Medusa calcula subtotal + envío + impuestos). El front solo formatea con `formatPrice`; nunca recalcula ni envía el monto como input de confianza (TRD §5.3).
3. **PayPal es un Payment Provider del Payment Module v2**, no un plugin v1 ni una integración ad-hoc en el front. El front orquesta el SDK JS de PayPal en el navegador y confirma contra Medusa; nunca ve el `client_secret` (TRD §5.1).
4. **El carrito se conserva ante cualquier fallo.** `complete()` solo "consume" el carrito cuando devuelve `type: "order"`. Cancelación de PayPal, sesión expirada o stock agotado dejan el carrito intacto y permiten reintento (flow §3.c, errores E2/E3/E5).

### 1.2 Orden exacto de llamadas (carrito → pedido)

| # | Paso UI | Llamada SDK (firma real verificada) | Notas |
|---|---|---|---|
| 0 | **Gate de cuenta** | `medusa.store.customer.retrieve()` (si 401 → redirigir) | Bloquea entrada a `/checkout` sin sesión. |
| 1 | Login / registro | `medusa.auth.login("customer","emailpass",{email,password})` → `string \| {location}` | Ya implementado en `/login` y `/registro`. |
| 2 | Email al cart | `medusa.store.cart.update(cartId, { email })` → `{ cart }` | |
| 3 | **Transferir cart anónimo al cliente** | `medusa.store.cart.transferCart(cartId)` → `{ cart }` | Setea `customer_id`. **No** se setea a mano vía update. |
| 4 | Direcciones | `medusa.store.cart.update(cartId, { shipping_address, billing_address })` | `country_code: "hn"` (ISO-2 minúscula). |
| 5 | Listar envíos | `medusa.store.fulfillment.listCartOptions({ cart_id })` → `{ shipping_options }` | `price_type` `flat`/`calculated`. |
| 5b | (solo `calculated`) | `medusa.store.fulfillment.calculate(optionId, { cart_id, data })` → `{ shipping_option }` | Una llamada por opción `calculated`; devuelve **singular**. |
| 6 | Añadir método envío | `medusa.store.cart.addShippingMethod(cartId, { option_id, data? })` → `{ cart }` | Recalcula total server-side. |
| 7 | Listar payment providers | `medusa.store.payment.listPaymentProviders({ region_id })` → `{ payment_providers }` | Espera `pp_paypal_paypal` (ver §3). |
| 8 | **Iniciar payment session** | `medusa.store.payment.initiatePaymentSession(cart, { provider_id })` → `{ payment_collection }` | ⚠️ **arg1 = objeto cart, NO el id.** Verificado en `.d.ts`. |
| 9 | Re-fetch cart | `medusa.store.cart.retrieve(cartId, { fields: "*payment_collection,*payment_collection.payment_sessions" })` | La sesión vive en `cart.payment_collection.payment_sessions`. |
| 10 | Botones PayPal | (cliente) `@paypal/react-paypal-js` con `activeSession.data` | El comprador aprueba; recién entonces se completa. |
| 11 | **Completar** | `medusa.store.cart.complete(cartId)` → `{ type:"order", order } \| { type:"cart", cart, error }` | Va autenticado (bearer/session). Solo limpiar `CART_KEY` si `type==="order"`. |
| 12 | Confirmación | `medusa.store.order.retrieve(orderId, { fields })` → `{ order }` | Página `/checkout/confirmacion`. |

### 1.3 Diagrama de secuencia (mermaid)

```mermaid
sequenceDiagram
  autonumber
  participant C as Cliente (browser)
  participant S as Storefront (Next 16 · client component)
  participant M as Medusa Store API
  participant P as PayPal (sandbox)

  Note over C,S: Gate de cuenta (D1)
  S->>M: store.customer.retrieve()
  alt 401 (sin sesión)
    S-->>C: redirect /login?redirect=/checkout
    C->>S: login OK (auth.login → JWT)
  end

  Note over S,M: Vinculación carrito ↔ cliente
  S->>M: cart.update(cartId, { email })
  S->>M: cart.transferCart(cartId)  %% setea customer_id

  Note over C,S: Dirección de envío (HN)
  C->>S: completa dirección (country_code: hn)
  S->>M: cart.update(cartId, { shipping_address, billing_address })

  Note over S,M: Envío + ETA
  S->>M: fulfillment.listCartOptions({ cart_id })
  M-->>S: shipping_options [Estándar, Retiro] (data.eta_min/max_dias)
  C->>S: elige opción → muestra tarifa + ETA
  S->>M: cart.addShippingMethod(cartId, { option_id })
  M-->>S: cart (total recalculado)

  Note over S,P: Pago PayPal
  S->>M: payment.listPaymentProviders({ region_id })
  S->>M: payment.initiatePaymentSession(cart, { provider_id: pp_paypal_paypal })
  M->>P: createOrder (intent AUTHORIZE/CAPTURE, custom_id = session_id)
  M-->>S: payment_collection
  S->>M: cart.retrieve(cartId, fields=*payment_collection.payment_sessions)
  M-->>S: activeSession.data (PayPal order_id, approval data)
  S->>C: render botones PayPal (react-paypal-js)
  C->>P: aprueba el pago
  P-->>S: onApprove(orderID)

  Note over S,M: Completar (guard customer)
  S->>M: cart.complete(cartId)  %% Authorization: Bearer
  M->>P: authorizeOrder / captureOrder
  P-->>M: autorizado / capturado
  alt type === "order"
    M-->>S: { type:"order", order }
    S->>C: limpia CART_KEY → /checkout/confirmacion (nº pedido + ETA)
  else type === "cart"
    M-->>S: { type:"cart", cart, error }
    S->>C: "No pudimos procesar el pago"; carrito intacto; reintentar
  end

  Note over P,M: Reconciliación asíncrona
  P-->>M: Webhook PAYMENT.CAPTURE.COMPLETED → /hooks/payment/paypal_paypal (idempotente)
```

---

## 2. Backend — Envíos HN nativos

> Archivo nuevo: **`medusa/src/scripts/seed-fulfillment-hn.ts`**. Patrón idéntico a `seed-timesmart.ts` (idempotente, reusa entidades vía `query.graph`). Ejecutar con `npx medusa exec ./src/scripts/seed-fulfillment-hn.ts`.

### 2.1 Hechos verificados del entorno

- `medusa-config.ts` **no** registra el módulo Fulfillment → se usa el built-in con el **provider manual**. El `provider_id` completo es **`manual_manual`** (`{moduleProviderId}_{identifier}`).
- Ya existen: región `Honduras` (HNL, países `["hn"]`, `payment_providers ["pp_system_default"]`), `sales_channel`, `store`, `stock_location` (la del seed demo), `shipping_profile` default.
- ⚠️ **No tocar/ejecutar `src/migration-scripts/initial-data-seed.ts`** (boilerplate EUROPA). Sirve solo como referencia de firmas. (Plan tarea 2.11.)

### 2.2 Decisiones de modelado (Fase 1/2)

1. **Una sola service zone country `hn`.** Tegucigalpa / SPS / resto / retiro se diferencian con **distintas shipping options**, no con zonas finas (más simple y suficiente). Zonas `province`/`city` (ISO 3166-2: `hn-fm` Tegucigalpa, `hn-cr` SPS) quedan para una iteración posterior si negocio exige tarifa por departamento.
2. **ETA → ⚠️ DIVERGENCIA CRÍTICA con el TRD.** El TRD §6.2 y el plan (tareas 2.5/2.8) dicen guardar `min_days`/`max_days` en **`shipping_option.metadata`**. **La investigación verificó que en 2.17 `metadata` NO es escribible** vía `createShippingOptionsWorkflow` / `CreateShippingOptionDTO` / `updateShippingOptions` (solo el DTO de **lectura** `ShippingOptionDTO` lo expone). **Decisión de esta spec:** guardar el ETA en el campo **`data`** de la shipping option (`data: { eta_min_dias, eta_max_dias }`), que sí es soportado en create/update y el provider manual ignora. El storefront lo lee de `shipping_option.data`. **Acción:** actualizar TRD §6.2 y plan §2.5/§2.8 para que el contrato sea `data` y no `metadata`, o aceptar la divergencia documentada. (Ver §9.)
3. **Escala de montos:** unidades **mayores** (coherente con `seed-timesmart.ts`: `32999` = L 32 999,00). `amount: 150` = L 150,00. NO centavos.
4. **Retiro en tienda:** misma estructura, `amount: 0`, `type.code: "pickup"`. Medusa no tiene provider de pickup nativo.

### 2.3 Esqueleto `seed-fulfillment-hn.ts`

```ts
import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingProfilesWorkflow,
  createShippingOptionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function seedFulfillmentHn({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(Modules.FULFILLMENT)

  // 1) Reusar entidades existentes (idempotencia)
  const { data: [salesChannel] } = await query.graph({ entity: "sales_channel", fields: ["id"] })
  const { data: [stockLocation] } = await query.graph({ entity: "stock_location", fields: ["id", "name"] })
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "name", "currency_code"] })
  const honduras = regions.find((r: any) => r.name === "Honduras")
  if (!honduras) throw new Error("No existe la región Honduras: corre seed-timesmart primero.")

  // 2) Shipping profile default (no crear a ciegas)
  const profiles = await fulfillment.listShippingProfiles({ type: "default" })
  let shippingProfile = profiles[0]
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default", type: "default" }] },
    })
    shippingProfile = result[0] as any
  }

  // 3) Link stock_location ↔ provider manual (chequear antes para no duplicar)
  //    ⚠️ VALIDAR la forma de comprobación de link existente vía query.graph (ver §9).
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  // 4) Fulfillment set + service zone "Honduras" (geo_zone country hn) — método del módulo,
  //    NO existe createFulfillmentSetsWorkflow en core-flows 2.17.
  const existingSets = await fulfillment.listFulfillmentSets({ name: "Envíos Honduras" })
  let fulfillmentSet = existingSets[0]
  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillment.createFulfillmentSets({
      name: "Envíos Honduras",
      type: "shipping",
      service_zones: [
        { name: "Honduras", geo_zones: [{ country_code: "hn", type: "country" }] },
      ],
    })
  }
  const serviceZoneId = (fulfillmentSet as any).service_zones[0].id

  // 5) Link stock_location ↔ fulfillment_set
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  // 6) Shipping options (input es ARRAY directo). ETA en `data` (NO metadata).
  const baseRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" },
    { attribute: "is_return", value: "false", operator: "eq" },
  ]
  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Envío estándar Honduras",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Estándar", code: "standard", description: "Entrega 2 a 4 días hábiles" },
        data: { eta_min_dias: 2, eta_max_dias: 4 }, // contrato de ETA del storefront
        prices: [
          { currency_code: "hnl", amount: 150 },
          { region_id: honduras.id, amount: 150 },
        ],
        rules: baseRules,
      },
      {
        name: "Retiro en tienda",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Retiro", code: "pickup", description: "Retira en tienda, listo en 1-2 días" },
        data: { eta_min_dias: 1, eta_max_dias: 2 },
        prices: [
          { currency_code: "hnl", amount: 0 },
          { region_id: honduras.id, amount: 0 },
        ],
        rules: baseRules,
      },
    ],
  })

  // 7) Vincular stock location ↔ sales channel (idempotente)
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [salesChannel.id] },
  })

  logger.info("✅ Fulfillment HN seedeado (envío estándar + retiro, ETA en data)")
}
/* eslint-enable @typescript-eslint/no-explicit-any */
```

### 2.4 Orden estricto (dependencias)

`query.graph` (leer) → shipping profile → **(3) link provider** → **(4) fulfillment set + zona** → **(5) link set** → **(6) shipping options** → **(7) link sales channel**.
- (3) y (5) **antes** de (6): las options dependen de provider y set vinculados a la ubicación.
- (4) **antes** de (5)/(6): produce el `service_zone_id`.

### 2.5 Idempotencia

- `listShippingProfiles`, `listFulfillmentSets`, y `query.graph({ entity:"shipping_option" })` para no recrear.
- `link.create` repetido puede fallar/duplicar → comprobar existencia antes (⚠️ VALIDAR la query exacta del link, §9).

---

## 3. Backend — Pago PayPal (Payment Module v2)

### 3.1 Dependencias y módulo

- Instalar en el backend: `npm install @paypal/paypal-server-sdk` (no el deprecado `@paypal/checkout-server-sdk`). **Verificado: aún NO está en `medusa/node_modules`.**
- Estructura nueva: `medusa/src/modules/payment-paypal/{index.ts, service.ts}` (mismo patrón de carpeta que `product-review`).
- `provider_id` final: con `id: "paypal"` en config y `static identifier = "paypal"` → **`paypal_paypal`**; en región/admin aparece como **`pp_paypal_paypal`**. Webhook automático: `POST {server_url}/hooks/payment/paypal_paypal` (sin `pp_`, sin crear ruta manual).

### 3.2 `index.ts`

```ts
import PayPalPaymentProviderService from "./service"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [PayPalPaymentProviderService],
})
```

### 3.3 `service.ts` — esqueleto (firmas input/output v2)

> Todos los métodos son `async` con un único objeto `XInput → Promise<XOutput>` (v2, **no** la firma v1 `paymentSessionData, context`). Tipos de `@medusajs/framework/types`.

```ts
import {
  AbstractPaymentProvider, MedusaError, BigNumber, PaymentActions,
} from "@medusajs/framework/utils"
import type {
  Logger, PaymentSessionStatus,
  InitiatePaymentInput, InitiatePaymentOutput,
  AuthorizePaymentInput, AuthorizePaymentOutput,
  CapturePaymentInput, CapturePaymentOutput,
  CancelPaymentInput, CancelPaymentOutput,
  RefundPaymentInput, RefundPaymentOutput,
  DeletePaymentInput, DeletePaymentOutput,
  GetPaymentStatusInput, GetPaymentStatusOutput,
  RetrievePaymentInput, RetrievePaymentOutput,
  UpdatePaymentInput, UpdatePaymentOutput,
  ProviderWebhookPayload, WebhookActionResult,
} from "@medusajs/framework/types"
import {
  Client, Environment, OrdersController, PaymentsController,
  CheckoutPaymentIntent, OrderStatus, PatchOp,
} from "@paypal/paypal-server-sdk"

type Options = {
  client_id: string
  client_secret: string
  environment?: "sandbox" | "production"
  autoCapture?: boolean
  webhook_id?: string
}
type InjectedDependencies = { logger: Logger }

class PayPalPaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "paypal"
  protected logger_: Logger
  protected options_: Options
  protected client_: Client
  protected ordersController_: OrdersController
  protected paymentsController_: PaymentsController

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = { environment: "sandbox", autoCapture: false, ...options }
    this.client_ = new Client({
      environment: this.options_.environment === "production" ? Environment.Production : Environment.Sandbox,
      clientCredentialsAuthCredentials: {
        oAuthClientId: this.options_.client_id,
        oAuthClientSecret: this.options_.client_secret,
      },
    })
    this.ordersController_ = new OrdersController(this.client_)
    this.paymentsController_ = new PaymentsController(this.client_)
  }

  // createOrder → guarda order_id + approval_url; session_id viaja en custom_id
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> { /* ver investigación §B */ }
  // authorizeOrder (o captureOrder si autoCapture)
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> { /* ... */ }
  // captureAuthorizedPayment
  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> { /* ... */ }
  // voidPayment de la autorización
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> { /* ... */ }
  // refundCapturedPayment (new BigNumber(input.amount).numeric.toString())
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> { /* ... */ }
  // PayPal no tiene cancelOrder → no-op (las órdenes sin autorizar expiran solas)
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> { return { data: input.data } }
  // getOrder → mapea OrderStatus (Approved/Completed→authorized, Voided→canceled, resto→pending)
  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> { /* ... */ }
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> { /* getOrder */ }
  // patchOrder del monto (PatchOp.Replace)
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> { /* ... */ }

  // event_type → acción interna; session_id recuperado de resource.custom_id
  async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const { data } = payload
    const eventType = (data as any)?.event_type
    const resource = (data as any)?.resource
    const sessionId: string = resource?.custom_id ?? ""
    const amountValue =
      resource?.amount?.value ||
      resource?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ||
      resource?.purchase_units?.[0]?.payments?.authorizations?.[0]?.amount?.value || 0
    const out = { session_id: sessionId, amount: new BigNumber(amountValue) }
    switch (eventType) {
      case "PAYMENT.AUTHORIZATION.CREATED": return { action: PaymentActions.AUTHORIZED, data: out }
      case "PAYMENT.CAPTURE.COMPLETED":     return { action: PaymentActions.SUCCESSFUL, data: out } // = captured
      case "PAYMENT.CAPTURE.DENIED":        return { action: PaymentActions.FAILED, data: out }
      case "PAYMENT.AUTHORIZATION.VOIDED":  return { action: PaymentActions.CANCELED, data: out }
      default:                              return { action: PaymentActions.NOT_SUPPORTED, data: out }
    }
  }
}
export default PayPalPaymentProviderService
```

> Los cuerpos completos (createOrder/authorizeOrder/captureOrder/refund/patch/getOrder con sus campos exactos del SDK) están en la **investigación §B**; copiarlos verbatim al implementar. Mapeo PayPal Orders v2 ↔ métodos Medusa: ver investigación §B.4.

### 3.4 Registro EXACTO en `medusa-config.ts`

> El config actual solo tiene `modules: [{ resolve: "./src/modules/product-review" }]`. **Añadir** el Payment Module con el provider PayPal. Declarar el array `providers` **no** elimina el `system` default — pero verificar en Admin que `pp_system_default` sigue en la región tras el cambio.

```ts
module.exports = defineConfig({
  projectConfig: { /* ...sin cambios (databaseUrl, ssl, http)... */ },
  modules: [
    { resolve: "./src/modules/product-review" },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/payment-paypal",
            id: "paypal", // → provider_id = paypal_paypal (región: pp_paypal_paypal)
            options: {
              client_id: process.env.PAYPAL_CLIENT_ID!,
              client_secret: process.env.PAYPAL_CLIENT_SECRET!,
              environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
              autoCapture: process.env.PAYPAL_AUTO_CAPTURE === "true",
              webhook_id: process.env.PAYPAL_WEBHOOK_ID,
            },
          },
        ],
      },
    },
  ],
})
```

> ⚠️ **Redis (plan tarea 1.1):** para idempotencia de pago y persistencia de workflows, en producción registrar event-bus/workflow-engine/cache/locking con Redis. En dev se acepta in-memory. No bloquea el happy path local pero sí la fiabilidad del webhook/`complete` concurrentes.

### 3.5 Variables de entorno

**`medusa/.env` / `.env.template`** (las de PayPal **ya existen** en el template; añadir las que falten):
```
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_AUTO_CAPTURE=false        # añadir (lo lee la config; false → flujo authorize+capture)
#PAYPAL_WEBHOOK_ID=              # del dashboard sandbox, para verificar firmas
```
**`store/.env.example` / `.env`** (`NEXT_PUBLIC_PAYPAL_CLIENT_ID` **ya existe** en `.env.example`):
```
NEXT_PUBLIC_PAYPAL_CLIENT_ID=    # SOLO el client id (público); el secret jamás aquí
```

### 3.6 Habilitar PayPal en la región Honduras

Tras registrar el módulo: en Admin → región **Honduras** → payment providers → añadir `pp_paypal_paypal` junto a `pp_system_default`. Sin esto `listPaymentProviders({ region_id })` no lo devuelve. (Alternativa programática: ampliar `seed-timesmart.ts` o un seed nuevo que actualice `payment_providers` de la región.)

### 3.7 Webhook + subscriber order.placed

- **Webhook PayPal:** ruta automática `POST /hooks/payment/paypal_paypal` → invoca `getWebhookActionAndData`. **No** crear ruta manual. Verificación de firma con `PAYPAL_WEBHOOK_ID` (POST `/v1/notifications/verify-webhook-signature`, `verification_status === "SUCCESS"`) — ⚠️ cuerpo exacto del helper no citado verbatim (§9).
- **Subscriber `order.placed`** (plan tarea 1.11): nuevo `medusa/src/subscribers/order-placed.ts`, espejo de `customer-created.ts` existente; emite webhook neutral a `ORDER_PLACED_WEBHOOK_URL` (costura D4). No bloqueante para Fase 1.

---

## 4. Storefront

### 4.1 GOTCHA bloqueante de autenticación — `sdk.ts`

`store/src/lib/medusa/sdk.ts` **no** define `auth.type` → usa modo **session (cookies)** por defecto (verificado: `Config.auth.type?: "jwt" | "session"`). Como `/complete` y `/reviews` exigen `authenticate("customer", ["session","bearer"])` cross-origin, y el TRD §4.1 describe el MVP como **bearer client-side**, lo robusto es modo **jwt**:

```ts
import Medusa from '@medusajs/js-sdk'

export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000',
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  auth: { type: 'jwt' }, // el SDK persiste el JWT de auth.login y lo manda como Authorization: Bearer
})
```

> Con `jwt`, `auth.login` ya guarda el token y lo adjunta en todas las requests siguientes (incluido `complete`). El `/login`, `/registro` y `/cuenta` actuales ya usan `auth.login` esperando un `string` → seguirán funcionando, pero ahora con bearer en lugar de cookie. ⚠️ **VALIDAR** que `/cuenta` (que hace `customer.retrieve()` en un client component) sigue resolviendo tras el cambio; si se decidiera cookie httpOnly para RSC (TRD §4.3, decisión abierta), reconsiderar. Para Fase 1: **jwt**.

### 4.2 Helpers nuevos — `store/src/lib/medusa/checkout.ts` (nuevo)

Centraliza el flujo. Firmas propuestas (todas envuelven `medusa.store.*`):

```ts
import { medusa } from './sdk'

export type EtaContract = { eta_min_dias?: number; eta_max_dias?: number }

// Gate: true si hay customer autenticado
export async function getCustomerOrNull() {
  try { return (await medusa.store.customer.retrieve()).customer } catch { return null }
}

// Asocia el cart anónimo al customer logueado (email + transferCart)
export async function bindCartToCustomer(cartId: string, email: string) {
  await medusa.store.cart.update(cartId, { email })
  const { cart } = await medusa.store.cart.transferCart(cartId)
  return cart
}

export async function setAddress(cartId: string, address: StoreAddress, billing?: StoreAddress) {
  const { cart } = await medusa.store.cart.update(cartId, {
    shipping_address: address,
    billing_address: billing ?? address,
  })
  return cart
}

// Devuelve opciones con su tarifa y ETA (de shipping_option.data)
export async function listShipping(cartId: string) {
  const { shipping_options } = await medusa.store.fulfillment.listCartOptions({ cart_id: cartId })
  // para price_type === "calculated": medusa.store.fulfillment.calculate(o.id, { cart_id: cartId, data: {} })
  return shipping_options
}

export async function addShipping(cartId: string, optionId: string) {
  const { cart } = await medusa.store.cart.addShippingMethod(cartId, { option_id: optionId })
  return cart
}

// Inicia la sesión de pago y re-fetch del cart con la payment session
export async function initPayment(cart: StoreCart, providerId: string) {
  await medusa.store.payment.initiatePaymentSession(cart, { provider_id: providerId }) // arg1 = cart obj
  const { cart: updated } = await medusa.store.cart.retrieve(cart.id, {
    fields: '*payment_collection,*payment_collection.payment_sessions',
  })
  const session = updated.payment_collection?.payment_sessions?.[0]
  return { cart: updated, session }
}

export async function listPaymentProviders(regionId: string) {
  const { payment_providers } = await medusa.store.payment.listPaymentProviders({ region_id: regionId })
  return payment_providers // buscar el id que matchee /paypal/
}

// Completa; discrimina por type. Solo limpiar CART_KEY si type === "order".
export async function complete(cartId: string) {
  return medusa.store.cart.complete(cartId)
}
```

> `StoreAddress`/`StoreCart` desde `@medusajs/types` (`HttpTypes`). El `provider_id` de PayPal **no se hardcodea**: se obtiene de `listPaymentProviders` (`pp_paypal_paypal` esperado) y se ramifica la UI por `session.provider_id`.

### 4.3 Cálculo de ETA — `store/src/utilities/eta.ts` (nuevo)

Lee `shipping_option.data.{eta_min_dias,eta_max_dias}` (no `metadata`, §2.2). Calcula `hoy + N días hábiles` (excluye sáb/dom; feriados HN diferidos, TRD §6.2 Opción A) y formatea es-HN ("Llega entre el 2 y el 4 de julio"). Reutilizable por el checkout y, en Fase 2, por la PDP (RF-PDP-03).

### 4.4 Reescritura `store/src/app/(frontend)/checkout/page.tsx`

**Patrón: single-page con secciones** (más simple que multi-paso para ~26 SKU y un solo método de pago), client component (necesita JWT bearer y el SDK JS de PayPal). Secciones en orden, cada una habilitando la siguiente:

1. **Gate** (al montar): `getCustomerOrNull()`. Si `null` → `router.replace('/login?redirect=/checkout')`. Si el carrito está vacío → "No hay nada que pagar" (ya existe ese estado).
2. **Vinculación**: al confirmar email → `bindCartToCustomer(cartId, email)`. Prefill con `customer.email`.
3. **Dirección de envío** (HN): formulario con `first_name, last_name, address_1, address_2?, city, province?, postal_code, phone, country_code:"hn"` → `setAddress`.
4. **Envío + ETA**: `listShipping(cartId)` → radio buttons con **tarifa + ETA** (utilidad §4.3) por opción (Estándar / Retiro). Al elegir → `addShipping` → refrescar `cart.total`.
5. **Resumen**: subtotal, envío, total (HNL) desde `cart.*` server-side (`formatPrice`).
6. **Pago PayPal**: `initPayment(cart, providerId)` → render botones (§4.5). `onApprove` → `complete(cartId)`.
7. **Resultado**: `type==="order"` → limpiar `CART_KEY` (`smartime_medusa_cart_id`, `Cart/index.tsx:7`) + `router.push('/checkout/confirmacion?order=' + res.order.id)`. `type==="cart"` → mostrar `res.error`, carrito intacto, permitir reintento.

> **Ampliar FIELDS del cart.** El `FIELDS` actual (`Cart/index.tsx:8-9`) **no** incluye `region_id`, `shipping_address`, `shipping_methods` ni `payment_collection`. El checkout necesita `region_id` (para `listPaymentProviders`) y `payment_collection` (para la sesión). Opciones: (a) ampliar `FIELDS` global del provider, o (b) que el checkout haga `retrieve` con sus propios `fields`. **Recomendado (b)**: el checkout usa un `CHECKOUT_FIELDS` local para no inflar cada render del mini-cart.

### 4.5 Botones PayPal — `@paypal/react-paypal-js`

- Instalar en store: `npm install @paypal/react-paypal-js`. **Verificado: aún NO está en `store/node_modules`.**
- `<PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!, currency: '<moneda_liquidación>', intent: 'authorize' }}>` envolviendo `<PayPalButtons>`.
- ⚠️ **Patrón de integración con Medusa incierto (§9).** Hay dos modelos posibles según lo que devuelva `initiatePayment` en `session.data`:
  - **(A) `createOrder` delega en la PayPal order de Medusa:** los botones usan el `order_id` que ya creó el provider (`session.data.order_id`) en `createOrder={() => session.data.order_id}`; `onApprove` → `medusa.store.cart.complete(cartId)` (Medusa hace authorize+capture en el workflow de complete).
  - **(B) redirect a `approval_url`:** si se opta por el flujo de aprobación por redirección (`session.data.approval_url`), no se usan botones embebidos.
  - **Decisión de esta spec:** modelo **(A)** (botones embebidos, mejor UX, sin salir del sitio). **Validar** contra el comportamiento real del provider al implementar: confirmar que `complete` dispara `authorizePayment`/`capturePayment` y que no hace falta una llamada extra de authorize desde el front. (El TRD §3.c muestra un paso "authorize payment-session" explícito entre `onApprove` y `complete`; verificar si el SDK lo requiere o si `complete` lo cubre.)

### 4.6 Moneda de liquidación (R2 / TRD §5.4)

PayPal **no liquida en HNL**. **Opción A** (recomendada, TRD §5.4): UI muestra HNL; la payment session/PayPal opera en una moneda soportada (p. ej. USD) con **tasa transparente** visible en el resumen y registrada en `order.metadata.paypal_fx`. ⚠️ Define `HNL→<moneda>` como parámetro de negocio configurable. Esto afecta `currency` del `PayPalScriptProvider` y el `value` que el provider envía a `createOrder`. **Pendiente de negocio antes de cerrar Fase 1.** (§9.)

### 4.7 Página de confirmación — `store/src/app/(frontend)/checkout/confirmacion/page.tsx` (nuevo)

> El plan §1.10 usa `/checkout/confirmacion`. La tarea mencionaba alternativa `/pedido/[id]`. **Decisión: `/checkout/confirmacion`** (coincide con plan y flow §3.c). El nº de pedido llega por query (`?order=ord_...`).

- Client component: lee `?order`, `medusa.store.order.retrieve(orderId, { fields: '*items,*shipping_address,*shipping_methods,total,subtotal,currency_code,*metadata' })`.
- Muestra nº de pedido, total (HNL), ítems, dirección, método de envío y **ETA** (de `order.metadata.eta` si Fase 2 ya la congela; en Fase 1 puede derivarse del shipping method). Enlace a `/cuenta`.
- ⚠️ `order.retrieve` puede exigir customer autenticado → mantener la sesión (no limpiar el JWT al limpiar el carrito).

### 4.8 BuyNowButton (plan tarea 1.12)

`store/src/components/BuyNowButton/index.tsx`: hoy navega a checkout sin agregar. Conectar a `useCart().addItem(variantId)` y luego `router.push('/checkout')`.

---

## 5. Asociación carrito → cliente al iniciar sesión

**Regla (TRD §4.3, flow §3.c paso 2):** el carrito anónimo (`cart_id` en `localStorage`) debe quedar ligado al customer para que `complete` pase el guard y la orden tenga `customer_id`.

**Mecanismo correcto (verificado):** `medusa.store.cart.transferCart(cartId)` estando autenticado como el customer. **NO** setear `customer_id` a mano vía `cart.update`.

**Cuándo dispararlo:**
1. **En el checkout** (camino principal): tras el gate, antes de iniciar el pago, ejecutar `bindCartToCustomer(cartId, email)` (§4.2) — idempotente; si el cart ya es del customer, `transferCart` no hace daño.
2. **Opcional en login con `?redirect=/checkout`**: tras `auth.login`, si hay `CART_KEY` en localStorage, llamar `transferCart` de inmediato para que al volver a `/checkout` ya esté ligado. Mantiene el carrito conservado entre re-login y sesión expirada (errores E2).

> El `CartProvider` actual no conoce al customer. Para Fase 1 basta que el **checkout** haga la vinculación; no es obligatorio meter `transferCart` dentro del provider (plan §1.5 sugiere helpers en el provider, pero el checkout es suficiente y más localizado).

---

## 6. Pruebas E2E en sandbox

### 6.0 Pre-requisitos

1. Cuenta **sandbox de PayPal** (Business + Personal de prueba) con `PAYPAL_CLIENT_ID`/`SECRET` sandbox.
2. `npm install @paypal/paypal-server-sdk` (backend) y `@paypal/react-paypal-js` (store).
3. Backend: registrar módulo de pago (§3.4), correr `npx medusa exec ./src/scripts/seed-fulfillment-hn.ts`, habilitar `pp_paypal_paypal` en la región Honduras (§3.6).
4. Storefront: `auth.type: 'jwt'` (§4.1), `NEXT_PUBLIC_PAYPAL_CLIENT_ID` en `.env`.
5. Arrancar: backend `cd medusa && npm run dev` (`:9000`), store `cd store && npm run dev` (`:3000`).

### 6.1 Qué correr y qué esperar

| Caso | Pasos | Resultado esperado |
|---|---|---|
| **Seed envíos** | `npx medusa exec ./src/scripts/seed-fulfillment-hn.ts` (×2 para idempotencia) | 2 shipping options HN; reejecutar no duplica ni falla. |
| **Gate D1 (RF-CHK-01)** | Anónimo con carrito entra a `/checkout` | Redirige a `/login?redirect=/checkout`; tras login vuelve con carrito intacto. |
| **Guard backend (RF-CHK-03)** | `POST /store/carts/:id/complete` sin auth | **401**. Con bearer de customer válido → procesa. |
| **listCartOptions** | Con `country_code:"hn"` y dirección | Devuelve "Envío estándar" (L 150) y "Retiro" (L 0) con `data.eta_*`. |
| **Provider PayPal** | `listPaymentProviders({ region_id })` | Incluye `pp_paypal_paypal` (y `pp_system_default`). |
| **Happy path (RF-PAY-01)** | Elegir envío → iniciar pago → aprobar en sandbox → `complete` | `type:"order"`; `/checkout/confirmacion` con nº; `order.customer_id` seteado; **sin** cargo extra de "verificación". |
| **Fallo/cancelación (RF-PAY-01)** | Cancelar en el popup de PayPal | No se llama `complete`; carrito intacto; mensaje claro; reintento posible. |
| **`complete` type=cart** | Forzar `complete` antes de aprobar | `type:"cart"` con `res.error`; **no** se limpia `CART_KEY`. |
| **Idempotencia** | Doble clic / doble webhook | Un solo pedido pagado (Redis/locking ayuda). |
| **Webhook** | Disparar `PAYMENT.CAPTURE.COMPLETED` desde el simulador de PayPal a `/hooks/payment/paypal_paypal` | `getWebhookActionAndData` mapea por `custom_id`; reconcilia sin crear pedido. |

### 6.2 Automatización (TRD §13)

- **Playwright** (`store`): gate D1, happy path PayPal sandbox, fallo de pago.
- **Jest integración** (`medusa`): guard de `complete` (401 anónimo / OK autenticado).

---

## 7. Checklist final de archivos y orden de implementación

### 7.1 Archivos a crear/editar (rutas reales)

**Backend (`medusa/`):**
- ✏️ `medusa/package.json` — añadir dependencia `@paypal/paypal-server-sdk`.
- ➕ `medusa/src/modules/payment-paypal/index.ts` — `ModuleProvider(Modules.PAYMENT, {...})`.
- ➕ `medusa/src/modules/payment-paypal/service.ts` — clase `AbstractPaymentProvider` (PayPal Orders v2).
- ✏️ `medusa/medusa-config.ts` — registrar `@medusajs/medusa/payment` con provider PayPal (y, prod, Redis).
- ➕ `medusa/src/scripts/seed-fulfillment-hn.ts` — fulfillment HN (envío estándar + retiro, ETA en `data`).
- ➕ `medusa/src/subscribers/order-placed.ts` — webhook neutral `order.placed` (espejo de `customer-created.ts`).
- ✏️ `medusa/.env` y `medusa/.env.template` — `PAYPAL_AUTO_CAPTURE`, confirmar `PAYPAL_CLIENT_ID/SECRET/ENVIRONMENT/WEBHOOK_ID` (ya presentes).
- ✅ `medusa/src/api/middlewares.ts` — **no tocar**; verificar que el guard de `complete` sigue vigente.

**Storefront (`store/`):**
- ✏️ `store/package.json` — añadir `@paypal/react-paypal-js`.
- ✏️ `store/src/lib/medusa/sdk.ts` — `auth: { type: 'jwt' }`.
- ➕ `store/src/lib/medusa/checkout.ts` — helpers (`getCustomerOrNull`, `bindCartToCustomer`, `setAddress`, `listShipping`, `addShipping`, `initPayment`, `listPaymentProviders`, `complete`).
- ➕ `store/src/utilities/eta.ts` — cálculo + formato es-HN de ETA desde `shipping_option.data`.
- ✏️ `store/src/app/(frontend)/checkout/page.tsx` — reescritura (gate → dirección → envío+ETA → pago PayPal → resultado).
- ➕ `store/src/components/checkout/PayPalCheckout.tsx` — wrapper de `@paypal/react-paypal-js` (botones + `onApprove`).
- ➕ `store/src/app/(frontend)/checkout/confirmacion/page.tsx` — confirmación (nº pedido + ETA).
- ✏️ `store/src/components/BuyNowButton/index.tsx` — agregar variante + navegar a checkout.
- ✏️ `store/src/providers/Cart/index.tsx` — (opcional) ampliar `FIELDS` o dejar que el checkout use `CHECKOUT_FIELDS` local; exponer `cart.id` para el flujo.
- ✏️ `store/.env.example` y `store/.env` — confirmar `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (ya en `.env.example`).
- ✅ `store/src/environment.d.ts` — añadir tipos de `NEXT_PUBLIC_PAYPAL_CLIENT_ID` si no están.

### 7.2 Orden de implementación recomendado

1. **Backend pago primero (desbloquea todo):** instalar SDK → `payment-paypal/{index,service}.ts` → registrar en `medusa-config.ts` → variables `.env` → habilitar `pp_paypal_paypal` en región Honduras → smoke test `listPaymentProviders`.
2. **Backend envíos:** `seed-fulfillment-hn.ts` → ejecutar (×2 idempotencia) → verificar `listCartOptions`.
3. **Storefront base:** `sdk.ts` → `checkout.ts` → `eta.ts`.
4. **Checkout UI:** reescritura de `checkout/page.tsx` (gate + dirección + envío) sin pago aún → verificar hasta el resumen.
5. **PayPal UI:** `PayPalCheckout.tsx` + cableado `initPayment`/`onApprove`/`complete`.
6. **Confirmación:** `checkout/confirmacion/page.tsx`.
7. **Costura:** `subscribers/order-placed.ts`, `BuyNowButton`.
8. **Pruebas E2E** (§6) + Playwright/Jest.

---

## 8. Cruces con otros documentos

| Tema | Este doc | Cruza con |
|---|---|---|
| Guard de `complete` (D1) | §1.1, §6.1 | `02-TRD.md` §3.5; `04-app-flow.md` §3.c paso 1 |
| Auth bearer/jwt | §4.1 | `02-TRD.md` §4.1/§4.2 |
| Vinculación cart↔cliente | §5 | `02-TRD.md` §4.3; `04-app-flow.md` §3.c paso 2 |
| Arquitectura PayPal | §3 | `02-TRD.md` §5.1/§5.2; `04-app-flow.md` §3.c (secuencia) |
| Moneda de liquidación (R2) | §4.6 | `02-TRD.md` §5.4; `06-implementation-plan.md` §1.3 |
| Fulfillment HN + ETA | §2 | `02-TRD.md` §6.1/§6.2; `06-implementation-plan.md` Fase 2 (2.1–2.8) |
| Confirmación + ETA congelada | §4.7 | `04-app-flow.md` §3.c paso 8; §3.d (`/cuenta`, Fase 3) |
| Webhook + subscriber | §3.7 | `02-TRD.md` §10.2/§10.3; `06-implementation-plan.md` §1.9/§1.11 |

---

## 9. INCERTIDUMBRES — validar contra código al implementar

> Lista priorizada. Cada ítem debe resolverse leyendo `.d.ts` / probando en sandbox antes de dar la tarea por cerrada.

1. **🔴 ETA en `data` vs `metadata` (divergencia con TRD).** La investigación verificó que `metadata` NO es escribible en shipping options 2.17; esta spec usa `data`. **Acción:** confirmar leyendo `CreateShippingOptionsWorkflowInput` en los `.d.ts` instalados de `@medusajs/types`; actualizar TRD §6.2 y plan §2.5/§2.8 al contrato `data`.
2. **🔴 Patrón PayPal front (botones vs redirect).** §4.5: confirmar qué devuelve `initiatePayment` en `session.data` (¿`order_id`? ¿`approval_url`?) y si `complete` dispara authorize+capture o si hace falta un authorize explícito desde el front (TRD §3.c muestra ese paso). Probar en sandbox.
3. **🔴 `provider_id` real de PayPal.** Esperado `pp_paypal_paypal`, pero NO hardcodear: obtener de `listPaymentProviders({ region_id })` y ramificar la UI por `session.provider_id`.
4. **🟠 Moneda de liquidación (R2).** §4.6: PayPal no liquida HNL. Falta decisión de negocio sobre `HNL→<moneda>` y la tasa. Afecta `currency` del script provider y el `value` enviado a PayPal.
5. **🟠 Verificación de firma del webhook.** §3.7: el helper exacto (`/v1/notifications/verify-webhook-signature`) no está citado verbatim; implementar y probar con el simulador de PayPal.
6. **🟠 Comprobación de existencia de `link.create`.** §2.5: la query `query.graph` exacta para detectar links ya creados (provider y set) sobre la stock_location no se verificó; `link.create` repetido puede duplicar/fallar.
7. **🟡 Reuso de stock_location.** El seed usa la stock_location del demo ("European Warehouse"). Para HN limpio quizá convenga crear "Tienda Tegucigalpa"/"Tienda SPS" (plan §2.1); para Fase 1 basta reusar la existente.
8. **🟡 Firmas opcionales `query`/`headers`** de cada método del SDK: las posiciones se verificaron para `complete`, `transferCart`, `addShippingMethod`, `listCartOptions`, `initiatePaymentSession`; el resto se asume del patrón común. Revisar `store/node_modules/@medusajs/js-sdk/dist/esm/store/index.d.ts` ante cualquier error TS.
9. **🟡 `order.retrieve` autenticado.** §4.7: confirmar si la confirmación necesita sesión activa; no limpiar el JWT al vaciar el carrito.
10. **🟡 Impacto del modo `jwt` en `/cuenta`.** §4.1: verificar que `customer.retrieve()` en client components sigue OK tras el cambio; valorar cookie httpOnly post-MVP (TRD §4.3, decisión abierta).
11. **🟢 Redis en dev.** §3.4: in-memory acepta el happy path local; idempotencia concurrente y persistencia de workflows requieren Redis en prod (plan §1.1).
```