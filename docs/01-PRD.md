# 01 — PRD (Product Requirements Document) — smartime

> **Producto:** smartime — tienda online especialista Apple + electrónica de consumo para Honduras (mercado HN, moneda Lempiras / HNL).
> **Stack:** Storefront Next.js 16 (App Router, React 19, Tailwind 4, shadcn/ui) ⇄ Backend Medusa v2.17 (headless, Postgres en Supabase) — dos repos hermanos bajo `~/Desktop/smartimehn/` (`store/`, `medusa/`).
> **Autor:** Product Management (senior PM).
> **Estado:** Vigente. Documento maestro de requisitos. Cualquier cambio de alcance pasa por aquí.
> **Fecha:** 2026-06-29.

### Documentos relacionados (cruce de referencias)

| Doc | Contenido | Cuándo consultarlo |
|---|---|---|
| **`01-PRD.md`** (este) | Qué construimos, para quién, por qué, criterios de aceptación | Fuente de verdad de producto |
| **`02-TRD.md`** | Requisitos técnicos: módulos Medusa, Payment/Fulfillment, APIs, seguridad, performance | Para *cómo* se implementa cada RF |
| **`03-UXUI-system.md`** | Sistema de diseño, tokens, componentes, patrones de UI, accesibilidad | Para el detalle visual/interacción de cada pantalla |
| **`04-app-flow.md`** | Diagramas de flujo de usuario y de estados (carrito→checkout→pago→pedido) | Para los recorridos extremo a extremo |
| **`05-schema-db.md`** | Modelo de datos: entidades core Medusa + módulos custom (review, financing futuro, wishlist) | Para entidades, campos y relaciones |
| **`06-implementation-plan.md`** | Plan de ejecución por fases, dependencias, estimaciones, criterios de salida | Para la secuencia de entrega |

> Fuente estratégica primaria: **`../COMPETITOR_ANALYSIS.md`** (análisis de 6 referentes) y **`../MEDUSA_PLAN.md`** (migración a Medusa v2). Este PRD operacionaliza ambos.

---

## 0. Decisiones bloqueadas (NO se replanifican)

Estas 5 decisiones son **vinculantes** y se reflejan fielmente en todo el documento. Cualquier RF que las contradiga es un error de redacción.

| # | Decisión | Implicación en el producto |
|---|---|---|
| **D1** | **Checkout con cuenta OBLIGATORIA. SIN invitado (guest).** El cliente debe registrarse (correo + contraseña) para comprar. | El guard de backend ya existe: `POST /store/carts/:id/complete` exige `authenticate("customer")`. El flujo de checkout incluye un *gate* de autenticación antes del pago. **Nota:** el `COMPETITOR_ANALYSIS.md` recomienda "guest checkout"; **esa recomendación queda anulada por D1.** Compensamos la fricción con registro express (1 paso, correo+contraseña) y login social futuro. |
| **D2** | **Envíos con Fulfillment NATIVO de Medusa.** Zonas/tarifas manuales de Honduras (Tegucigalpa, San Pedro Sula, resto del país) + **RETIRO EN TIENDA** + **FECHA ESTIMADA** de entrega. | Nada de 4-72/DHL/outsourcing inicial. Shipping Options nativos, ETA mostrada en checkout y PDP. |
| **D3** | **Perfil con estado de pedido + fecha de envío.** En `/cuenta` el cliente ve el ESTADO de su pedido y la FECHA estimada de entrega (hoy es placeholder). | Requiere endpoint `GET /store/customers/me/orders` consumido por la página de cuenta. |
| **D4** | **Salesforce NO urge.** Solo dejar la COSTURA (webhooks/API) para integrarlo luego. Foco 100% en e-commerce. | El subscriber `customer-created.ts` ya emite webhook genérico (`NEW_CUSTOMER_WEBHOOK_URL`). No se construye CRM ahora. |
| **D5** | **Webhooks y APIs públicas/privadas: superficie definida.** Store API pública (storefront), Admin API privada (gestión), rutas custom y autenticación explícitas. | Ver §7 (RF) y §8 (RNF seguridad); detalle en `02-TRD.md` §"Superficie de API". |

Decisiones técnicas heredadas que también son vinculantes (de `COMPETITOR_ANALYSIS.md` / memoria del proyecto): precios en **unidades mayores de HNL** (`amount` 24999 = `L 24,999`, **nunca centavos**); **publishable key enlazada al Sales Channel HN**; backend separado en repo propio; Supabase **Session pooler 5432** (no Transaction 6543); imágenes externas verbatim al inicio; **todo Medusa v2** (no v1/plugins).

---

## 1. Visión y resumen ejecutivo

### 1.1 Visión

> **smartime es EL especialista Apple de Honduras: la experiencia de compra de tecnología más rápida, confiable y financiable del país.**

Ganamos a los líderes locales (La Curacao, Jetstereo) y a los gigantes globales (Amazon, Walmart, eBay, Back Market) atacando exactamente donde fallan en el mercado hondureño:

1. **Velocidad** — Next.js 16 RSC + streaming, LCP < 2.5 s en gama media sobre 4G, frente al Magento Luma pesado de La Curacao y la home de ~838 KB de Jetstereo.
2. **Confianza** — reseñas **verificadas por compra real** (atadas a órdenes Medusa), gap de TODOS los competidores locales.
3. **Financiamiento visible** — `CuotaBadge` "desde L X/mes" en **cada tarjeta y PDP** (La Curacao tiene cuotas 0% pero las esconde; nosotros las exhibimos).
4. **Logística local** — retiro en Tegucigalpa/SPS, envío 24-48 h con **fecha estimada**, WhatsApp, todo en Lempiras **sin sorpresas de aduana**.

### 1.2 Resumen ejecutivo

smartime es un storefront headless (Next.js 16) sobre Medusa v2, con ~26 productos en 8 categorías (Apple como ancla + electrodomésticos, audio, TV/video, gaming, smart home, tablets/wearables). Ya están construidos y funcionando: catálogo, búsqueda con facetas y autocomplete, carrito server-side de Medusa, autenticación de clientes, reseñas verificadas, utilidades de financiamiento + `CuotaBadge`, wishlist parcial (localStorage) y el rediseño de home ("Back Market en azul").

El **MVP (P0)** cierra el ciclo de compra de punta a punta: **checkout con cuenta obligatoria + pago PayPal**, **envíos nativos con zonas HN + retiro en tienda + fecha estimada (ETA)**, **estado de pedido en el perfil**, consolidación de **reseñas verificadas** y **`CuotaBadge` en todo el catálogo/PDP**. P1 añade competencia directa (WhatsApp con deep links, pagos locales HN, autocomplete/facetas Apple, trust band + schema.org). P2 añade retención y AOV (wishlist completa + alertas de precio, cross-sell curado, comparador, estado de orden enriquecido).

La North Star: **conversión 3.5 % → 4.5 %** con AOV L 22k → L 26k y LCP < 2.5 s, apalancando cuota visible (convierte), reseñas (confianza), velocidad (retención), foco Apple (posicionamiento) y logística local (cierra la venta).

---

## 2. Problema y oportunidad (mercado Honduras)

### 2.1 El problema del comprador hondureño de tecnología premium

| Problema | Evidencia / origen | Coste para el cliente |
|---|---|---|
| **Las cuotas mensuales están escondidas** | La Curacao tiene 0% BAC 3-6-9-12 pero **no las muestra en tarjetas ni PDP**; solo aparecen en checkout/políticas | El cliente de alto ticket no sabe que un MacBook "cabe en su presupuesto" hasta el final → abandona |
| **Cero confianza social on-site** | La Curacao: **sin reseñas**; Jetstereo: ratings nativos pero infrautilizados, muchos productos con 0 reseñas | Miedo a comprar caro sin opiniones reales → fuga a WhatsApp o a la tienda física |
| **Experiencia lenta en móvil** | La Curacao = Magento Luma (JS pesado, CWV flojos); Jetstereo home ~838 KB | Abandono por latencia; cada 100 ms de LCP ≈ -1.11 % conversión (estudio eBay/Deloitte) |
| **Sorpresas de precio y aduana en gigantes** | Amazon/eBay en USD, import charges, casillero/forwarder; La Curacao cobra **USD 1** de "verificación" con tarjeta | Desconfianza, precio final impredecible |
| **Logística opaca** | ETA poco clara; el comprador no sabe cuándo llega ni si puede retirar | Inseguridad antes de pagar |

### 2.2 La oportunidad

- **Foco Apple-puro como ventaja estructural:** todos los competidores son generalistas ruidosos. Un catálogo curado permite PDP premium estilo apple.com, comparadores específicos y autoridad de categoría que ningún generalista iguala.
- **Stack moderno como arma:** headless Next.js 16 + Medusa v2 permite iterar más rápido que Magento legacy o stacks propietarios monolíticos, y exhibir velocidad medible como diferenciador.
- **Huecos explotables y baratos:** mostrar la cuota (gap de La Curacao), reseñas verificadas (gap de todos), velocidad (gap de ambos líderes), transparencia total en Lempiras (gap de los globales), WhatsApp + retiro local (esperado en HN, bajo esfuerzo).

### 2.3 Tamaño y contexto (supuestos de mercado)

- Honduras tiene una clase media urbana (Tegucigalpa, San Pedro Sula) con apetito por tecnología premium financiada. El financiamiento 0% con tarjeta bancaria local (BAC, Ficohsa, Atlántida, Banpaís) es el **driver #1 de conversión en tickets altos**.
- WhatsApp es canal de venta y soporte de facto en HN.
- Supuesto de conversión base de la industria e-commerce: ~2-3 %; meta smartime 4.5 % por foco + confianza + financiamiento visible (ver §9).

---

## 3. Objetivos y no-objetivos (medibles)

### 3.1 Objetivos (SMART)

| ID | Objetivo | Métrica | Línea base | Meta | Horizonte |
|---|---|---|---|---|---|
| O1 | Cerrar el ciclo de compra | % de carritos que completan pago | 0 % (checkout placeholder) | Checkout PayPal funcional end-to-end | Fin de P0 |
| O2 | Conversión | Conversion Rate (sesiones → pedido pagado) | 3.5 % (asumida pre-launch) | **4.5 %** (+15 % vs La Curacao) | 3 meses post-launch |
| O3 | Ticket medio | AOV | L 22,000 | **L 26,000** (cross-sell) | 6 meses post-launch |
| O4 | Abandono de carrito | Cart abandonment | ~70 % (industria) | **< 45 %** | 3 meses post-launch |
| O5 | Velocidad | LCP móvil 4G (p75) | — | **< 2.5 s** | Fin de P0 (y sostenido) |
| O6 | Prueba social | Nº de reseñas verificadas (4.6★ prom.) | demos seed | **200+** reseñas reales | 3 meses post-launch |
| O7 | Adopción de financiamiento | % de pedidos con financiamiento en tickets > L 15k | 0 % | **35 %** | 6 meses post-launch |
| O8 | Recompra | Repeat purchase rate | ~5 % (industria) | **12 %** | 12 meses post-launch |
| O9 | Transparencia logística | % de pedidos con ETA mostrada antes de pagar | 0 % | **100 %** | Fin de P0 |

### 3.2 No-objetivos (explícitos para esta etapa)

- **NO** construir CRM/Salesforce (solo costura webhook — D4).
- **NO** guest checkout (D1: cuenta obligatoria).
- **NO** marketplace multi-vendedor (catálogo 1P propio).
- **NO** logística outsourced (D2: fulfillment nativo).
- **NO** app nativa iOS/Android en P0-P2 (web responsive primero; PWA en backlog).
- **NO** crédito propio tipo Solvenza/La Curacao Cash (financiamiento = cuotas 0% con tarjeta bancaria participante; BNPL/convenio bancario es futuro).
- **NO** internacionalización multi-país/multi-moneda (solo HN / HNL).

---

## 4. Personas / segmentos

(Derivadas de `COMPETITOR_ANALYSIS.md` y del contexto HN.)

| # | Persona | % aprox. | Perfil | Necesidad clave | Cómo smartime la atiende |
|---|---|---|---|---|---|
| **P1** | **Early Adopter Tech-Premium** | 15 % | Tegus/SPS, ingreso > L 30k/mes, compra el último iPhone/Mac, valora velocidad y confianza | Experiencia rápida, premium, sin fricción | RSC < 2.5 s LCP, PDP estilo apple.com, checkout limpio, reseñas verificadas |
| **P2** | **Comprador Alto Ticket Financiado** | 35 % | WhatsApp-heavy, maximiza plazos (3/6/12 meses 0%), decide por la cuota | Ver "cuánto pago al mes" desde el primer vistazo | `CuotaBadge` "desde L X/mes" en card + modal de cuotas en PDP, WhatsApp |
| **P3** | **Gamer / Enthusiast** | 20 % | Compara specs, busca consolas/audio/periféricos | Specs claras y comparación | Facetas por categoría/marca, PDP detallada, comparador (P2) |
| **P4** | **Regalista** | 20 % | Compra rápido para un evento, no técnico | Checkout rápido y entrega con fecha clara | Checkout corto, ETA visible, retiro express, envío con fecha |
| **P5** | **Recurrente** | 10 % | Vuelve por accesorios, valora wishlist | Recompra fácil, guardar deseos | Wishlist (P2), cross-sell AppleCare/fundas/AirPods, cuenta con historial |

**Persona interna — Operador/Admin (no-cliente):** gestiona catálogo, modera reseñas, configura envíos y cambia estado de pedidos vía dashboard de Medusa. Sus necesidades se cubren con Admin API/dashboard (ver §7.12 y `02-TRD.md`).

---

## 5. Panorama competitivo y propuesta de valor diferencial

### 5.1 Matriz competitiva (resumen — detalle en `../COMPETITOR_ANALYSIS.md`)

| Dimensión | Quién gana hoy | Jugada de smartime |
|---|---|---|
| **Cuota mensual visible** | Jetstereo (Solvenza); Amazon/Back Market en PDP | **Mostrar "desde L X/mes" en CADA tarjeta y PDP** — La Curacao la esconde |
| **Reseñas / prueba social** | Amazon (oro), Back Market | **Reseñas verificadas por compra real** — gap de todos los locales |
| **Velocidad / CWV móvil** | smartime (potencial) | **LCP < 2.5 s** con Next.js 16 RSC, medible y promocionable |
| **Logística local** | Jetstereo (retiro 90 min), La Curacao | Retiro Tegus/SPS + envío 24-48 h **con fecha** + envío gratis sobre monto |
| **Pago localizado** | La Curacao / Jetstereo | PayPal (P0) + tarjeta local/transferencia/cuotas BAC (P1), **sin cargos ocultos** (vs USD 1) |
| **Buy box / PDP** | Amazon (referencia) | Buy box mejorado: swatches, urgencia honesta, entrega por ciudad, financiamiento inline |
| **Foco / curaduría** | **smartime** (ventaja estructural) | Apple-puro = claridad, autoridad, comparadores, estética premium |
| **Confianza operacionalizada** | Back Market / Walmart | Trust band con garantía, producto sellado, devolución, WhatsApp |
| **Canal WhatsApp** | Jetstereo / La Curacao | Botón flotante + deep link `wa.me` contextual |

### 5.2 Propuesta de valor diferencial (los 4 pilares)

1. **Cuota visible → convierte.** El componente `CuotaBadge` (utilidades en `src/utilities/financing.ts`, `MIN_FINANCING_AMOUNT = 3000`, planes 3/6/12 meses 0%) hace explícito el "desde L X/mes" donde la competencia lo oculta.
2. **Reseñas verificadas → dan confianza.** Backend marca `verified = true` + `status = approved` solo si el cliente compró el producto (validación contra órdenes en `POST /store/reviews`).
3. **Velocidad → retiene.** Arquitectura RSC, imágenes optimizadas, streaming; presupuesto de performance estricto (§8).
4. **Logística local + transparencia → cierra la venta.** Fulfillment nativo HN, retiro, ETA, todo en Lempiras sin sorpresas.

---

## 6. Alcance por fases

> Tres fases. **MVP = P0** (lanzamiento). P1 = competencia directa. P2 = retención/AOV. Detalle de ejecución, dependencias y estimaciones en **`06-implementation-plan.md`**.

### 6.1 P0 — MVP (imprescindible para lanzar)

| Épica P0 | Descripción | Decisión bloqueada que cumple |
|---|---|---|
| **P0.1 Checkout con cuenta obligatoria + PayPal** | Gate de autenticación → dirección de envío → método de envío (con ETA) → pago PayPal → confirmación. Guard backend ya exige `authenticate("customer")`. | **D1** |
| **P0.2 Envíos nativos Medusa + ETA** | Stock locations (Tegus/SPS), Shipping Profiles, Shipping Options: retiro en tienda (L 0) + envío por zona HN, con **fecha estimada** calculada y mostrada. | **D2** |
| **P0.3 Estado de pedido en el perfil** | `/cuenta` muestra lista de pedidos con estado (pago/fulfillment) y **fecha estimada de entrega**. Endpoint `GET /store/customers/me/orders`. | **D3** |
| **P0.4 Reseñas verificadas (consolidación)** | Ya funciona; en P0 se asegura cobertura en card/PDP, schema.org `AggregateRating`, y flujo de creación post-compra desde `/cuenta`. | — |
| **P0.5 `CuotaBadge` en catálogo + PDP** | Ya construido; en P0 se garantiza presencia en `ProductCard` (compact) y PDP (full + modal de tabla de cuotas). | — |
| **P0.6 Superficie de API/webhooks definida** | Documentar y endurecer Store API pública vs Admin privada; mantener costura webhook de cliente. | **D5** (parcial), **D4** |

**Criterio de salida P0:** un cliente puede registrarse, agregar al carrito, autenticarse, elegir envío con fecha, pagar con PayPal, recibir confirmación y ver el estado + ETA de su pedido en `/cuenta`. LCP < 2.5 s. (Ver `06-implementation-plan.md`.)

### 6.2 P1 — Competencia directa (post-launch)

| Épica P1 | Descripción |
|---|---|
| **P1.1 WhatsApp flotante + deep links contextuales** | `wa.me/<num>?text=` con contexto de producto/carrito (`NEXT_PUBLIC_WHATSAPP_NUMBER`). |
| **P1.2 Pagos locales HN** | 2º Payment Provider (POS virtual 3DS), transferencia (confirmación admin), cuotas 0% BAC. **Sin cargos ocultos.** |
| **P1.3 Autocomplete + facetas Apple** | Facetas modelo/chip/almacenamiento/color además de marca/categoría/precio/oferta. |
| **P1.4 Trust band global + schema.org** | Garantía, sellado, devolución, pago seguro, WhatsApp; JSON-LD Product/Offer/AggregateRating/Breadcrumb/Organization. |
| **P1.5 Envío gratis sobre monto + retiro express comunicado** | Promotion Module + mensajería de retiro Tegus/SPS. |

### 6.3 P2 — Retención y AOV

| Épica P2 | Descripción |
|---|---|
| **P2.1 Wishlist completa + alertas de bajada de precio** | Migrar de localStorage a módulo Medusa (Customer↔Product); página `/favoritos` + link en header; job de alertas. |
| **P2.2 Cross-sell curado** | "Comprados juntos" (AppleCare/fundas/AirPods/cables) + "add-all". "Vistos recientemente" (cookies). |
| **P2.3 Comparador** | `/comparar?ids=…` Mac-vs-Mac / iPhone-vs-iPhone con specs. |
| **P2.4 Estado de orden enriquecido + presales** | Tracking detallado; presales de lanzamientos con captura de email. |

---

## 7. Requisitos funcionales (historias de usuario + criterios de aceptación Gherkin)

> Convención: cada RF tiene **ID**, **fase**, **persona**, **historia** y **criterios de aceptación** en Gherkin (Dado/Cuando/Entonces) en español. Las rutas y componentes citados son reales (ver mapa en la memoria del proyecto). El comportamiento técnico se detalla en `02-TRD.md`; el visual en `03-UXUI-system.md`; los flujos en `04-app-flow.md`.

### 7.1 Catálogo y búsqueda

**RF-CAT-01 — Listado de tienda con facetas** · *P0 (existe), P1 mejora* · P3/P1
> *Como* comprador, *quiero* filtrar el catálogo por marca, categoría, rango de precio y "en oferta" *para* encontrar rápido lo que busco.

```gherkin
Dado que estoy en /tienda con al menos un producto publicado
Cuando aplico el filtro "marca = Apple" y "categoría = Tablets y wearables"
Entonces la grilla muestra solo productos que cumplen ambos filtros
  Y la URL conserva los filtros en searchParams (compartible/recargable)
  Y cada tarjeta muestra precio en HNL (L 32,999), descuento si aplica, rating y CuotaBadge compact

Dado que selecciono "orden = precio ascendente"
Cuando se recarga el listado
Entonces los productos se ordenan de menor a mayor precio en el servidor
```

**RF-CAT-02 — Autocomplete de búsqueda** · *P0 (existe), P1 facetas Apple* · todas
> *Como* comprador, *quiero* sugerencias mientras escribo *para* llegar al producto en pocos caracteres.

```gherkin
Dado que escribo "macbook" en la barra de búsqueda
Cuando han pasado 250 ms desde mi última tecla (debounce)
Entonces veo hasta 6 sugerencias con thumbnail, título y categoría
  Y al hacer clic en una sugerencia navego a su PDP
  Y al navegar el dropdown se cierra

Dado que escribo un término sin resultados
Entonces se muestra un estado vacío claro (sin error)
```

**RF-CAT-03 — Categorías y home** · *P0 (existe)* · todas
```gherkin
Dado que entro a la home /
Entonces veo HeroCarousel, carruseles por categoría, BrandStrip y TrustBand
  Y cada CategoryTile que muestro tiene count > 0 (no se muestran categorías vacías)
```

### 7.2 PDP / Buy box

**RF-PDP-01 — Página de producto** · *P0 (existe)* · todas
> *Como* comprador, *quiero* ver fotos, precio, financiamiento, stock, envío y reseñas en una sola página *para* decidir.

```gherkin
Dado que abro /producto/{slug} de un producto publicado
Entonces veo galería, título (h1), rating y enlace a #reviews
  Y veo el precio en HNL y, si hay compare_at_price, el % de descuento y el ahorro
  Y veo el CuotaBadge full con "desde L X/mes" si el precio ≥ L 3,000
  Y veo badges de stock, envío y retiro
  Y veo AddToCart y BuyNowButton
  Y los datos estructurados JSON-LD Product + AggregateRating están presentes

Dado un producto con precio < L 3,000
Entonces NO se muestra CuotaBadge (no califica para financiamiento)
```

> **Gap conocido (MED) — `brand` del JSON-LD hardcodeada:** hoy el JSON-LD Product+Offer+AggregateRating de la PDP (`src/app/(frontend)/producto/[slug]/page.tsx`) fija `brand: { "@type": "Brand", name: "Apple" }` para **todos** los productos; para no-Apple (Samsung, LG, Sony…) el schema.org es incorrecto. Debe leerse de `ViewProduct.brand` / `metadata.brand`. Corregirlo es parte de consolidar schema.org (cruzar a `06-implementation-plan.md`; ver también RNF-SEO-02).

**RF-PDP-02 — Modal de tabla de cuotas** · *P0 (existe)* · P2
```gherkin
Dado que estoy en una PDP con financiamiento disponible
Cuando abro el modal de cuotas del CuotaBadge
Entonces veo una tabla con los planes 3, 6 y 12 meses (0% interés)
  Y para cada plan la cuota mensual = precio / meses
  Y un disclaimer de "cuotas 0% con tarjetas participantes"
```

**RF-PDP-03 — Buy box mejorado** · *P0.4* · P1/P2
> *Como* comprador de alto ticket, *quiero* swatches, urgencia honesta y entrega por ciudad *para* confiar en la compra.

```gherkin
Dado un producto con varias variantes (p. ej. color/almacenamiento)
Cuando selecciono una variante
Entonces el precio, el CuotaBadge y la disponibilidad se actualizan a esa variante
  Y el stock se muestra como estado ("En stock" / "Últimas unidades" / "Agotado"),
     NUNCA como número crudo de inventario (evitamos el error de Jetstereo)

Dado que indico mi ciudad (Tegucigalpa / SPS / resto)
Entonces el buy box muestra la fecha estimada de entrega para esa ciudad
  Y la ciudad se recuerda (cookie) entre páginas
```

> **Gap conocido (estado de stock):** el estado dinámico por variante depende de leer inventario real; hoy `toViewProduct` (`src/lib/medusa/data.ts`) fija `inStock: true`, por lo que el ESTADO de stock variable está **pendiente** y asignado a **Fase 2/3** (ver RNF-SEC-07).

### 7.3 Carrito

**RF-CAR-01 — Carrito server-side de Medusa** · *P0 (existe)* · todas
> *Como* comprador, *quiero* un carrito persistente *para* no perder mi selección.

```gherkin
Dado que agrego un producto con AddToCart
Entonces se crea/usa un cart de Medusa cuyo id vive en localStorage (smartime_medusa_cart_id)
  Y el contador del header y el total formateado (HNL) se actualizan

Dado que estoy en /carrito
Cuando cambio la cantidad de un ítem con +/- o lo elimino
Entonces el subtotal se recalcula
  Y el envío se muestra como "se calcula en checkout" (placeholder hasta P0.2)

Dado un carrito con al menos un ítem
Cuando pulso "Tramitar pedido"
Entonces navego a /checkout
```

### 7.4 Registro / Login

**RF-AUTH-01 — Registro de cliente** · *P0 (existe)* · todas
> *Como* visitante, *quiero* crear una cuenta con correo y contraseña *para* poder comprar (D1).

```gherkin
Dado que estoy en /registro
Cuando envío nombre, correo y contraseña válidos
Entonces se registra el cliente en Medusa (auth emailpass) y se crea el customer
  Y quedo autenticado automáticamente
  Y soy redirigido a ?redirect o a /cuenta

Dado un correo ya registrado
Entonces veo un mensaje de error claro y no se duplica la cuenta
```

**RF-AUTH-02 — Login de cliente** · *P0 (existe)* · todas
```gherkin
Dado que estoy en /login
Cuando envío credenciales correctas
Entonces inicio sesión (medusa.auth.login customer/emailpass)
  Y soy redirigido a ?redirect (p. ej. /checkout) o a /cuenta

Dado credenciales incorrectas
Entonces veo un mensaje de error y permanezco en /login
```

### 7.5 Checkout (cuenta OBLIGATORIA — D1)

**RF-CHK-01 — Gate de autenticación en checkout** · *P0.1* · todas
> *Como* negocio, *quiero* exigir cuenta antes de pagar *para* cumplir D1 (sin invitado) y habilitar reseñas verificadas y seguimiento de pedido.

```gherkin
Dado un visitante NO autenticado con ítems en el carrito
Cuando intenta entrar a /checkout
Entonces es redirigido a /login?redirect=/checkout (o se le ofrece /registro)
  Y tras autenticarse vuelve a /checkout con su carrito intacto

Dado un cliente autenticado
Cuando entra a /checkout
Entonces ve el flujo de envío y pago (no se le pide invitado en ningún punto)
```

**RF-CHK-02 — Datos de envío y selección de método** · *P0.1 + P0.2* · todas
```gherkin
Dado un cliente autenticado en /checkout con carrito no vacío
Cuando completa/elige una dirección de envío en Honduras
Entonces puede elegir entre: "Retiro en tienda" (Tegus/SPS, L 0) o envío a domicilio por zona
  Y para cada opción se muestra la TARIFA y la FECHA ESTIMADA de entrega
  Y el resumen muestra subtotal, envío, impuestos (si aplican) y total en HNL

Dado que el carrito está vacío
Cuando entro a /checkout
Entonces veo "No hay nada que pagar" y un enlace a /tienda
```

**RF-CHK-03 — Completar el pedido (guard de backend)** · *P0.1* · todas
```gherkin
Dado un cliente autenticado con dirección y método de envío seleccionados y pago autorizado
Cuando se ejecuta POST /store/carts/:id/complete
Entonces el backend exige authenticate("customer") (session o bearer); si no, rechaza
  Y al completar, el carrito se convierte en un pedido (order) asociado al customer
  Y el cliente ve la página de confirmación con el número de pedido y la ETA
```

### 7.6 Pago PayPal

**RF-PAY-01 — Pago con PayPal** · *P0.1* · todas
> *Como* comprador, *quiero* pagar con PayPal en Lempiras *para* completar mi compra de forma segura y sin cargos ocultos.

```gherkin
Dado un cliente en el paso de pago de /checkout con un total en HNL
Cuando elige PayPal y autoriza el pago en el flujo de PayPal
Entonces se crea/actualiza la payment collection del carrito vía el Payment Module de Medusa (provider PayPal)
  Y al autorizarse, se captura el pago y se completa el pedido
  Y NO se aplica ningún cargo extra de "verificación" (a diferencia del USD 1 de La Curacao)

Dado que el pago de PayPal falla o se cancela
Entonces el carrito permanece intacto, se muestra un mensaje claro y puedo reintentar
  Y NO se crea un pedido pagado
```

> **Nota técnica (ver `02-TRD.md`):** PayPal se integra como Payment Provider del Payment Module de Medusa v2. El total se expresa en HNL en unidades mayores; la conversión de moneda hacia PayPal (si PayPal no liquida en HNL) se documenta en el TRD como decisión abierta con recomendación.

### 7.7 Envío (zonas / retiro / ETA) — Fulfillment nativo (D2)

**RF-SHIP-01 — Zonas y tarifas de Honduras** · *P0.2* · todas
> *Como* negocio, *quiero* zonas y tarifas manuales HN *para* cobrar el envío correcto sin outsourcing.

```gherkin
Dado el catálogo de Shipping Options configurado
Cuando un cliente con dirección en Tegucigalpa llega a checkout
Entonces ve la tarifa de su zona y la fecha estimada correspondiente
  Y un cliente en "resto del país" ve su propia tarifa y ETA (mayor)
```

**RF-SHIP-02 — Retiro en tienda** · *P0.2* · P4
```gherkin
Dado que el cliente elige "Retiro en tienda" (Tegus o SPS)
Entonces el costo de envío es L 0
  Y se muestra la dirección del punto de retiro y la fecha/horario estimado de disponibilidad
  Y el pedido se marca como "para retiro" en su estado
```

**RF-SHIP-03 — Fecha estimada de entrega (ETA)** · *P0.2* · todas
```gherkin
Dado cualquier método de envío seleccionado
Cuando el cliente revisa el resumen antes de pagar
Entonces SIEMPRE ve una fecha estimada de entrega/disponibilidad (objetivo O9 = 100%)
  Y esa misma ETA aparece luego en /cuenta para el pedido (RF-ORD-02)
```

**RF-SHIP-04 — Envío gratis sobre monto** · *P1.5* · P2/P4
```gherkin
Dado que el subtotal supera el umbral de envío gratis (p. ej. L 25,000)
Cuando el cliente llega a la selección de envío
Entonces la opción de envío a domicilio elegible muestra "Gratis" (Promotion Module)
```

### 7.8 Pedidos + estado en el perfil (D3)

**RF-ORD-01 — Lista de pedidos del cliente** · *P0.3* · P1/P4/P5
> *Como* cliente, *quiero* ver mis pedidos *para* saber qué compré y su estado.

```gherkin
Dado un cliente autenticado en /cuenta
Cuando se carga la sección "Mis pedidos"
Entonces se consume GET /store/customers/me/orders
  Y veo cada pedido con número, fecha, total (HNL) y miniaturas de productos
  Y si no tengo pedidos, veo un estado vacío con enlace a /tienda
```

**RF-ORD-02 — Estado y fecha de entrega** · *P0.3* · todas
```gherkin
Dado un pedido en "Mis pedidos"
Entonces veo su estado de pago (p. ej. pagado) y de fulfillment (en preparación / enviado / listo para retiro / entregado)
  Y veo la FECHA ESTIMADA de entrega o de disponibilidad para retiro
  Y si fue actualizado por el admin, el estado reflejado está al día
```

> El cambio de estado lo realiza el operador desde el dashboard de Medusa (Admin); el storefront es de solo lectura sobre el estado.

### 7.9 Reseñas (verificadas por compra real)

**RF-REV-01 — Crear reseña verificada** · *P0.4* · P1/P5
> *Como* cliente que compró un producto, *quiero* dejar una reseña *para* ayudar a otros y ganar confianza.

```gherkin
Dado un cliente autenticado que tiene un pedido completado con el producto X
Cuando envía POST /store/reviews con rating (1-5) y contenido
Entonces el backend verifica contra sus órdenes que compró X
  Y si lo compró, marca verified = true y status = approved (aparece de inmediato)
  Y si NO lo compró, queda status = pending (moderación manual del admin)

Dado un visitante NO autenticado
Cuando intenta POST /store/reviews
Entonces el backend lo rechaza (authenticate customer requerido)
```

**RF-REV-02 — Mostrar reseñas y resumen** · *P0.4 (existe)* · todas
```gherkin
Dado que abro la PDP de un producto con reseñas aprobadas
Entonces veo ReviewsSection con las reseñas approved ordenadas por fecha desc
  Y el promedio (1 decimal) y el conteo
  Y en /tienda cada tarjeta muestra el rating agregado desde /store/review-summary
```

### 7.10 Wishlist

**RF-WL-01 — Guardar deseos (localStorage hoy)** · *P0 (parcial), P2 completa* · P5
> *Como* comprador, *quiero* guardar productos *para* comprarlos después.

```gherkin
Dado que pulso el WishlistButton en una tarjeta o PDP
Entonces el producto se añade/quita de la wishlist en localStorage (smartime_wishlist)
  Y el ícono refleja el estado (guardado / no guardado)

# P2 (objetivo):
Dado un cliente autenticado con wishlist
Entonces su wishlist persiste en el servidor (módulo Medusa Customer↔Product)
  Y existe una página /favoritos enlazada desde el header
  Y puede recibir alertas de bajada de precio
```

### 7.11 WhatsApp

**RF-WA-01 — Botón flotante + deep link contextual** · *P0 (botón existe), P1 deep links* · P2/P4
> *Como* comprador hondureño, *quiero* consultar por WhatsApp *para* resolver dudas antes de comprar.

```gherkin
Dado que NEXT_PUBLIC_WHATSAPP_NUMBER está configurado
Cuando veo cualquier página
Entonces hay un FloatingWhatsApp visible

# P1 (objetivo):
Dado que estoy en una PDP
Cuando pulso WhatsApp
Entonces se abre wa.me/<num> con un texto pre-rellenado que incluye el producto y su enlace
```

### 7.12 Gestión (Admin) y superficie de API/webhooks (D4, D5)

**RF-ADM-01 — Moderación de reseñas** · *P0.6 / backlog admin* · Operador
```gherkin
Dado una reseña con status = pending
Cuando el operador la aprueba o rechaza (Admin API / dashboard)
Entonces su status cambia a approved/rejected
  Y solo las approved se muestran en el storefront
```

**RF-ADM-02 — Cambio de estado de pedido** · *P0.3 (dependencia)* · Operador
```gherkin
Dado un pedido pagado
Cuando el operador actualiza fulfillment a "enviado" o "listo para retiro" en el dashboard
Entonces el cliente ve ese estado actualizado en /cuenta (RF-ORD-02)
```

**RF-API-01 — Superficie de API y autenticación (D5)** · *P0.6* · Sistema
```gherkin
Dado el storefront (cliente público)
Entonces solo usa la Store API pública con publishable key enlazada al Sales Channel HN
  Y las operaciones sensibles (completar carrito, crear reseña) exigen authenticate("customer")
  Y la Admin API queda restringida a operadores (no expuesta al storefront)
  Y CORS está configurado sin comodín (STORE_CORS/ADMIN_CORS/AUTH_CORS explícitos)
```

**RF-WH-01 — Costura de webhook de cliente (D4)** · *P0.6 (existe)* · Sistema
```gherkin
Dado que NEW_CUSTOMER_WEBHOOK_URL está configurado
Cuando se emite el evento customer.created
Entonces el subscriber registra en log y hace POST del payload (compatible Slack/Discord/Zapier)
  Y si la variable NO está configurada, solo registra en log (sin fallo)
```

---

## 8. Requisitos no funcionales (RNF)

### 8.1 Rendimiento

| ID | Requisito | Meta |
|---|---|---|
| RNF-PERF-01 | LCP móvil 4G (p75) | **< 2.5 s** (O5) |
| RNF-PERF-02 | Render dinámico de home y PDP | RSC + `force-dynamic` donde aplica; streaming |
| RNF-PERF-03 | Imágenes | Optimización (AVIF/WebP donde sea posible), `fetchpriority` en hero; remotePatterns explícitos |
| RNF-PERF-04 | Datos | `getRegionId`/`listProducts`/`listCategories` cacheados con `React.cache()` |
| RNF-PERF-05 | Peso de la home | Objetivo muy por debajo de los ~838 KB de Jetstereo |

### 8.2 Seguridad (D5)

| ID | Requisito |
|---|---|
| RNF-SEC-01 | Solo variables `NEXT_PUBLIC_*` en el frontend; **ningún secreto** en el cliente |
| RNF-SEC-02 | Cabeceras de seguridad en `next.config.ts` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS) |
| RNF-SEC-03 | CORS sin comodín en backend; `STORE_CORS`/`ADMIN_CORS`/`AUTH_CORS` explícitos |
| RNF-SEC-04 | TLS a Supabase con CA verificable (`DATABASE_CA_CERT`); Session pooler 5432 |
| RNF-SEC-05 | Guards: `authenticate("customer")` en `POST /store/carts/:id/complete` y `POST /store/reviews` |
| RNF-SEC-06 | Rate limiting en rutas públicas sensibles (p. ej. `POST /store/reviews`) — *gap conocido, ver TRD* |
| RNF-SEC-07 | No exponer inventario crudo en payloads del storefront (mapear a estados en el servidor). **Hoy se cumple solo el "no exponer cantidad cruda":** el ESTADO de stock variable está **pendiente** — `toViewProduct` en `src/lib/medusa/data.ts` fija `inStock: true` hardcodeado. Leer el inventario real y derivar el estado ("En stock"/"Últimas unidades"/"Agotado") queda asignado a **Fase 2/3** (cruzar a `06-implementation-plan.md`) |

### 8.3 Accesibilidad

| ID | Requisito |
|---|---|
| RNF-A11Y-01 | Objetivo **WCAG 2.1 AA**: contraste de texto, foco visible, navegación por teclado |
| RNF-A11Y-02 | Componentes shadcn/ui con roles/aria correctos; modales (cuotas) atrapan foco y cierran con Esc |
| RNF-A11Y-03 | Imágenes de producto con `alt` significativo; estados de stock comunicados por texto, no solo color |
| RNF-A11Y-04 | Formularios (login/registro/checkout) con labels asociados y mensajes de error accesibles |

### 8.4 i18n / localización (es-HN / HNL)

| ID | Requisito |
|---|---|
| RNF-I18N-01 | Todo el contenido en **español de Honduras**; tono claro y directo |
| RNF-I18N-02 | Precios con `Intl.NumberFormat('es-HN', { currency: 'HNL', minimumFractionDigits: 0 })` → `L 32,999` |
| RNF-I18N-03 | Precios en **unidades mayores** (24999 = L 24,999, nunca centavos) |
| RNF-I18N-04 | Fechas (ETA, pedido) en formato local es-HN |

### 8.5 SEO

| ID | Requisito |
|---|---|
| RNF-SEO-01 | OpenGraph/Twitter por página (`mergeOpenGraph`) |
| RNF-SEO-02 | JSON-LD Product + AggregateRating en PDP (P0); Organization/Breadcrumb/Offer (P1). **Gap conocido:** la `brand` del JSON-LD hoy está hardcodeada a `"Apple"` para todos los productos; debe leerse de `metadata.brand` (parte de consolidar schema.org — ver RF-PDP-01) |
| RNF-SEO-03 | `sitemap.xml` dinámico (Next.js 16) — *gap conocido, P1* |
| RNF-SEO-04 | URLs semánticas (`/producto/{slug}`, `/tienda?categoria=…`) |

### 8.6 Observabilidad y fiabilidad (RNF de soporte)

| ID | Requisito |
|---|---|
| RNF-OBS-01 | Logs de backend al menos en stdout; objetivo futuro: observabilidad centralizada (Sentry/Datadog) — *gap conocido* |
| RNF-OBS-02 | Estado de módulos en producción persistente (no in-memory para datos críticos) — registrar Redis donde aplique |

---

## 9. Métricas y North Star

### 9.1 North Star

> **CR de pedido pagado** como métrica norte (proxy del valor entregado), sostenida con **LCP < 2.5 s** y **NPS/confianza** vía reseñas. Meta: **4.5 %** (+15 % sobre la línea base de La Curacao asumida).

### 9.2 KPIs y árbol de métricas

| Categoría | KPI | Meta | Fuente |
|---|---|---|---|
| Conversión | Conversion Rate | 4.5 % | Analytics + Order Module |
| Valor | AOV | L 26,000 | Order Module |
| Fricción | Cart abandonment | < 45 % | Cart→Order funnel |
| Velocidad | LCP móvil 4G p75 | < 2.5 s | CWV / RUM |
| Confianza | Reseñas verificadas (4.6★) | 200+ en 3 meses | Review Module |
| Financiamiento | Adopción en > L 15k | 35 % | Order metadata |
| Retención | Repeat purchase | 12 % en 12 meses | Order Module |
| Logística | % pedidos con ETA pre-pago | 100 % | Checkout |

> **Instrumentación analítica (GA4/eventos)** es un **gap conocido** (no hay tracking hoy). Requisito para medir O2-O8 → priorizar en P0/P1 (ver `06-implementation-plan.md`).

---

## 10. Riesgos y supuestos

### 10.1 Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | **Cuenta obligatoria (D1) aumenta el abandono** | Media | Alto | Registro express (1 paso, correo+contraseña), copy que explique el valor (seguimiento + reseñas), login post-carrito con `?redirect`; medir abandono en el gate |
| R2 | **PayPal y liquidación en HNL** (PayPal puede no liquidar en HNL) | Media | Alto | Definir en `02-TRD.md` la moneda de presentación vs liquidación; recomendación: mostrar HNL, liquidar en la moneda soportada con tasa transparente; sin cargos ocultos |
| R3 | **ETA inexacta** erosiona confianza | Media | Medio | ETA conservadora por zona; comunicar rango; permitir retiro como alternativa segura |
| R4 | **Spam de reseñas** (sin rate limiting) | Media | Medio | RNF-SEC-06: rate limit + moderación de pendientes |
| R5 | **Fuga de inventario** si se expone stock crudo | Baja | Alto | RNF-SEC-07: mapear a estados en el servidor (no repetir error de Jetstereo) |
| R6 | **Imágenes externas** (CDNs de terceros) caen o cambian | Media | Medio | remotePatterns; plan futuro de rehospedaje (S3) |
| R7 | **Performance** se degrada al crecer el catálogo | Baja | Medio | Presupuesto de performance, cache RSC, búsqueda escalable (Meilisearch futuro) |
| R8 | **Supabase pooler mal configurado** rompe migraciones/pagos | Baja | Alto | Usar Session pooler 5432 (no 6543); documentado en TRD |

### 10.2 Supuestos

- El backend Medusa, la región HNL y la publishable key enlazada al Sales Channel HN están operativos (cimientos hechos).
- El operador gestiona catálogo, reseñas y estados de pedido desde el dashboard de Medusa.
- El cliente objetivo tiene tarjeta participante (BAC/Ficohsa/Atlántida/Banpaís) o cuenta PayPal.
- Los planes de financiamiento son 0% con tarjeta participante (cálculo informativo hasta integrar provider bancario).
- El umbral de envío gratis (p. ej. L 25,000) y las tarifas por zona son parámetros de negocio configurables.

---

## 11. Fuera de alcance (explícito)

| Tema | Por qué fuera | ¿Dónde vive? |
|---|---|---|
| Guest checkout | Anulado por **D1** | — |
| CRM / Salesforce | **D4**: solo costura webhook | Futuro |
| Crédito propio (tipo Solvenza / La Curacao Cash) | Modelo financiero no contemplado; usamos cuotas 0% con tarjeta | Futuro |
| Marketplace multi-vendedor | Catálogo 1P propio | Fuera |
| Logística outsourced (4-72/DHL) | **D2**: fulfillment nativo | Fuera |
| App nativa iOS/Android | Web responsive primero | Backlog (PWA) |
| Multi-país / multi-moneda | Solo HN / HNL | Fuera |
| Pagos locales HN (POS/transferencia/BAC cuotas) | No en MVP | **P1** |
| Comparador, cross-sell, "vistos recientemente" | No en MVP | **P2** |
| Wishlist persistida en servidor + alertas de precio | localStorage en MVP | **P2** |
| `sitemap.xml`, GA4/analytics, observabilidad centralizada | Gaps conocidos | P0/P1 (instrumentación) |
| Resumen IA de reseñas (estilo Amazon) | No prioritario | Backlog |

---

### Apéndice A — Trazabilidad RF ↔ decisiones bloqueadas

| Decisión | RF que la implementan |
|---|---|
| **D1** (cuenta obligatoria, sin invitado) | RF-AUTH-01, RF-AUTH-02, RF-CHK-01, RF-CHK-03 |
| **D2** (fulfillment nativo + ETA + retiro) | RF-SHIP-01, RF-SHIP-02, RF-SHIP-03, RF-SHIP-04, RF-CHK-02 |
| **D3** (estado + fecha en perfil) | RF-ORD-01, RF-ORD-02, RF-ADM-02 |
| **D4** (Salesforce no urge; costura) | RF-WH-01 |
| **D5** (superficie API/webhooks) | RF-API-01, RF-WH-01, RF-ADM-01 |

### Apéndice B — Glosario rápido

- **CuotaBadge:** componente que muestra "desde L X/mes" (financiamiento 0%, planes 3/6/12, mínimo L 3,000).
- **ETA:** fecha estimada de entrega/disponibilidad de retiro.
- **PDP:** Product Detail Page (`/producto/{slug}`).
- **ViewProduct:** tipo normalizado del storefront (`src/lib/medusa/types.ts`).
- **Sales Channel HN:** canal de ventas al que debe enlazarse la publishable key (sin enlace → listados vacíos).

> Para el *cómo* técnico de cada RF, ver **`02-TRD.md`**. Para el diseño, **`03-UXUI-system.md`**. Para los recorridos, **`04-app-flow.md`**. Para el modelo de datos, **`05-schema-db.md`**. Para la ejecución, **`06-implementation-plan.md`**.
