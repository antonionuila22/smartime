import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * Invalidación de caché EN TIEMPO REAL para el modelo Cache Components (`'use cache'` + `cacheTag`).
 *
 * Flujo completo:
 *   1. En el admin de Medusa alguien crea/edita/borra un producto o una categoría.
 *   2. El subscriber del backend (`medusa/src/subscribers/catalog-sync.ts`) hace POST aquí
 *      con `{ tags: [...] }` y el header `x-revalidate-secret`.
 *   3. Este handler valida el secreto, filtra las tags contra la whitelist y llama a
 *      `revalidateTag(...)` → las entradas cacheadas con `cacheTag('products' | 'categories' |
 *      'regions' | 'reviews')` en `src/lib/medusa/data.ts` se refrescan al instante,
 *      sin esperar el TTL de `cacheLife`.
 */

// Whitelist estricta: SOLO las tags que realmente usa la capa de datos (`cacheTag`).
// Cualquier otra cosa que llegue en el body se descarta en silencio.
const ALLOWED_TAGS = ['products', 'categories', 'regions', 'reviews'] as const
const ALLOWED_SET = new Set<string>(ALLOWED_TAGS)

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET
  const provided = req.headers.get('x-revalidate-secret')

  if (!secret) {
    // Fail-closed en producción: sin secreto configurado NADIE puede purgar la caché.
    // La caché seguirá cayendo por TTL igualmente, así que no se rompe nada.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'REVALIDATE_SECRET no configurado; endpoint deshabilitado' },
        { status: 503 },
      )
    }
    // En desarrollo lo dejamos pasar para poder probar en local, pero avisamos.
    console.warn(
      '[revalidate] REVALIDATE_SECRET no configurado: aceptando la petición SOLO porque estamos en desarrollo.',
    )
  } else if (provided !== secret) {
    // Hay secreto configurado y el que llega no coincide → rechazado.
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Body esperado: { tags?: string[] }. Se filtra contra la whitelist.
  let tags: string[] = []
  try {
    const body = (await req.json()) as { tags?: unknown }
    const raw = Array.isArray(body?.tags) ? body.tags : []
    tags = [...new Set(raw.map(String).filter((t) => ALLOWED_SET.has(t)))]
  } catch {
    /* body ausente o JSON inválido → tags queda vacío y respondemos 400 abajo */
  }

  if (!tags.length) {
    return NextResponse.json(
      { error: 'sin tags válidas', allowed: ALLOWED_TAGS },
      { status: 400 },
    )
  }

  // `{ expire: 0 }` = expiración INMEDIATA. En Next 16 `revalidateTag` exige el perfil como
  // segundo argumento; este es el patrón recomendado para webhooks de sistemas externos que
  // llaman a un Route Handler (`updateTag` solo puede usarse en Server Actions).
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  return NextResponse.json({ revalidated: tags })
}
