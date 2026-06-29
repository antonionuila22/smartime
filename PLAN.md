# Plan de Arquitectura — Tienda Online (Next.js + Payload CMS 3 + Supabase + PayPal)

> Mercado: España (EUR) · Stack confirmado: Next.js · Payload CMS 3 · Supabase (Postgres + Storage) · PayPal
> Alcance de HOY: planificación, arquitectura, scaffold del proyecto, Payload configurado y conectado a Supabase con tipos generados. El checkout completo con PayPal es una sesión posterior.

---

## 1. Resumen ejecutivo

Construiremos una **única aplicación Next.js (App Router)** que aloja a la vez el escaparate (storefront) y el panel de administración de **Payload CMS 3**: no hay dos servidores, Payload corre dentro del mismo proceso de Next bajo un route group `(payload)` que expone `/admin` y `/api`. **Supabase** se usa exclusivamente como **Postgres gestionado** (vía `@payloadcms/db-postgres`) y como **almacenamiento de archivos** S3-compatible (vía `@payloadcms/storage-s3`); **no usamos Supabase Auth** — la autenticación de personal y de clientes la posee Payload (un único sistema de identidad, sin sincronización frágil). El catálogo soporta productos **físicos** (envío, inventario, variantes) y **digitales** (archivos descargables protegidos por control de acceso) mediante un campo `type` y campos condicionales en una sola colección de productos. El contenido (banners, secciones, componentes reutilizables, páginas) se gestiona desde el CMS con un **constructor de bloques (blocks/layout builder)**, de modo que el usuario añade Hero, secciones y productos destacados sin tocar código. **PayPal** se integra como adaptador de pago a medida (no viene de fábrica) con el precio recalculado siempre en el servidor. Es la combinación mejor soportada, más cohesionada y de menor fricción para este caso.

---

## 2. Matriz de versiones (a fijar)

| Paquete / Runtime | Versión a fijar | Notas |
|---|---|---|
| **Node.js** | **20.x LTS** (`>=20.9.0`) | Las plantillas de Payload apuntan a Node 20+. |
| **pnpm** | última estable | Gestor de paquetes preferido por Payload. |
| **Next.js** | **`>=16.2.6 <17`** (p. ej. 16.2.9 LTS) | **CRÍTICO**: Next 15.5.x a 16.2.5 (incluidos 16.0/16.1) **NO** están soportados por Payload. Alternativa válida: `>=15.4.11 <15.5.0`. |
| **React / React DOM** | **19** | Requerido por Payload 3, Next 16 y el plugin de ecommerce. |
| **payload** | **3.85.1** | Última estable. TS 6 solo estable desde 3.85.1. NO usar Payload 4 (beta/canary). |
| **@payloadcms/next** | **3.85.1** | Misma versión que el core. Define el rango de Next soportado. |
| **@payloadcms/ui** | **3.85.1** | Lock al core. |
| **@payloadcms/db-postgres** | **3.85.1** | Basado en Drizzle + `pg`. Lock al core. |
| **@payloadcms/richtext-lexical** | **3.85.1** | Editor de texto enriquecido. Lock al core. |
| **@payloadcms/storage-s3** | **3.85.1** | Para Supabase Storage (S3-compatible). Lock al core. |
| **@payloadcms/plugin-ecommerce** | **3.85.1** | **EN BETA**. Peer `payload@3.85.1` exacto. Adaptador oficial solo Stripe (PayPal a medida). |
| **create-payload-app** | **3.85.1** | Para el scaffold. |
| **graphql** | `^16.8.1` | Peer dependency. |
| **@paypal/paypal-server-sdk** | **2.4.0** | SDK servidor MODERNO (correcto). |
| **@paypal/react-paypal-js** | **10.x** (10.1.0) | Botones PayPal en cliente. |
| **stripe** (opcional) | `>=18.5.0` | Solo si se activa el adaptador Stripe de referencia. |
| **@payloadcms/db-vercel-postgres** | 3.85.1 | *Alternativa* solo si se despliega en Vercel. |

> ⚠️ **NO usar** `@paypal/checkout-server-sdk` (DEPRECADO, congelado en 1.0.3). Todos los paquetes `@payloadcms/*` deben ir **exactamente** en la misma versión que `payload` al actualizar.
>
> ⚠️ **Verificar al instalar**: el plugin de ecommerce está en BETA — confirmar los nombres de export reales (`ecommercePlugin`, helpers de colección) contra la versión instalada antes de copiar snippets; algunos docs comunitarios muestran un nombre de import distinto (`payload-plugin-ecommerce`).

---

## 3. Arquitectura

### 3.1 Diagrama (texto)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    UNA SOLA APP NEXT.JS (App Router)                    │
│                         Node 20 · React 19                             │
│                                                                        │
│   app/(frontend)  ──────────────┐         app/(payload)               │
│   Storefront (RSC)              │         ├─ /admin  (panel staff)     │
│   - Home, catálogo, producto    │         ├─ /api    (REST Payload)    │
│   - Páginas CMS (bloques)       │         └─ /graphql                  │
│   - Carrito, cuenta, checkout   │                                      │
│        │                        │              │                       │
│        │  Local API             │              │ Local API             │
│        ▼  getPayload({config})  ▼              ▼ (mismo proceso)        │
│   ┌────────────────────────────────────────────────────────────┐      │
│   │                    PAYLOAD CORE 3.85.1                       │      │
│   │  Colecciones · Hooks · Access Control · Auth (JWT cookie)    │      │
│   │  plugin-ecommerce (productos/variantes/carrito/orders)      │      │
│   └────────────────────────────────────────────────────────────┘      │
│        │ Drizzle/pg                  │ S3 SDK            │ HTTP         │
└────────┼─────────────────────────────┼───────────────────┼────────────┘
         ▼                              ▼                   ▼
  ┌──────────────┐            ┌──────────────────┐   ┌──────────────┐
  │  SUPABASE     │            │ SUPABASE STORAGE │   │   PAYPAL      │
  │  Postgres     │            │ (S3-compatible)  │   │  Orders v2    │
  │  - Session    │            │ bucket 'media'   │   │  + Webhooks   │
  │    pooler:5432│            │   (público)      │   │  (EUR)        │
  │  - Direct/    │            │ bucket 'downloads'│  └──────────────┘
  │    migrations │            │   (privado)      │
  └──────────────┘            └──────────────────┘
```

### 3.2 Cómo encaja todo

- **Un solo proyecto, un solo proceso.** Payload v3 NO es un backend separado (eso era v1/v2). Vive dentro de Next bajo `app/(payload)/`. El escaparate y el admin comparten runtime, lo que permite usar la **Local API** sin saltos HTTP.
- **Supabase = Postgres + Storage, nada más.** Esta es exactamente la arquitectura de la guía oficial "Payload + Supabase for Next.js".

### 3.3 Decisión de autenticación (un solo sistema)

**Payload posee la identidad.** Definimos **dos colecciones auth separadas**:
- `users` (staff): `auth: true` + campo `roles` (`saveToJWT`). Solo este collection puede entrar a `/admin` (`admin: { user: 'users' }`).
- `customers` (clientes del escaparate): `auth: { verify: true, maxLoginAttempts, lockTime, cookies: { secure, sameSite: 'Lax' } }`. Pueden autenticarse en el storefront pero quedan bloqueados de `/admin`.

**Justificación:** correr Supabase Auth + Payload Auth a la vez significa dos almacenes de identidad, dos cookies/JWT y una capa de sincronización que se desincroniza. Payload ya aporta auth + control de acceso + admin, así que es el dueño natural. Solo se justificaría Supabase Auth si necesitáramos su catálogo amplio de OAuth/OTP — no es el caso. La cookie JWT es httpOnly y la pone Payload automáticamente.

### 3.4 Obtención de datos: Local API vs REST

- **Server Components (escaparate):** usar **Local API** — `const payload = await getPayload({ config }); payload.find(...)`. Cero salto HTTP, es la best practice documentada para RSC.
- **Identidad del usuario en RSC / route handlers:** `await payload.auth({ headers })`.
- **REST/GraphQL (`/api`):** reservado para llamadas desde componentes cliente y consumidores externos (la Local API es server-only, jamás importar en el cliente).

### 3.5 Caché y revalidación

- Envolver lecturas de catálogo/contenido con `unstable_cache` (o Cache Components según el minor exacto de Next 16) con tags estables: `products`, `product:${slug}`, `pages`, `page:${slug}`.
- **Invalidar** desde hooks `afterChange`/`afterDelete` de Payload llamando `revalidateTag`/`revalidatePath`, **siempre con guarda** (`if (!context.disableRevalidate)`) para evitar bucles durante seed/migraciones.
- **NO cachear** datos por-cliente (carrito, pedidos, cuenta) con tags compartidos — fuga de datos entre usuarios. Marcarlos como dinámicos.
- **Preview de borradores:** Next draft mode + `payload.auth()` gateado por `PREVIEW_SECRET` y usuario staff.

---

## 4. Modelo de datos (colecciones Payload)

Estrategia: usar el **plugin oficial de ecommerce** para el núcleo (Products, Variants, VariantTypes, VariantOptions, Carts, Orders, Transactions, Addresses; reutiliza `customers` como clientes; multi-moneda con campos `priceIn<CUR>` autogenerados; inventario opcional) y **extender** con campos a medida para físico/digital y para el contenido CMS.

### 4.1 Comercio (núcleo + extensiones)

**`products`** (colección única, con override del plugin)
- Del plugin: título, slug, `priceInEUR` (autogenerado por multi-moneda), relación a variantes, inventario opcional.
- **A medida**:
  - `type`: `select` requerido — `physical` | `digital` (defaultValue `physical`).
  - `categories`: relación a `categories` (hasMany).
  - `gallery`: relación a `media` (hasMany) — imágenes públicas.
  - `description`: richtext (Lexical).
  - **Si `digital`** (`admin.condition: d => d?.type === 'digital'`): `downloadableFiles` → relación a `downloads` (privado, hasMany). **Desactivar/ignorar validación de inventario** para que nunca esté "out of stock".
  - **Si `physical`**: grupo `shipping` → `requiresShipping` (checkbox), `weightGrams`, `length`, `width`, `height`; inventario con `trackByVariant` cuando hay variantes (talla/color), `lowStockThreshold`.

**`variants` / `variantTypes` / `variantOptions`** (del plugin) — talla, color, etc., con stock por variante.

**`categories`**
- `name`, `slug`, `parent` (relación a sí misma para jerarquía), `description`, `image` (relación a `media`).

**`customers`** (auth) — ver §3.3. Campos: `name`, direcciones (relación a `addresses` del plugin).

**`carts`** (del plugin) — en BD para invitados y autenticados. **Planificar limpieza/expiración de carritos de invitado.**

**`orders`** (del plugin + extensiones)
- Cabecera: `customer` (relación), `status` (`pending`|`paid`|`fulfilled`|`cancelled`), `currency` ('EUR'), `amount` (en céntimos, entero), `paypalOrderId`, **`captureId` con índice único** (idempotencia anti-doble-fulfillment).
- **Line items** (array): `product` (relación), `variant` (relación opcional), `quantity`, `unitPriceCents`, y `file` (relación a `downloads`) cuando el ítem es digital — usado por el control de acceso de descargas.

**`transactions`** (del plugin) — registro de intentos/capturas de pago; el adaptador PayPal guarda aquí los ids de order/capture.

**`addresses`** (del plugin) — direcciones de envío/facturación de clientes.

### 4.2 Archivos / Uploads (DOS colecciones, DOS buckets)

**`media`** (PÚBLICO — imágenes de producto y contenido)
- `upload: true`, `mimeTypes: ['image/*']`, `imageSizes` (thumbnail 400×300, card 768×1024, og 1200×630), `access.read: () => true`.
- En el plugin S3: `disablePayloadAccessControl: true` → URLs directas a la CDN de Supabase (rápido, cacheable).

**`downloads`** (PRIVADO — archivos digitales comprados)
- `upload: { disableLocalStorage: true }`, `access.read = hasPurchased` (solo admins o clientes con un Order `paid` que contenga ese archivo).
- En el plugin S3: **NO** poner `disablePayloadAccessControl`; activar `signedDownloads: true` (Payload comprueba acceso y luego hace 302 a URL prefirmada de corta duración).
- Entrega: enlazar a la ruta proxy `/api/downloads/file/<filename>` (corre `access.read` antes de servir).

### 4.3 Contenido / personalización (constructor de bloques)

La clave de "banners, secciones, componentes reutilizables desde el CMS" es un **layout builder por bloques**: una colección `pages` con un campo `layout` de tipo `blocks`, donde cada bloque es un componente reutilizable que el usuario añade/reordena visualmente en el admin. El escaparate mapea cada bloque a un componente React.

**`pages`** (colección de contenido)
- `title`, `slug`, `status` (draft/published), `seo` (group: metaTitle, metaDescription, ogImage).
- **`layout`**: `blocks` con, como mínimo:
  - `HeroBlock` / `BannerBlock`: imagen/vídeo, titular, subtítulo, CTA (texto + enlace), variante de estilo.
  - `SectionBlock`: encabezado + richtext + columnas/medios.
  - `FeaturedProductsBlock`: relación a `products` (hasMany) o filtro por categoría + nº de items.
  - `CategoryGridBlock`: relación a `categories`.
  - `RichTextBlock`, `CTABlock`, `LogosBlock`, `TestimonialsBlock`, `FAQBlock`, `MediaBlock`.
- Hook `afterChange` → `revalidateTag('pages')` / `revalidateTag('page:'+slug)` (con guarda).

**`services`** (colección — productos NO, servicios)
- `title`, `slug`, `description` (richtext), `priceFromEUR`, `image`, `features` (array), `category`, `seo`, opcional `layout` (blocks) para páginas de servicio ricas.

**Globals** (singletons de configuración del sitio)
- `Header`: logo, navegación (array de enlaces / mega-menú), CTA.
- `Footer`: columnas de enlaces, redes sociales, texto legal.
- `SiteSettings`: nombre, colores/tema de marca, datos de contacto, moneda por defecto, banners globales (p. ej. barra de aviso superior).

> **Enfoque de bloques explicado:** cada bloque tiene un `blockType` único y sus propios `fields`. En el admin, el editor ve un selector "Add Block" y arrastra/reordena. En el frontend, un componente `<RenderBlocks blocks={page.layout} />` recorre el array y renderiza el componente React correspondiente a cada `blockType`. Así el usuario compone banners y secciones sin tocar código, y los bloques son **reutilizables** en cualquier página o servicio.

---

## 5. Estructura de carpetas

```
store/
├─ src/
│  ├─ app/
│  │  ├─ (frontend)/                 # Escaparate (público)
│  │  │  ├─ layout.tsx               # Header/Footer desde globals
│  │  │  ├─ page.tsx                 # Home (renderiza bloques de 'pages')
│  │  │  ├─ [slug]/page.tsx          # Páginas CMS dinámicas (blocks)
│  │  │  ├─ productos/
│  │  │  │  ├─ page.tsx              # Catálogo / listado
│  │  │  │  └─ [slug]/page.tsx       # Ficha de producto
│  │  │  ├─ servicios/[slug]/page.tsx
│  │  │  ├─ carrito/page.tsx
│  │  │  ├─ checkout/
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ Buttons.tsx           # 'use client' PayPalButtons
│  │  │  └─ cuenta/                  # login / registro / pedidos / descargas
│  │  ├─ (payload)/                  # Generado por Payload
│  │  │  ├─ admin/[[...segments]]/page.tsx
│  │  │  ├─ admin/importMap.js
│  │  │  ├─ api/[...slug]/route.ts
│  │  │  ├─ graphql/route.ts
│  │  │  ├─ graphql-playground/route.ts
│  │  │  ├─ custom.scss
│  │  │  └─ layout.tsx
│  │  └─ api/                        # Route handlers propios
│  │     ├─ paypal/
│  │     │  ├─ create-order/route.ts
│  │     │  ├─ capture-order/route.ts
│  │     │  └─ webhook/route.ts      # body RAW para verificar firma
│  │     └─ preview/route.ts         # draft mode (staff)
│  ├─ collections/
│  │  ├─ Users.ts        Customers.ts
│  │  ├─ Products.ts     Categories.ts   Services.ts
│  │  ├─ Media.ts        Downloads.ts
│  │  └─ Orders.ts       (Carts/Variants/etc. vía plugin)
│  ├─ blocks/                        # Definiciones de bloques + componentes
│  │  ├─ Hero.ts         FeaturedProducts.ts   Section.ts ...
│  │  └─ RenderBlocks.tsx
│  ├─ globals/           Header.ts   Footer.ts   SiteSettings.ts
│  ├─ access/            isAdmin.ts  isCustomer.ts  hasPurchased.ts ...
│  ├─ hooks/             revalidate.ts
│  ├─ payments/          paypalAdapter.ts        # adaptador a medida (fase checkout)
│  ├─ lib/               paypal.ts (cliente SDK)  payload.ts
│  └─ payload.config.ts
├─ migrations/                       # SQL versionado (staging/prod)
├─ payload-types.ts                  # autogenerado (importar como '@/payload-types')
├─ next.config.ts                    # withPayload(...)
├─ .env  /  .env.example
├─ tsconfig.json   package.json   pnpm-lock.yaml
```

---

## 6. Variables de entorno

```bash
# ---------- Payload ----------
PAYLOAD_SECRET=<cadena-aleatoria-larga>            # firma de tokens/cookies (server-only)
PAYLOAD_CONFIG_PATH=src/payload.config.ts          # para que la CLI encuentre el config bajo /src

# ---------- Supabase Postgres ----------
# App runtime: SESSION pooler (IPv4, soporta prepared statements) para servidor persistente.
# Usuario en pooler = postgres.<project-ref> (NO 'postgres' a secas). URL-encode la contraseña.
DATABASE_URI=postgres://postgres.<ref>:<pass>@aws-<region>.pooler.supabase.com:5432/postgres
# Migraciones/DDL: SESSION pooler :5432 o conexión directa. NUNCA el transaction pooler :6543.
DATABASE_URI_DIRECT=postgres://postgres.<ref>:<pass>@aws-<region>.pooler.supabase.com:5432/postgres
# (Serverless/Vercel alternativo) runtime con TRANSACTION pooler :6543, pool max pequeño:
# DATABASE_URI=postgres://postgres.<ref>:<pass>@aws-<region>.pooler.supabase.com:6543/postgres

# ---------- Supabase Storage (S3-compatible) ----------
S3_ENDPOINT=https://<ref>.storage.supabase.co/storage/v1/s3   # SIN el bucket en la URL
S3_REGION=<region-del-proyecto>                    # p. ej. eu-central-1 ('local' con CLI)
S3_ACCESS_KEY_ID=<access-key>                       # Dashboard > Storage > S3 Connection (server-only)
S3_SECRET_ACCESS_KEY=<secret-key>                   # server-only; BYPASEA RLS, nunca al navegador
S3_MEDIA_BUCKET=media                               # bucket público
S3_DOWNLOADS_BUCKET=downloads                       # bucket privado

# ---------- PayPal (fase checkout — sandbox primero) ----------
PAYPAL_ENVIRONMENT=sandbox                          # 'production' para producción
PAYPAL_CLIENT_ID=<sandbox-client-id>               # server
PAYPAL_CLIENT_SECRET=<sandbox-secret>              # server, NUNCA NEXT_PUBLIC
PAYPAL_WEBHOOK_ID=<webhook-id>                      # del webhook del dashboard (¡por entorno!)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<sandbox-client-id>   # mismo client id, expuesto al SDK del navegador

# ---------- Next / preview ----------
PREVIEW_SECRET=<cadena-aleatoria>                   # gateo de draft mode para staff
```

> **Separación clave:** `NEXT_PUBLIC_*` se expone al navegador (correcto solo para el client id de PayPal). El secret y el webhook id de PayPal, y las claves S3, jamás llevan prefijo `NEXT_PUBLIC_`. Sandbox y Live tienen **distinto** client id/secret **y distinto webhook id**.

---

## 7. Decisiones clave y riesgos

1. **Pooler de Supabase y migraciones (trampa principal).**
   - App runtime → **Session pooler :5432** (IPv4, soporta prepared statements) en servidor persistente; o **Transaction pooler :6543** solo en serverless/edge (con `pool.max` pequeño, 1–2).
   - **Migraciones/DDL/`push` → NUNCA :6543.** El transaction pooler reasigna conexión por sentencia → errores `prepared statement "sN" does not exist/already exists`. Usar :5432 o conexión directa.
   - `pgbouncer=true` en la URL es flag **solo de Prisma**; no hace nada para pg/Drizzle.

2. **IPv4 vs IPv6.** La conexión directa `db.<ref>.supabase.co:5432` es **IPv6-only** salvo add-on IPv4 de pago → falla desde Vercel/CI/redes IPv4 (`ENETUNREACH`). Usar siempre el host **pooler** `aws-<region>.pooler.supabase.com` (IPv4 en todos los planes).

3. **`push` vs migraciones.** `push: true` (default de Drizzle) **solo** en el sandbox de desarrollo y **nunca apuntando a producción** (puede alterar/borrar tablas). En staging/prod: `push: false` + `migrationDir`, y solo migraciones revisadas mutan el esquema. No mezclar ambos modos en la misma BD.

4. **Descargas digitales protegidas.** Las claves S3 de Supabase **bypasean RLS** (acceso total a todos los buckets) → son secretos de servidor. La protección **debe** venir del control de acceso de Payload, no del bucket. **Jamás** poner `disablePayloadAccessControl: true` en `downloads` (eso saltaría `access.read` y cualquiera con la URL bajaría el archivo). Servir vía `/api/downloads/file/<filename>` + `signedDownloads` (TTL corto). Conocida regresión `payload#15382`: verificar tras upgrades que la URL pública se resuelve bien.

5. **Nunca confiar en precios del cliente.** El navegador solo envía `{ productId, qty }[]`. El servidor recalcula el total desde `priceInEUR` de Payload (Local API) antes de crear el pedido PayPal. Es el control de seguridad más importante.

6. **Idempotencia de pagos.** `PayPal-Request-Id` en `ordersCreate`; índice único en `captureId` en `orders`; tratar `PAYMENT.CAPTURE.COMPLETED` como la fuente de verdad de fulfillment. Webhook con **body RAW** (`await req.text()` antes de `JSON.parse`) para que la firma/CRC32 sea válida.

7. **Dinero como enteros (céntimos).** Calcular en céntimos en el servidor y formatear a string de 2 decimales (`'19.90'`) solo en el límite de PayPal, para evitar errores de redondeo en EUR.

8. **PayPal no viene de fábrica.** Solo Stripe tiene adaptador oficial. PayPal = adaptador `PaymentAdapter` a medida (`initiatePayment`, `confirmOrder`, endpoints de webhook). SDK servidor moderno `@paypal/paypal-server-sdk@2.x` (NO el deprecado `@paypal/checkout-server-sdk`).

9. **Versión de Next bloqueada.** Mantener Next en el rango soportado (`>=16.2.6 <17` o `>=15.4.11 <15.5.0`). No adelantar Next ni adoptar Payload 4 beta en producción. Todos los `@payloadcms/*` en la misma versión que el core.

10. **Plugin ecommerce en BETA.** Posibles cambios disruptivos; aislar la lógica de pago tras una frontera de adaptador y fijar plugin + core a versiones coincidentes, probando upgrades juntos.

11. **Tipos sincronizados.** `payload generate:types` y `payload generate:importmap` en CI, fallando si el git diff queda sucio (evita drift de `payload-types.ts` / `importMap.js`).

12. **Sin shipping/impuestos/suscripciones nativos.** El plugin no calcula tarifas de envío, impuestos ni suscripciones — se modelan con campos/hooks propios si se necesitan más adelante.

---

## 8. Plan de acción por fases

### ✅ Fase 0 — HOY (scaffold + Payload + Supabase + tipos)
**Objetivo: proyecto arrancando, admin accesible, conectado a Supabase, tipos generados.**
1. Verificar **Node 20** y **pnpm**.
2. Scaffold: `pnpm create payload-app store -t blank --use-pnpm` (o `-t ecommerce` para arrancar con las colecciones de comercio). Elegir **Postgres** (`@payloadcms/db-postgres`) en el prompt.
3. Crear el proyecto Supabase y copiar las connection strings (ver §9). Rellenar `.env`: `PAYLOAD_SECRET`, `DATABASE_URI` (session pooler :5432), `DATABASE_URI_DIRECT`.
4. Configurar `postgresAdapter` en `payload.config.ts` con `push: NODE_ENV==='development'` y `migrationDir: './migrations'`.
5. `pnpm dev` → entrar en `http://localhost:3000/admin` y crear el primer usuario admin.
6. Definir colecciones base: `Users`, `Customers`, `Media`, `Categories`, `Products` (con campo `type` físico/digital), `Downloads`. Definir `admin: { user: 'users' }`.
7. `pnpm payload generate:types` → confirmar `payload-types.ts` e import `@/payload-types`.
8. (Si hay tiempo) instalar y registrar `@payloadcms/storage-s3` con los dos buckets, y `@payloadcms/plugin-ecommerce` (multi-moneda EUR, inventario).

> **Resultado de hoy:** admin funcionando contra Supabase, modelo de datos inicial creado, tipos generados. **Sin checkout aún.**

### Fase 1 — Catálogo y storefront
- Colecciones `Products`/`Categories`/`Services` completas con bloques. Storefront RSC con Local API + caché por tags. Listado, filtros, ficha de producto, galería desde `media`. Hooks de revalidación.

### Fase 2 — Carrito
- Carrito en BD (plugin) para invitados y autenticados. `EcommerceProvider` (React 19) en el cliente con `currenciesConfig` EUR. Añadir/quitar/actualizar líneas; limpieza de carritos de invitado.

### Fase 3 — Checkout + PayPal (sesión dedicada)
- Adaptador PayPal a medida. Route handlers `create-order` (recalcula total en servidor), `capture-order` (persiste `orders` idempotente), `webhook` (body RAW, firma offline CRC32, `PAYMENT.CAPTURE.COMPLETED`). Botones cliente. Pruebas end-to-end en sandbox.

### Fase 4 — Contenido / bloques CMS
- Colección `pages` con `layout` (blocks: Hero/Banner, Section, FeaturedProducts, etc.) + `RenderBlocks`. Globals Header/Footer/SiteSettings. Draft mode + preview para staff.

### Fase 5 — Descargas digitales protegidas
- Colección `downloads` con `hasPurchased`, `signedDownloads`. Página "Mis descargas" en la cuenta. Validación de inventario type-aware (digital nunca out-of-stock).

### Fase 6 — Pulido UX / SEO
- Metadatos por página (`seo`), `imageSizes`/OG, sitemap, Core Web Vitals, accesibilidad, estados de carga/streaming, microinteracciones.

### Fase 7 — Deploy
- `push:false` + migraciones aplicadas con `DATABASE_URI_DIRECT` en el paso de build/predeploy. Variables Live de PayPal + webhook id Live. `generate:types`/`importmap` en CI.

---

## 9. Pasos manuales para el usuario (fuera del código)

1. **Crear proyecto Supabase** (región europea, p. ej. `eu-central-1`/`eu-west`).
2. **Connection strings** (Supabase → *Connect*):
   - Copiar la **Session pooler** (`...pooler.supabase.com:5432`) → pegar en `.env` como `DATABASE_URI` **y** `DATABASE_URI_DIRECT`.
   - Recordar: usuario `postgres.<project-ref>` y **URL-encodear** caracteres especiales de la contraseña.
3. **Claves S3 de Storage** (Supabase → *Storage → S3 Connection → Access keys*): generar par y copiar **Access Key ID**, **Secret**, **Endpoint** y **Region** → pegar en `.env` (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_REGION`).
4. **Crear dos buckets** en Supabase Storage: `media` (marcado **público**) y `downloads` (**privado**, sin acceso público) → nombres en `S3_MEDIA_BUCKET` / `S3_DOWNLOADS_BUCKET`.
5. **Generar `PAYLOAD_SECRET`** (cadena aleatoria larga, p. ej. `openssl rand -base64 32`) → pegar en `.env`.
6. **(Fase checkout) Crear app REST en PayPal Developer Dashboard** para **Sandbox** (y luego Live): copiar **Client ID** y **Secret**. Crear una **suscripción de Webhook** apuntando a `https://<tu-dominio>/api/paypal/webhook` y copiar el **Webhook ID** → pegar en `.env` (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`). Crear una **cuenta de comprador sandbox** para pruebas.
7. **(Producción)** Repetir el paso 6 con credenciales **Live** + webhook id **Live** y poner `PAYPAL_ENVIRONMENT=production`. Considerar el add-on IPv4 de Supabase solo si se quiere usar la conexión directa en todas partes (el session pooler ya cubre IPv4 sin coste extra).

---

*Documento basado en hallazgos verificados (mediados de 2026). Ante conflictos, prevalece la documentación oficial de Payload, Supabase y PayPal.*

---

## 10. Registro de avance

### 2026-06-27 — Fase 0 COMPLETADA ✅
- Proyecto scaffoldeado con `create-payload-app` (template **website**, Payload 3.85.1, Next 16.2.6, React 19, Postgres).
- Dependencias instaladas (pnpm 11 → `allowBuilds` en `pnpm-workspace.yaml` para compilar sharp/esbuild/unrs-resolver).
- `.env` con secretos fuertes generados (`PAYLOAD_SECRET`, `PREVIEW_SECRET`, `CRON_SECRET`); `DATABASE_URL` y S3/PayPal como placeholders documentados. `.env.example` reescrito.
- `payload.config.ts`: adaptador Postgres con `push` solo en desarrollo + `migrationDir`; plugin **Storage S3** en dos instancias (media público + downloads privado) gateado por `S3_ENDPOINT`.
- Nuevas colecciones: `Customers` (auth del escaparate, separada del staff) y `Downloads` (privado, con TODO de `hasPurchased` para Fase 3).
- `docker-compose.yml` reescrito a **Postgres** local (puerto 5433) para desarrollo.
- Tipos regenerados (`generate:types`) e `importMap` regenerado. **`tsc --noEmit` limpio.**
- **Verificado de extremo a extremo** arrancando contra un Postgres local: Payload conectó, hizo *push* del esquema (**69 tablas**, incluidas `customers` y `downloads`), `/admin` respondió **HTTP 200**, control de acceso aplicado.
- Repo Git inicializado **dentro de `store/`** (rama `main`) para aislarlo del repo de la carpeta de usuario. `.env` ignorado. *(Sin commit aún — pendiente de tu visto bueno.)*

### 2026-06-27 — Integración Supabase Auth + revisión de seguridad ✅
- App renombrada a **timesmart**. Conectado a Supabase real (conexión directa, SSL); esquema pusheado (68 tablas).
- **Auth**: clientes = Supabase Auth (claves `sb_publishable_`/`sb_secret_`, JWT ES256 vía JWKS con `jose`); staff = auth nativa de Payload. Puente: estrategia custom `supabase` en `customers` (find-or-create por `supabaseUserId`), `disableLocalStrategy`.
- Archivos: `src/lib/supabase/{client,server,admin,jwt,middleware}.ts`, `src/middleware.ts` (matcher excluye `/admin` y `/api`).
- **Revisión de seguridad adversarial** (5 lentes) → encontró que `customers` como 2ª colección de auth rompía `authenticated = Boolean(user)` → **escalada de privilegios**. Corregido y **re-auditado con token de cliente real**:
  - `authenticated`/`authenticatedOrPublished` → exigen `collection === 'users'` (staff).
  - `/next/seed` (destructivo) y `jobs.access` → staff-only.
  - `Downloads.read` → staff-only (hasta `hasPurchased`).
  - Verificador JWT → rechaza `is_anonymous` y `role !== 'authenticated'`; JWKS acoplado al issuer.
  - Middleware `getClaims` en try/catch (anti-DoS); email solo si verificado; hook `DATABASE_CA_CERT` para TLS verify-full.
  - Resultado: `POST /api/users`, `/next/seed`, `POST /api/pages`, `GET /api/downloads` con token de cliente → **403/denegado**; `GET /api/customers` (ficha propia) → OK.

### 2026-06-27 — Fase 1: catálogo + storefront ✅
- Colecciones **Products** (físico/digital, precio EUR, galería→media, stock, archivo digital, destacado, slug) y **Services** (mínima). Lectura pública, escritura staff.
- **Storefront** con UI propia (tema índigo/violeta, logo `timesmart`):
  - Home `/` — hero degradado, badges de confianza, destacados, explorar por tipo, categorías, servicios, CTA.
  - Catálogo `/tienda` — grid + filtros por tipo (físico/digital) y categoría (server-side).
  - Ficha `/producto/[slug]` — galería interactiva, precio/descuento, stock/envío, descripción RichText, add-to-cart.
  - **Carrito** `/carrito` (provider cliente + localStorage: cantidades, eliminar, totales) + badge en el header.
  - **Checkout** `/checkout` — resumen del pedido (pago PayPal marcado para la siguiente fase).
- **Seed** `/next/seed-store?secret=CRON_SECRET` — crea 4 categorías + 9 productos demo con imágenes (físico + digital).
- Verificado E2E con capturas (desktop + móvil): navegar → producto → añadir → carrito con totales. `tsc` limpio, imágenes 200.

### Próximo (Fase 2/3)
- **Checkout + PayPal** (adaptador a medida, create/capture en servidor, webhook, recálculo de precio server-side).
- Páginas storefront de **login/registro/cuenta** (Supabase Auth) y `hasPurchased` real en Downloads.
- Bloques de contenido CMS para la home (editable por el cliente) y página `/servicios`.
- Migración commiteada para el índice único de `supabaseUserId` y para el esquema de Products/Services (no depender solo de `push`).
- Menú móvil (hamburguesa) para los enlaces ocultos en `sm`.