# Despliegue del storefront (Next.js 16) en Vercel — smartime

Guía accionable para desplegar el **storefront** (`../`, Next 16 con `cacheComponents`/PPR) en
**Vercel**. El backend Medusa va aparte en un host Node persistente (ver
`../../medusa/docs/deploy.md`).

> Este front **no habla con la BD**: todo pasa por el **Store API** de Medusa. Solo maneja
> variables `NEXT_PUBLIC_*` (públicas) más un secreto server-side (`REVALIDATE_SECRET`).

---

## 1. Conectar el repo

1. En Vercel: **Add New → Project → Import** el repositorio del storefront.
2. **Root Directory** = la carpeta de este proyecto (donde está `next.config.ts`).
3. Framework preset: **Next.js** (autodetectado). Build/output por defecto — no toques nada.
4. Cada push a la rama de producción dispara un **build automático**.

Vercel corre `next build` con el gestor del `pnpm-lock.yaml`; `cacheComponents` (PPR) funciona
de forma **nativa** en Vercel (shell estático + huecos dinámicos en streaming), sin config extra.

---

## 2. Variables de entorno (Vercel → Settings → Environment Variables)

Marcadas con ⚠ las imprescindibles. Copia de `../.env.example`.

| Variable | Ejemplo / Notas |
|---|---|
| ⚠ `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | URL pública del backend, p. ej. `https://api.smartime.hn`. El navegador hace fetch directo a esta API. **Debe figurar en el `connect-src` de la CSP** de `next.config.ts` (que lo lee de esta misma variable), o las llamadas se bloquean. |
| ⚠ `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | El `pk_...` del backend, **vinculado al sales channel** del catálogo; si no, los listados salen vacíos. |
| ⚠ `NEXT_PUBLIC_SERVER_URL` | URL pública del storefront **sin barra final**, p. ej. `https://smartime.hn` (CORS, links, sitemap). |
| ⚠ `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Client ID **público** de la app PayPal. El secret vive SOLO en el backend. |
| ⚠ `NEXT_PUBLIC_PAYPAL_ENVIRONMENT` | `live` en producción; **debe coincidir** con `PAYPAL_ENVIRONMENT` del backend. |
| ⚠ `REVALIDATE_SECRET` | Server-side (**NO** `NEXT_PUBLIC_`). Protege `/api/revalidate`. **Idéntico** al `REVALIDATE_SECRET` del backend, o la revalidación en tiempo real se rechaza. `openssl rand -hex 32`. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp flotante, formato internacional sin `+` (`504XXXXXXXX`). |

> Define las variables en el entorno **Production** (y en Preview si quieres previews
> funcionales apuntando a un backend de staging).

---

## 3. Imágenes: restringir `remotePatterns` al CDN real

En `next.config.ts`, `images.remotePatterns` hoy permite `https://**` (cualquier host) porque
el catálogo seed enlaza imágenes de CDNs externos variados. **En producción** esto convierte el
optimizador de Next en un **proxy abierto**: sube las imágenes al backend/CDN propio y restringe
la lista al dominio real, p. ej.:

```ts
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    { protocol: 'https', hostname: 'cdn.smartime.hn' },
  ],
},
```

(Quita el `http://localhost` que solo sirve en local.)

---

## 4. Dominio y HTTPS

1. **Settings → Domains**: añade `smartime.hn` (y `www`, si aplica). Vercel emite el TLS.
2. Confirma que `NEXT_PUBLIC_SERVER_URL` coincide con el dominio final.
3. En el **backend** (`../../medusa/docs/deploy.md`): añade este dominio a `STORE_CORS` y
   `AUTH_CORS`. Sin eso, el login de clientes y las llamadas al Store API fallan por CORS.

La CSP y las cabeceras de seguridad (HSTS, `X-Frame-Options`, etc.) ya van en `next.config.ts`;
HSTS solo surte efecto sobre HTTPS (Vercel lo sirve por defecto).

---

## 5. Checklist de release

- [ ] Repo importado, **Root Directory** correcto, build verde.
- [ ] Las 6 variables ⚠ definidas en el entorno **Production**.
- [ ] `NEXT_PUBLIC_MEDUSA_BACKEND_URL` es el dominio HTTPS real del backend (y está en la CSP).
- [ ] `NEXT_PUBLIC_PAYPAL_ENVIRONMENT` = `live` y coincide con el backend.
- [ ] `REVALIDATE_SECRET` idéntico en storefront y backend.
- [ ] `images.remotePatterns` restringido al CDN real (§3).
- [ ] Dominio configurado y añadido a `STORE_CORS`/`AUTH_CORS` del backend (§4).
- [ ] Prueba en el navegador el flujo de checkout PayPal y la carga de imágenes; revisa la
      consola por violaciones de CSP (PayPal puede introducir hosts nuevos).
