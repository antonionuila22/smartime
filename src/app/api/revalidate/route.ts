import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * Invalidación de caché EN TIEMPO REAL para el modelo Cache Components (`'use cache'` + `cacheTag`).
 *
 * El backend Medusa (subscriber `product-revalidate`) llama a este endpoint cuando cambia el
 * catálogo (producto creado/editado/borrado). Aquí hacemos `revalidateTag(...)` sobre las
 * etiquetas afectadas → los datos cacheados se refrescan al instante, sin esperar el TTL de
 * `cacheLife`. Protegido por un secreto compartido (`REVALIDATE_SECRET`).
 *
 * Inerte si no hay `REVALIDATE_SECRET` configurado (responde 401): la caché seguirá cayendo por
 * TTL igualmente.
 */
const ALLOWED_TAGS = new Set(['products', 'categories', 'regions', 'reviews'])

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET
  const provided = req.headers.get('x-revalidate-secret')
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let tags: string[] = []
  try {
    const body = (await req.json()) as { tags?: unknown }
    const raw = Array.isArray(body?.tags) ? body.tags : body?.tags ? [body.tags] : []
    tags = raw.map(String).filter((t) => ALLOWED_TAGS.has(t))
  } catch {
    /* sin body válido → se usa el conjunto por defecto abajo */
  }
  if (!tags.length) tags = ['products', 'categories']

  // `{ expire: 0 }` = expiración INMEDIATA, el patrón recomendado por Next para webhooks de
  // sistemas externos que llaman a un Route Handler (updateTag solo va en Server Actions).
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  return NextResponse.json({ revalidated: tags })
}
