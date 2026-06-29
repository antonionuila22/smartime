# Plan de migración: timesmart — de Payload CMS a Medusa v2

> Estado actual detectado en el repo (`/Users/ramonnuila/Desktop/store`): Next.js **16.2.6** + React **19.2.6**, Payload **3.85.1** (`@payloadcms/db-postgres`), Supabase Postgres + bridge de Supabase Auth en `src/lib/supabase/`, gestor de paquetes **pnpm** (hay `pnpm-lock.yaml` y `pnpm-workspace.yaml`), checkout PayPal en placeholder. Colecciones Payload: `Products`, `Categories`, `Customers`, `Services`, `Downloads`, `Media`, `Pages`, `Posts`.
>
> Objetivo: Medusa v2 como **motor de comercio + admin** sobre el mismo Supabase Postgres; reutilizar el **diseño** del storefront Next.js (componentes/páginas) repuntando su capa de datos y auth a Medusa; mercado Honduras, precios en Lempiras (HNL); productos Apple (Mac + iPhone) con imágenes reales.

---

## 1. Arquitectura objetivo

```
                           ┌─────────────────────────────────────────────┐
                           │            SUPABASE (un solo proyecto)        │
                           │                                               │
                           │  Postgres  ── schema "medusa" (tablas Medusa) │
                           │            ── schema "public" (legacy Payload,│
                           │               se elimina en Fase E)           │
                           │  Storage (S3-compat) ── imágenes admin (opc.) │
                           │  Auth      ── SE RETIRA (lo reemplaza Medusa) │
                           └───────────────┬───────────────┬───────────────┘
                                           │ 5432 session  │
                                           │ pooler + SSL  │
            ┌──────────────────────────────▼───────┐       │
            │     MEDUSA v2 BACKEND  (Node 22 LTS)  │       │
            │     apps/medusa  ·  puerto :9000       │       │
            │                                        │       │
            │  • Store API     /store      ◄────────┼───┐   │
            │  • Admin API     /admin               │   │   │
            │  • Admin UI      /app  (reemplaza      │   │   │
            │                  el admin de Payload)  │   │   │
            │  • Auth module (customers + admin)  ───┼───┼── AUTH vive AQUÍ
            │  • Region "Honduras" / currency HNL    │   │   │
            │  • Payment module (Fase F: PayPal)     │   │   │
            │  • Cache/EventBus/Workflow: in-memory  │   │   │
            │    en dev → Redis en prod              │   │   │
            └────────────────────────────────────────┘   │   │
                                                          │   │
            ┌─────────────────────────────────────────┐  │   │
            │   STOREFRONT NEXT.JS 16 (diseño actual)  │  │   │
            │   raíz del repo  ·  puerto :3000          │  │   │
            │                                          │  │   │
            │  • @medusajs/js-sdk  ──► Store API ──────┼──┘   │
            │    (x-publishable-api-key en cada req)   │      │
            │  • Server Components: listados/PDP/cats   │      │
            │  • Client Components: carrito + auth      │      │
            │  • Componentes/diseño REUTILIZADOS        │      │
            │  • Capa de datos (getPayload, colecciones)│      │
            │    y bridge Supabase-Auth ELIMINADOS ─────┼──────┘
            └──────────────────────────────────────────┘
```

**Decisiones de arquitectura clave:**

- **Auth**: pasa a vivir **íntegramente en Medusa** (módulo Auth `emailpass`). Se retira el bridge de Supabase Auth (`src/lib/supabase/*`) y Supabase Auth como producto. Supabase queda **solo como Postgres** (y opcionalmente Storage). Si en el futuro hace falta login social, se añade un provider de auth en Medusa, no Supabase.
- **Admin**: el dashboard de Medusa en `:9000/app` **reemplaza** el admin de Payload (`src/app/(payload)/admin`). El equipo gestiona productos/precios/órdenes/promociones desde ahí.
- **CMS/contenido**: Payload también servía contenido editorial (`Pages`, `Posts`, blocks, heros). Medusa **no es un CMS**. Decisión recomendada: el storefront es de catálogo Apple; las páginas estáticas (Términos, About, etc.) pasan a contenido en código/MDX en el propio Next.js. El blog (`Posts`) y el page-builder de Payload **se descartan** salvo que se quiera mantener Payload solo-CMS en paralelo (no recomendado para este alcance — duplicaría infra).
- **Topología de despliegue (prod)**: Medusa backend desplegado por separado (Railway/Render/VPS) + Next.js en Vercel, ambos contra el Supabase Postgres de producción, con Redis para los 3 módulos de infraestructura.

---

## 2. Matriz de versiones (a fijar)

| Componente | Versión a fijar | Notas |
|---|---|---|
| `@medusajs/medusa` (core) | **2.16.x** (línea actual) | Verificar patch exacto en install: `npm view @medusajs/medusa version`. Mantener todos los `@medusajs/*` del backend en lockstep. |
| `@medusajs/framework` | 2.16.x (= core) | Provee `defineConfig`, `loadEnv` desde `@medusajs/framework/utils`. |
| `@medusajs/admin-sdk`, `@medusajs/cli` | 2.16.x (= core) | Evitar CLI 2.12.2/2.12.3 (cuelgue en install bajo Node 22). Usar patch reciente. |
| `@medusajs/js-sdk` (storefront) | **última 2.x** (≈2.15.5) | Suele ir ligeramente por detrás del core; instalar con `@latest` y verificar `npm view @medusajs/js-sdk version`. |
| `@medusajs/types` | igualar a js-sdk 2.x | `HttpTypes.StoreProduct`, `StoreCart`, etc. |
| **Node.js** | **22 LTS** (o 20/24 LTS) | Medusa v2 requiere Node 20+. 22 LTS es la opción segura para backend + storefront. El repo ya está en Node moderno. |
| PostgreSQL | Supabase managed (15+) | MikroORM 6.6.x + Knex por debajo. |
| Redis | 5+ (solo prod) | Dev usa módulos in-memory. |
| Next.js / React | **16.2.6 / 19.2.6** (sin cambios) | El storefront actual se conserva; el js-sdk es framework-agnóstico. |
| Gestor de paquetes | **pnpm** (ya en uso) | Pasar `--use-pnpm` a create-medusa-app. |

> Regla de resolución de conflictos: la investigación menciona 2.16.0 / 2.17.1 según fuente. **Fijar en install** con `npm view` y mantener core + framework + admin-sdk + cli en la **misma minor**; js-sdk puede ir una minor por detrás.

---

## 3. Estructura de carpetas propuesta

Monorepo ligero en el repo actual: el storefront Next.js se queda en la raíz (no se mueve, para no romper despliegues/CI) y Medusa entra como subcarpeta `apps/medusa`.

```
store/                              # repo actual (raíz = storefront Next.js)
├── apps/
│   └── medusa/                     # ← Medusa v2 backend (create-medusa-app)
│       ├── medusa-config.ts        # Supabase + CORS + (prod) Redis/S3
│       ├── .env                    # DATABASE_URL session pooler, secrets, CORS
│       ├── src/
│       │   ├── admin/              # extensiones del admin (opcional)
│       │   ├── api/                # rutas custom (opcional)
│       │   ├── modules/            # módulos custom (opcional)
│       │   ├── workflows/          # workflows custom (Fase F payment)
│       │   ├── subscribers/        # ej. emails de orden
│       │   └── scripts/
│       │       └── seed-timesmart.ts   # región HNL + productos Apple
│       └── package.json
│
├── src/                            # STOREFRONT (se conserva el diseño)
│   ├── app/(frontend)/             # páginas: tienda, producto/[slug], carrito,
│   │                               #   checkout, cuenta, login, registro, search
│   ├── components/                 # ProductCard, ProductGallery, Cart, HeroCarousel,
│   │                               #   CategoryTiles, AddToCart, account/... (REUSO)
│   ├── components/ui/              # shadcn/ui (REUSO total)
│   ├── providers/Cart/             # se reescribe para hablar con Store API
│   ├── lib/
│   │   ├── medusa/                 # ← NUEVO: sdk.ts, region.ts, helpers
│   │   └── supabase/               # ← SE ELIMINA en Fase E
│   ├── app/(payload)/              # ← SE ELIMINA en Fase E (admin + api Payload)
│   ├── collections/                # ← SE ELIMINA en Fase E
│   ├── blocks/ heros/ search/      # ← editorial Payload: descartar o portar a MDX
│   ├── payload.config.ts           # ← SE ELIMINA en Fase E
│   └── payload-types.ts            # ← SE ELIMINA en Fase E
│
├── package.json                    # storefront (se quitan deps Payload en Fase E)
├── pnpm-workspace.yaml             # añadir "apps/*" a los workspaces
└── ...
```

`pnpm-workspace.yaml` debe incluir `apps/*` para que `apps/medusa` quede como workspace. Mantener **dos `package.json` independientes** (storefront vs backend) con sus propias deps; no fusionar dependencias de Medusa y Next.

---

## 4. Plan por fases

### Fase A — Scaffold Medusa + DB Supabase + admin corriendo + usuario admin *(hoy)*
1. En Supabase → Connect, copiar la **Session pooler** connection string (host `aws-...pooler.supabase.com`, **puerto 5432**, user `postgres.<ref>`). **No** usar el Transaction pooler (6543): rompe prepared statements y `db:migrate`.
2. Scaffold del backend en `apps/medusa` con `create-medusa-app`, **sin** starter Next.js, **sin** abrir navegador, apuntando a Supabase, con pnpm.
3. Configurar `medusa-config.ts` con SSL (`rejectUnauthorized:false`) y opcional `databaseSchema: "medusa"` para aislar de las tablas Payload existentes durante la convivencia.
4. `db:migrate` (NO `db:create` — la DB `postgres` ya existe en Supabase) y crear usuario admin.
5. `npm run dev` → admin en `http://localhost:9000/app`, login con el usuario admin.
> Comandos exactos en la sección 5.

### Fase B — Región Honduras/HNL + productos Apple sembrados con imágenes
1. En Admin → Settings → Store: añadir **HNL** a supported currencies y marcarla **default** (HNL ya está en la tabla de monedas de Medusa; sin código custom).
2. Settings → Regions: crear región **"Honduras"**, currency `hnl`, country `HN`, payment provider `pp_system_default`.
3. Crear Sales Channel "Timesmart HN" + Stock Location (Tegucigalpa) y enlazarlos.
4. Escribir `apps/medusa/src/scripts/seed-timesmart.ts` y ejecutarlo con `npx medusa exec ./src/scripts/seed-timesmart.ts` para cargar Mac + iPhone con precios HNL e imágenes.
   - **Precios en unidades MAYORES (no centavos)**: `amount: 32999` = L 32,999.00. `currency_code` siempre en **minúsculas** (`"hnl"`).
   - **Imágenes**: `images:[{url}]` + `thumbnail` con URLs públicas (CDN de Apple o Supabase Storage). Medusa las guarda tal cual, no las rehospeda.
   - Cada variante necesita un `options` map que coincida exactamente con las opciones del producto (ej. `{ Almacenamiento:"256GB", Color:"Titanio Negro" }`).
5. Verificar en el admin que los productos aparecen con precio en Lempiras dentro de la región Honduras.

### Fase C — Repuntar storefront al Store API de Medusa (reusando diseño) + publishable key + CORS
1. En Admin → Settings → Publishable API Keys: obtener/crear la key y **enlazarla al Sales Channel** "Timesmart HN" (sin enlace, los listados vienen vacíos aunque la key sea válida).
2. En el storefront: `pnpm add @medusajs/js-sdk @medusajs/types`.
3. `.env.local` del storefront:
   - `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`
   - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...`
4. Crear `src/lib/medusa/sdk.ts` (instancia compartida) y `src/lib/medusa/region.ts` (lookup de región HNL cacheado con `cache()`).
5. Reemplazar las llamadas a Payload por el SDK, **manteniendo los componentes de diseño**:
   - `src/app/(frontend)/tienda/page.tsx`, `producto/[slug]/page.tsx`, `search/page.tsx`, `[slug]/page.tsx`, `page.tsx` → Server Components con `sdk.store.product.list/region.list` (pasar `region_id` + `fields:"*variants.calculated_price"`).
   - PDP/categoría **por handle**: `sdk.store.product.list({ handle })[0]` (no hay retrieve-by-handle).
6. Configurar CORS en `apps/medusa/.env`: `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` incluyendo `http://localhost:3000` (y dominios prod). Reiniciar backend.
7. Formato de precio: `Intl.NumberFormat("es-HN",{style:"currency",currency:"HNL"}).format(variant.calculated_price.calculated_amount)` — **NO dividir entre 100**.
8. Añadir el dominio de imágenes de Medusa/CDN a `next.config.ts` (`images.remotePatterns`).

### Fase D — Auth de clientes con Medusa (register/login/cuenta)
1. Carrito (`src/providers/Cart/index.tsx` + `AddToCart` + página `carrito`) → Client Components contra `sdk.store.cart.*` (create con `region_id`, line items por `variant_id`, `cart_id` en localStorage).
2. Auth en Client Components (`login`, `registro`, `cuenta`, `components/account/*`):
   - Registro = **2 llamadas**: `sdk.auth.register("customer","emailpass",{email,password})` → luego `sdk.store.customer.create({...})`. Si la identidad ya existe → intentar login.
   - Login = `sdk.auth.login("customer","emailpass",{...})`; guardar contra que devuelva objeto con `location` (`typeof token === "string"`).
   - Sesión: el SDK guarda el JWT en `localStorage` (`medusa_auth_token`). Para lecturas autenticadas en Server Components, cambiar `auth.type:"jwt"` y persistir el token en cookies; para empezar, mantener auth/carrito **client-side**.
3. `LogoutButton`/`AccountButton` → `sdk.auth.logout()` / `sdk.store.customer.retrieve()`.

### Fase E — Retirar Payload y la auth Supabase
1. Borrar `src/app/(payload)/`, `src/payload.config.ts`, `src/payload-types.ts`, `src/collections/`, `src/lib/supabase/`, `src/middleware.ts` (o reescribir sin Supabase), `src/endpoints/seed`, y editorial no portado (`src/blocks`, `src/heros`, `src/search` de Payload).
2. Limpiar `package.json`: quitar todos los `@payloadcms/*`, `payload`, `@supabase/ssr`, `@supabase/supabase-js`, `graphql`, scripts `payload`/`generate:types`/`generate:importmap`. Quitar variables Payload/Supabase-Auth del `.env`/`.env.example` (`PAYLOAD_SECRET`, `PAYLOAD_CONFIG_PATH`, `PREVIEW_SECRET`, `SUPABASE_JWKS_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_*`).
3. En Supabase: tras confirmar que Medusa funciona y que no se necesita migrar datos legacy, eliminar las tablas Payload del schema `public` (o dejarlas inertes). Desactivar Supabase Auth.
4. `pnpm install` + `pnpm build` del storefront para confirmar que no quedan imports rotos.

### Fase F — Checkout / PayPal con el payment module de Medusa
1. Habilitar el módulo de pagos y un provider de PayPal en `medusa-config.ts` (provider de PayPal de Medusa o uno community; configurar credenciales sandbox primero), asociado a la región Honduras.
2. Flujo de checkout en `src/app/(frontend)/checkout/page.tsx` con el cart de Medusa: actualizar dirección/envío → crear payment collection / payment session del provider PayPal → completar cart → orden.
3. Reemplazar el placeholder PayPal actual (`checkout/page.tsx`, `Footer`, `TrustBand`) por el flujo real.
4. Configurar shipping options/profiles y tax region para HN en el admin.
5. Producción: Redis (3 módulos infra), File Module S3 (Supabase Storage `forcePathStyle:true`), credenciales PayPal live, CORS y publishable key de prod.

---

## 5. Comandos concretos — Fase A (paste-ready)

```bash
# (1) Verificar versiones a fijar ANTES de instalar
npm view @medusajs/medusa version
npm view @medusajs/js-sdk version

# (2) Scaffold del backend Medusa en apps/medusa, apuntando a Supabase,
#     sin starter Next.js, sin abrir navegador, con pnpm.
#     IMPORTANTE: usar el SESSION pooler (puerto 5432), NO el 6543.
npx create-medusa-app@latest medusa \
  --directory-path "/Users/ramonnuila/Desktop/store/apps" \
  --db-url "postgres://postgres.<PROJECT-REF>:<DB_PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require" \
  --use-pnpm \
  --no-browser
# Prompts: (a) nombre proyecto -> medusa ; (b) email admin -> info@codebrand.es
# Cuando pregunte por instalar el Next.js Starter Storefront -> NO.
# Flags útiles: --skip-db (no crear DB), --no-migrations (saltar migraciones+admin user),
#               --version <ver> (fijar versión), --verbose.
```

> Si `create-medusa-app` falla en la creación de DB con Supabase, añadir `--skip-db` y correr las migraciones a mano (paso 4). El SSL hay que reflejarlo además en `medusa-config.ts`.

```bash
# (3) Configurar SSL/Supabase en apps/medusa/medusa-config.ts (extracto):
#   projectConfig: {
#     databaseUrl: process.env.DATABASE_URL,           // session pooler :5432 ?sslmode=require
#     databaseDriverOptions: process.env.NODE_ENV !== "development"
#       ? { connection: { ssl: { rejectUnauthorized: false } } } : {},
#     // databaseSchema: "medusa",                      // aislar de las tablas Payload
#     redisUrl: process.env.REDIS_URL,                 // opcional en dev
#     http: { storeCors, adminCors, authCors, jwtSecret, cookieSecret },
#   }
# .env (apps/medusa): generar secretos
#   openssl rand -base64 32   # JWT_SECRET
#   openssl rand -base64 32   # COOKIE_SECRET

# (4) Migraciones (NO db:create — la DB postgres ya existe en Supabase) + usuario admin
cd /Users/ramonnuila/Desktop/store/apps/medusa
npx medusa db:migrate
npx medusa user -e info@codebrand.es -p 'una-clave-fuerte'
#   alternativa con invitación: npx medusa user -e info@codebrand.es --invite

# (5) Levantar el backend en dev (API + Admin + workers en :9000)
npm run dev
#   Admin: http://localhost:9000/app
```

Si `db:migrate` lanza `prepared statement "s0" does not exist`, estás en el Transaction pooler (6543): cambia `DATABASE_URL` al **Session pooler (5432)** o a la **conexión directa** y reintenta.

---

## 6. Riesgos / gotchas

| Riesgo | Mitigación |
|---|---|
| **Supabase Transaction pooler (6543)** rompe prepared statements y `db:migrate` (misma clase de fallo que tuviste con Payload). | Usar **Session pooler (5432)** `?sslmode=require` para runtime y migraciones. Directa (`db.<ref>.supabase.co:5432`) es **IPv6-only** sin add-on IPv4 — evitar salvo IPv6 garantizado. |
| **SSL obligatorio** en Supabase pero certs no pasan verificación estricta. | `databaseDriverOptions.connection.ssl = { rejectUnauthorized: false }` (gateado por `NODE_ENV`) + `sslmode=require` en la URL. |
| **Módulos in-memory** (Cache/EventBus/Workflow) son el default en dev. | Correcto para dev de una sola instancia. En **prod multi-instancia registrar Redis** (`event-bus-redis`, `workflow-engine-redis` — su `redisUrl` va anidado bajo `options.redis`, `cache-redis`/Redis Caching Provider). |
| **Publishable key sin Sales Channel** → listados vacíos (401/empty "funciona en admin, no en storefront"). | Enlazar la publishable key al Sales Channel de los productos. Enviar `x-publishable-api-key` en cada request (el js-sdk lo hace solo si se pasa `publishableKey`). |
| **HNL / precios**: v2 usa **unidades mayores, no centavos**; `currency_code` en minúsculas. | `amount: 24999` = L 24,999.00. Nunca multiplicar/dividir por 100. Añadir HNL a store **antes** de crear la región y de poner precios (orden importa en el seed). Sin `region_id` + `fields:"*variants.calculated_price"` no llegan precios. |
| **CORS**: `AUTH_CORS` es distinto de `STORE_CORS`; login/registro van por `/auth`. | Incluir el origin del storefront en `STORE_CORS` **y** `AUTH_CORS`. Reiniciar backend tras cambios. |
| **JWT en localStorage** no es visible a Server Components. | Mantener auth/carrito client-side al inicio; para SSR autenticado usar `auth.type:"jwt"` + cookies. |
| **Imágenes externas** se guardan verbatim (no rehospedadas) → se rompen si la URL cambia. | Para durabilidad, subir vía File Module (S3/Supabase Storage `forcePathStyle:true`). Añadir el dominio a `next.config images.remotePatterns` o el `next/image` da 404. |
| **No usar docs/comandos v1** (medusa-config.js + plugins array, `@medusajs/medusa-js`). | Todo v2: `medusa-config.ts`, módulos, workflows, `@medusajs/js-sdk`. Promotions ≠ Discounts v1. |
| **CLI 2.12.2/2.12.3** cuelga en install bajo Node 22. | Usar un patch de CLI más reciente (2.16.x). |
| **Monorepo**: correr `dev/build/CLI` desde `apps/medusa`, no desde la raíz. | Scripts de Medusa siempre dentro de `apps/medusa`. Añadir `apps/*` a `pnpm-workspace.yaml`. |

**Qué se reescribe vs qué se reutiliza en el storefront** (resumen, detalle en sección 7): se **reutiliza todo el diseño/UI/tema**; se **reescribe solo la capa de datos** (fetching) y la de **auth/carrito** para hablar con el Store API.

---

## 7. Qué se reutiliza vs qué se reemplaza

### Se REUTILIZA (diseño/UI — sin tocar o con cambio mínimo de props)
- **shadcn/ui** completo: `src/components/ui/`, `components.json`, `tailwind.config.mjs`, `postcss.config.js`, `src/cssVariables.js`, tema (`src/providers/Theme`, `HeaderTheme`).
- **Componentes de presentación**: `ProductCard`, `ProductCarousel`, `ProductGallery`, `CollectionArchive`, `Card`, `HeroCarousel`, `CategoryTiles`, `CategoryNav`, `PromoBanner`, `TrustBand`, `AnnouncementBar`, `SearchBar`, `Pagination`, `PageRange`, `Logo`, `Link`, `Header/*`, `Footer/*`.
- **Estructura de páginas y rutas** en `src/app/(frontend)/`: `tienda`, `producto/[slug]`, `carrito`, `checkout`, `cuenta`, `login`, `registro`, `search` — se mantiene el layout/JSX, cambia el origen de los datos.
- Config base: `next.config.ts` (ajustando `images.remotePatterns`), `tsconfig.json`, ESLint/Prettier, Playwright/Vitest.

### Se REEMPLAZA (capa de datos + admin + auth)
- **`getPayload` / colecciones Payload** (`Products`, `Categories`, `Customers`, `Services`, `Downloads`, `Media`, `Pages`, `Posts`) → llamadas `sdk.store.*` al Store API de Medusa. Datos de catálogo (productos/categorías/colecciones/precios) ahora vienen de Medusa.
- **Bridge Supabase-Auth** (`src/lib/supabase/{client,server,admin,middleware}.ts`, `src/middleware.ts`, `components/account/*` con Supabase) → módulo Auth de Medusa vía `sdk.auth.*` + `sdk.store.customer.*`.
- **Admin de Payload** (`src/app/(payload)/admin` + `api` + `payload.config.ts` + `payload-types.ts`) → **Admin de Medusa** en `:9000/app`.
- **Carrito** (`src/providers/Cart`, `AddToCart`) → `sdk.store.cart.*` (Medusa gestiona cart, line items, totales en HNL).
- **Checkout/PayPal placeholder** → payment module de Medusa con provider PayPal (Fase F).
- **Contenido editorial** (`blocks`, `heros`, `search` de Payload, `Posts`, page-builder) → descartar o portar páginas estáticas a MDX/código en Next (Medusa no es CMS).
- **Dependencias** a eliminar de `package.json`: `@payloadcms/*`, `payload`, `@supabase/ssr`, `@supabase/supabase-js`, `graphql`, `@payloadcms/db-postgres`; y scripts `payload`/`generate:types`/`generate:importmap`.

### Archivos NUEVOS a crear
- `src/lib/medusa/sdk.ts` — instancia `new Medusa({ baseUrl, publishableKey })`.
- `src/lib/medusa/region.ts` — lookup cacheado de la región HNL (`cache()`).
- `apps/medusa/medusa-config.ts`, `apps/medusa/.env` — config Supabase/CORS/secrets.
- `apps/medusa/src/scripts/seed-timesmart.ts` — región Honduras/HNL + productos Apple con imágenes.
- `.env.local` (storefront) — `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

---

### Orden de ejecución recomendado
**A (hoy)** → **B** (datos en HNL) → **C** (storefront lee de Medusa, en paralelo a Payload) → **D** (auth/carrito) → **E** (retirar Payload/Supabase-Auth una vez todo verde) → **F** (checkout PayPal). Las fases A–D permiten **convivencia** Payload+Medusa (por eso `databaseSchema: "medusa"`), de modo que el storefront se puede migrar página por página sin downtime; el corte definitivo es la Fase E.
