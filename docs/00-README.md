# Documentación fundacional — smartime

Set de documentos de producto e ingeniería para **smartime**, la tienda online de Honduras
(Lempiras/HNL), especialista en Apple + electrónica de consumo. Arquitectura headless:
**storefront Next.js 16** (`../`, este repo) + **backend Medusa v2** (`../../medusa`) + Postgres en Supabase.

> Generados mediante un workflow multi-agente (mapeo del código real → redacción encadenada →
> crítico de consistencia). **Puntuación de consistencia del crítico: 88/100.** Tras la revisión se
> aplicaron correcciones puntuales de precisión doc↔código (precedencia de precio original, estado
> de stock pendiente, marca del JSON-LD, fulfillment boilerplate EU, formato de precio).

## Orden de lectura

| # | Documento | Para qué sirve |
|---|-----------|----------------|
| 01 | [PRD](01-PRD.md) | Visión, personas, propuesta de valor, alcance MVP/P1/P2, ~30 historias de usuario con criterios Gherkin, RNF, métricas North Star, riesgos. **Ancla todo lo demás.** |
| 02 | [TRD](02-TRD.md) | Arquitectura, stack con versiones reales, superficie de APIs (pública/privada/custom + guard), auth, pagos PayPal, fulfillment HN + ETA, seguridad, pruebas, despliegue. |
| 03 | [UX/UI System](03-UXUI-system.md) | Marca, tokens reales de `globals.css`, tipografía, color, componentes (shadcn + custom), patrones, accesibilidad, i18n es-HN. |
| 04 | [App Flow](04-app-flow.md) | Mapa del sitio, recorridos paso a paso (incl. checkout con cuenta obligatoria), máquina de estados del pedido, gating y casos borde. |
| 05 | [Schema DB](05-schema-db.md) | ERD de entidades Medusa + módulo `review`, metadata (brand/compare_at_price), datos de envío/ETA, wishlist, migraciones. |
| 06 | [Plan de implementación](06-implementation-plan.md) | Fases ordenadas (0 cimientos ✓ → checkout → envíos → pedidos en perfil → admin/webhooks → engagement → hardening), con archivos, dependencias, criterios de aceptación y esfuerzo. |

## Decisiones bloqueadas (vinculantes en los 6 docs)

- **D1 — Checkout con cuenta obligatoria, sin invitado.** El backend ya lo exige
  (`authenticate("customer")` en `POST /store/carts/:id/complete`). Anula explícitamente la
  recomendación de *guest checkout* del análisis competitivo; se compensa con registro express + redirect.
- **D2 — Envíos con Fulfillment nativo de Medusa**: zonas HN (Tegucigalpa / SPS / resto) + retiro en
  tienda + **fecha estimada (ETA)**.
- **D3 — Estado del pedido y fecha de envío visibles en `/cuenta`** (solo-lectura para el cliente).
- **D4 — Salesforce solo como costura** (webhooks/eventos), sin construir la integración ahora.
- **D5 — Superficie de API/webhooks definida**: Store pública (publishable key + sales channel),
  Admin privada, rutas custom, y eventos para CRM futuro.

## Decisiones abiertas transversales (a cerrar con negocio/al implementar)

1. **Moneda de liquidación PayPal** (HNL no liquidable): recomendación = mostrar HNL, liquidar en
   USD con tasa transparente en `order.metadata`. Confirmar tasa y reconciliación.
2. **Tarifas por zona HN y umbral de envío gratis** (asumido L 25,000) — parámetros de negocio.
3. **Proveedor de pago local HN** (tarjeta 3DS / transferencia / cuotas BAC) — dependencia externa (P1).
4. **Instrumentación analítica (GA4/eventos del funnel)** — gap que bloquea medir las métricas; decidir P0 vs P1.
5. **Rate limiting** en `POST /store/reviews` — definir mecanismo antes de exponerlo.
6. **Sesión para RSC**: bearer client-side en MVP; evaluar cookie httpOnly en P1.
7. **Wishlist**: hoy localStorage; ¿módulo en BD? (solo si se quiere multi-dispositivo/alertas — P2).
8. **Motor de búsqueda dedicado** (Meilisearch) solo si crece el catálogo/empeora la latencia.

## Gaps conocidos (anotados en los docs)

- **Estado de stock variable** ("Últimas unidades"/"Agotado") **no implementado**: `toViewProduct`
  fija `inStock: true`. Asignado a Fase 2/3 (leer `inventory_level`).
- **JSON-LD de la PDP** hardcodea `brand: "Apple"`; debe leer `metadata.brand` (Fase 5/6).
- **`medusa/src/migration-scripts/initial-data-seed.ts`** es boilerplate Medusa de **Europa** (no HN):
  ignorar/reemplazar al configurar el fulfillment HN (Fase 2).

## Estado del proyecto

**Fase 0 (cimientos) completada**: Payload eliminado, backend des-monorepo'd, seguridad endurecida
(TLS con CA, guard de compra autenticada, cabeceras, CORS). Lo siguiente accionable es la **Fase 1
(checkout + cuenta obligatoria + PayPal)** del [plan](06-implementation-plan.md).

_Estos documentos viven versionados en el repo `store/` (`store/docs/`)._
