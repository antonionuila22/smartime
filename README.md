# smartime — Storefront (Next.js 16 + Medusa v2)

Tienda online de **smartime** (Honduras, precios en Lempiras/HNL). Storefront headless que consume
el **Store API** de Medusa (`../medusa`). Tecnología, Apple, audio, gaming y hogar, con reseñas
verificadas, cuotas y envío a todo el país.

## Stack

- **Next.js 16** (App Router, React 19, RSC) · **Tailwind CSS 4** · **shadcn/ui** · **lucide-react**
- **`@medusajs/js-sdk`** para hablar con el backend Medusa
- **pnpm** · **Node ≥ 20**
- Tests: **Vitest** (integración) + **Playwright** (e2e)

> El backend (catálogo, clientes, pedidos, admin) está en `../medusa` (proyecto Medusa v2).
> Este repositorio es **solo el storefront**.

## Puesta en marcha

```bash
cp .env.example .env     # apunta NEXT_PUBLIC_MEDUSA_BACKEND_URL y la publishable key
pnpm install
pnpm dev                 # http://localhost:3000
```

Requiere el backend Medusa corriendo (por defecto en `http://localhost:9000`). Ver `../medusa/README.md`.

## Scripts

| Script              | Acción                                  |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Servidor de desarrollo                  |
| `pnpm build`        | Build de producción                     |
| `pnpm start`        | Servir el build                         |
| `pnpm lint`         | ESLint                                  |
| `pnpm test:int`     | Tests de integración (Vitest)           |
| `pnpm test:e2e`     | Tests end-to-end (Playwright)           |

## Variables de entorno

Todas con prefijo `NEXT_PUBLIC_` (este front no toca la base de datos). Ver `.env.example`:

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` — URL del backend Medusa.
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` — publishable key (vinculada al Sales Channel).
- `NEXT_PUBLIC_SERVER_URL` — URL pública del storefront.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — número del WhatsApp flotante.

## Estructura

```
src/
  app/(frontend)/      Rutas: home, tienda, producto/[slug], carrito, checkout, login, registro, cuenta
  components/          UI del storefront (ProductCard, HeroCarousel, CuotaBadge, Cart, …)
  providers/           Cart, Wishlist, Theme, HeaderTheme (contexts de cliente)
  lib/medusa/          Capa de datos: sdk.ts (cliente), data.ts (queries), types.ts
  Header/ Footer/      Cabecera y pie
  utilities/           Helpers (formato de precio, etc.)
```

La capa de datos vive en `src/lib/medusa/`. La región/moneda por defecto es **HNL (Honduras)**.

## Notas

- **Seguridad:** la compra requiere cuenta (correo + contraseña). La finalización del pedido está
  protegida en el backend (`../medusa/src/api/middlewares.ts`).
- Las imágenes externas deben tener su dominio declarado en `next.config.ts` (`images.remotePatterns`).
