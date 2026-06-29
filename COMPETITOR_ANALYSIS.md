# Análisis Competitivo — timesmart

> Mega-análisis de 6 referentes de e-commerce para posicionar a **timesmart** (tienda Apple — Mac & iPhone — para Honduras, precios en Lempiras) por encima de toda la competencia.
> Investigación realizada con 7 agentes en paralelo (WebFetch + WebSearch), inspección en vivo donde fue posible y deducción documentada cuando los sitios bloquearon el acceso (Cloudflare/WAF/bot walls).
> Stack de timesmart: **Next.js 16 (App Router, React 19) + Medusa v2 (headless) + Tailwind v4/shadcn + Poppins**, azul/blanco.

---

## 1. Resumen ejecutivo

El panorama se divide en **tres grupos**:

1. **Gigantes globales** (Walmart, Amazon, eBay, Back Market): stacks propietarios masivos y referencia de UX (buy box, financiamiento visible, reviews con resumen IA, recomendaciones). **Pierden en Honduras** por precios en USD, logística/aduana costosa, sin cuotas locales, sin garantía/soporte Apple local y experiencia ruidosa (densidad, "sponsored").
2. **Competidores directos hondureños** (La Curacao Online, Jetstereo): **aquí está la batalla real**. Su arma es el **financiamiento/cuotas** (Solvenza propio de Jetstereo; cuotas BAC 0% + La Curacao Cash), la **omnicanalidad** (retiro en tienda, +100 sucursales, retiro en 90 min) y **WhatsApp** como canal de venta.
3. **Back Market** aporta el patrón de **confianza operacionalizada** (garantía + devolución + envío gratis siempre visibles) y financiamiento en la PDP.

**Tesis ganadora de timesmart:** ser **EL especialista Apple de Honduras**, con la mejor experiencia móvil/velocidad (Next.js 16 RSC vs. Magento Luma), **cuota mensual en Lempiras visible en CADA tarjeta y PDP desde el día 1**, **reviews verificadas atadas a órdenes reales** (gap de TODOS los locales), trust band con garantía Apple/producto sellado, retiro en Tegucigalpa/SPS, WhatsApp integrado y checkout invitado sin fricción ni cargos ocultos. El foco Apple-puro es la ventaja estructural: claridad, autoridad de categoría, comparadores Mac-vs-Mac / iPhone-vs-iPhone y un PDP premium estilo apple.com que ningún generalista puede igualar.

---

## 2. Reportes por competidor

### 2.1 Walmart — `walmart.com`
**Confianza:** Alta en arquitectura/pagos/financiamiento; verificación en vivo limitada por bot wall (PerimeterX/HUMAN).

- **Stack / arquitectura:** Stack propio (no SaaS). Frontend React + TS con **Webpack Module Federation (micro-frontends)**, Redux, SSR en Node; design system propio ("Living Design System"/Glass). Backend de **microservicios por dominio** (Catalog, Search, Cart, Checkout, Promotion, Payment, Inventory, Order, Return), Docker + Kubernetes + Istio. Multi-cloud (Azure + GCP + Walmart Cloud Native Platform).
- **IA / navegación:** Header persistente con modo **"Pickup or delivery?" + código postal** (condiciona catálogo y precios), buscador central, mega-menú "Departments", Walmart+, carrito con monto. Mezcla 1P + 3P (Marketplace) con badge de vendedor.
- **Home:** Hero rotativo con banners específicos ("Up to 25% off computers"), grid de tiles de categoría, carruseles personalizados (Reorder, Recommended), sponsored. Tagline "Save Money. Live better."
- **Búsqueda:** Microservicio dedicado; autocomplete/typeahead; facetas + orden; mezcla 1P/3P/patrocinados (Walmart Connect). Ranking premia rating ≥4.0 y stock multi-tienda.
- **Listados:** Left-rail de facetas (marca, precio, rating, entrega, vendedor), badges (Rollback, Best seller, Sponsored), add-to-cart rápido, fulfillment por ítem, paginación "more" (mejor SEO).
- **PDP:** Buy box, galería (mín. 5 imágenes a sellers), variantes por swatches, fulfillment por ítem, BNPL en electrónica, reviews + Q&A, warranty Allstate, "Customers also bought", urgencia ("Only X left").
- **Carrito / checkout:** Server-side, mini-cart, edición inline, divisiones por fulfillment, **guest checkout** (clave reciente), upsell. Empuja Walmart Pay/OnePay (no Apple/Google Pay).
- **Cuenta / lealtad:** "Reorder / My Items" muy destacado, listas, registries, **Walmart+** (envío gratis, streaming, combustible, Scan & Go), Walmart Cash (cashback).
- **Promos / financiamiento:** Rollback, Clearance, deals por temporada. **BNPL**: histórico Affirm → ahora **Klarna exclusivo vía OnePay** (3–36 meses). Layaway histórico.
- **Confianza:** Reviews extensas + Q&A; **"Free 90-Day Returns"** muy comunicado; badge "sold & shipped by"; marca con enorme reconocimiento.
- **Móvil:** App nativa central (Store Mode, **Scan & Go**, Walmart Pay). Web no PWA.
- **Pagos:** Tarjetas, Walmart Pay/OnePay, gift cards, EBT/SNAP, PayPal en algunos flujos, **BNPL Klarna**. NO Apple/Google Pay.
- **Logística:** Omnicanal profundo (~4700 tiendas como mini-fulfillment): NextDay/2-day, pickup curbside same-day, delivery same-day, Spark Driver propio.
- **Destacado:** Omnicanal real; OnePay (fintech propia con BNPL); personalización por cuenta+ubicación; Walmart+ flywheel; Reorder 1-clic; retail media; micro-frontends.
- **Debilidades:** Densidad visual abrumadora; personalización server-side pesada (LCP); bot wall agresivo; inconsistencia 1P/3P; no Apple/Google Pay; muy atado a EEUU; Apple no luce premium.
- **Lecciones para nosotros:** Financiamiento "desde L X/mes" en PDP y tarjetas; buy box claro con swatches; reviews verificadas; Reorder; devoluciones/garantía ultra-visibles; retiro local; **velocidad como ventaja** (catálogo pequeño → no copiar su pesadez); guest checkout; cross-sell de accesorios; urgencia honesta; badges tipo Rollback.

### 2.2 La Curacao Online Honduras — `lacuracaonline.com/honduras/` *(competidor directo)*
**Confianza:** ALTA (verificado en vivo: HTML + headers).

- **Stack / arquitectura:** **Adobe Commerce / Magento 2 con tema Luma** (server-rendered, NO headless). Evidencia: 70+ refs a "Magento", Page Builder, CatalogWidget, **RequireJS + Knockout.js**, namespace `mage-*`. CDN **Fastly + ESI** (Edge Side Includes). CSP report-only, HSTS. Multi-país (storeviews por path) operado por **Grupo Unicomer**. Satélites: `pagos.grupounicomer.com`, `lacuracaocash.com`.
- **IA / navegación:** Mega-menú generalista (TV, línea blanca, muebles, tecnología, celulares, electrodomésticos, automotriz, ferretería, hogar). Header con **"Solicita tu crédito"**, "Rastrea tu pedido", selector país/moneda (HN/HNL), breadcrumb.
- **Home:** Page Builder + Catalog Widgets: hero/carrusel de bundles, carruseles por reglas, mensajería de crédito above-the-fold, trust band ("Compra segura", "Garantía adicional"). Precios en Lempiras con % descuento.
- **Búsqueda:** Magento `catalogsearch` estándar; sin autocomplete avanzado evidente; búsqueda por código de producto no resuelve bien.
- **Listados:** Conteo "24 de 548", densidad 12/24/36, orden configurable, **paginación numerada**. Facetas MUY ricas (rangos de precio finos, specs técnicas, 30+ marcas, color, material). **⚠️ NO muestran cuotas en las tarjetas.**
- **PDP:** Galería, precio especial + regular tachado, agregar, favoritos, comparador, ficha técnica, garantía adicional, montaje gratis (muebles > L 4,500). **SIN reseñas. El financiamiento solo se ve en checkout/políticas, no en la PDP.**
- **Carrito / checkout:** Magento nativo. Cliente o invitado. **⚠️ Cargo de verificación de USD 1.00 al pagar con tarjeta** (no aplica con PayPal).
- **Cuenta / lealtad:** "Mis Créditos" (estado del crédito), wishlist, comparador. Lealtad gira en torno al crédito propio (La Curacao Cash). Sin puntos clásicos.
- **Promos / financiamiento (EJE CENTRAL):** **Crédito propio "La Curacao Cash"** (dominio aparte, solicitud + WhatsApp + sucursal). **Cuotas 0% con BAC Credomatic 3-6-9-12** (mínimo Lps. 5,997; excluye descuentos >30%). BAC Extra. Descuentos hasta -41/-44%. Pago de cuotas online. **Debilidad: las cuotas NO se muestran en tarjetas ni prominente en PDP.**
- **Confianza:** Trust band, garantía (reportar defectos en 15 días), devoluciones 30 días, rastreo, respaldo Unicomer. **DEBILIDAD: cero reseñas/UGC on-site.**
- **Móvil:** Web responsive Luma (no PWA). WhatsApp como canal móvil clave. Riesgo de CWV flojos por JS pesado.
- **Pagos:** Visa/MC/Amex, **PayPal (sin el cargo de USD 1)**, gift cards, BAC Extra/Intra (cuotas), pago en sucursal, La Curacao Cash. (Transferencia/Bitcoin mencionados en guías Unicomer.)
- **Logística:** Envío nacional 1-2 días hábiles, retiro en tienda, montaje a domicilio, rastreo. Red física nacional.
- **Destacado:** Crédito propio integrado; cuotas 0% BAC; omnicanalidad real; facetas ricas; entrega 1-2 días; WhatsApp; infra Magento madura.
- **Debilidades:** Sin reseñas; **cuotas escondidas**; cargo USD 1 con tarjeta; crédito fragmentado en otro dominio; Luma legacy (CWV flojos); buscador pobre; catálogo ruidoso.
- **Lecciones:** **Mostrar la cuota mensual en CADA tarjeta y PDP** (ellos la esconden → ahí ganamos); simulador/badge de cuotas reutilizable; **reseñas desde el día 1**; comunicar **"sin cargos ocultos"** (vs. su USD 1); trust band con números; retiro/entrega 24-48h; **WhatsApp**; filtros por specs Apple; **velocidad como diferenciador** (Next.js vs. Luma); wishlist + comparador.

### 2.3 Jetstereo — `jetstereo.com` *(competidor directo, stack análogo)*
**Confianza:** Alta (verificado vía HTML/RSC payload + sitemap).

- **Stack / arquitectura:** **Next.js (App Router / RSC) + React** (859 refs a `/_next/`, `data-precedence="next"`). Backend **headless propio** `api.jetstereo.com`. Datos de producto en el RSC payload: `name, slug, sku, price, discount, currency (HNL), brand, ratings{average,reviews}, stock, variants, store_pickup`. Imágenes en **AWS S3**, nginx, GTM. **Arquitectura MUY parecida a timesmart.**
- **IA / navegación:** Mega-menú rico con iconografía propia. Catálogo amplio (celulares, cómputo, TV, audio, gaming, electrodomésticos, climatización, hogar). Navegación por marcas (Apple, Samsung…). Páginas dedicadas: `/servicio-tecnico-apple`, `/ubicanos` (+100 tiendas), `/estado-orden`, `/comparacion-de-productos`, `/bodas`, `/credito`.
- **Home:** Retail denso: hero, tiles de categoría, carruseles con marca/precio/descuento/rating. Barra de crédito **Solvenza** above-the-fold. **Presales** (iPhone 17, Samsung S/Z). Trust band ("retira en 90 minutos").
- **Búsqueda:** Ruta `/buscar`; payload estructurado habilita facetas por categoría/marca; comparador dedicado.
- **Listados:** Grid con imagen S3, marca, precio, `discount`, **ratings (estrellas + nº)**, flag `new`, flag `store_pickup`. **⚠️ Exponen el stock numérico crudo en el payload (ej. 475.40).**
- **PDP:** `/product/{slug}`; galería, brand+logo, sku, price+discount (HNL), **variants**, **ratings nativos**, `store_pickup` (retira 90 min), `coupon`. CTA de crédito Solvenza. Servicio técnico Apple dedicado.
- **Carrito / checkout:** `/cart` + `/checkout`. Métodos: tarjeta, transferencia, **crédito Solvenza** (elige plazo y fecha de primera cuota). Carrito separado para bodas. Crédito "100% digital con doble verificación".
- **Cuenta / lealtad:** `/login`, `/portal`, `/solicitud-de-credito` (pre-aprobación Solvenza), **wishlist/favoritos**, **comparador**, **"Jetstereo Cash"** (cashback), mesa de bodas.
- **Promos / financiamiento (arma clave):** **Crédito propio "Solvenza"** (Grupo ILP). "Primera tienda online 100% al crédito de Honduras" (2021): pre-aprobación inmediata, cuotas a medida, primera cuota flexible, 100% digital. Pago de cuotas vía Atlántida/BAC/Davivienda/Banpaís. Cupones, presales, Jetstereo Cash.
- **Confianza:** **Reseñas/ratings nativos**; garantía destacada; 56+ años (Grupo ILP); +100 tiendas; **servicio técnico Apple autorizado**; devoluciones (7 días).
- **Móvil:** Responsive Next.js; WhatsApp + retiro 90 min como canal. Home pesada (~838KB).
- **Pagos:** Tarjeta Visa/MC, transferencia, **Solvenza** (cuotas + préstamos), Jetstereo Cash. Entrega a domicilio solo con tarjeta.
- **Logística:** **Compra y retira en 90 minutos** en +100 tiendas (diferenciador clave). Domicilio solo con tarjeta. Rastreo `/estado-orden`.
- **Destacado:** Solvenza end-to-end; retiro 90 min; WhatsApp; **reseñas + comparador nativos**; wishlist + Jetstereo Cash; mesa de bodas; servicio técnico Apple; presales.
- **Debilidades:** **Fuga de inventario (stock crudo en payload)**; catálogo disperso; domicilio solo con tarjeta; muchos productos con 0 reviews; home pesada (CWV); políticas restrictivas; sin chat en vivo.
- **Lecciones:** Mostrar "desde L X/mes"; **NO exponer stock crudo** (mapear a estados en el server); retiro en tienda; **WhatsApp**; reseñas pronto; aprovechar **foco Apple** vs. su catálogo disperso; **presales Apple**; comparador + wishlist; cuidar **CWV**; página `/estado-orden` sin login.

### 2.4 Back Market — `backmarket.com/es-us`
**Confianza:** Media-alta (Cloudflare bloqueó el fetch; deducido de fuentes secundarias confiables).

- **Stack / arquitectura:** **Nuxt.js (Vue 3) + SSR (Nitro)**; búsqueda **Algolia**; pagos **Adyen** (PCI-DSS); **Cloudflare** (evidenciado por sus propios 403/429). Backend microservicios poliglota (Python/FastAPI, Go, Kotlin) en Kubernetes + Terraform + Datadog; BigQuery; API pública para refurbishers.
- **IA / navegación:** Marketplace por tipo de dispositivo; URLs semánticas localizadas (`/es-us/`), páginas editoriales (`/e/good-deals`), buyback. Cada modelo+grado tiene página indexable (SEO).
- **Home:** Hero de ofertas, búsqueda prominente, **trust signals inmediatos** (garantía 1 año, 30 días, envío gratis, "verified refurbished"), carruseles por categoría, trade-in. Rating agregado (4.3/5, 120k+ reseñas). Mensaje de marca = impacto ambiental (anti e-waste).
- **Búsqueda:** Algolia, autocomplete rápido; facetas: precio, marca, modelo, almacenamiento, **grado de condición** (Premium/Excellent/Good/Fair).
- **Listados:** Grid; tarjeta con precio "desde", grado cosmético y rating del vendedor; mismo modelo con múltiples ofertas consolidadas.
- **PDP:** Galería; **selector de GRADO cosmético que cambia precio** (feature central); variantes; precio + **"pagar a plazos" (Affirm/Klarna) en la propia PDP**; comentarios del vendedor; garantía 1 año + 30 días + envío gratis inline; Protection Plan; trade-in; reviews agregadas.
- **Carrito / checkout:** Adyen; BNPL (Affirm 3/6/12/18 con prequalification sin afectar score); Protection Plan en checkout o hasta 30 días después. Probable empuje a crear cuenta (marketplace).
- **Cuenta / lealtad:** Seguimiento, **wishlist**, **alertas de bajada de precio**, trade-in. Enganche = ecosistema comprar+vender.
- **Promos / financiamiento:** Sin crédito propio; **BNPL de terceros** (Affirm, PayPal Pay Later, Klarna), "desde $X/mes" en PDP. Descuento por grado; trade-in como crédito.
- **Confianza (corazón del modelo):** Garantía 1 año automática; 30 días devolución gratis; **"Verified Refurbished"** (~1 de 3 refurbishers aceptados); rating de vendedor; rating agregado muy expuesto; BBB "A"; grados transparentes; Adyen PCI-DSS.
- **Móvil:** Apps nativas iOS/Android (assessment in-app de trade-in que cotiza en segundos). Web SSR Nuxt.
- **Pagos:** Visa/MC/Amex/Discover (Adyen), PayPal, **BNPL Affirm/Klarna/PayPal Pay Later**. Sin contra-entrega ni transferencia LATAM.
- **Logística:** **Envío gratis siempre**; devoluciones gratis 30 días; tracking; trade-in con depósito directo ~6 días.
- **Destacado:** **Grados de condición** como eje de precio; **confianza operacionalizada** visible en PDP; BNPL integrado; trade-in con assessment; prueba social fuerte; SSR + Algolia + Adyen; marca con propósito.
- **Debilidades:** Sin pagos locales LATAM (oportunidad para nosotros); variabilidad de calidad entre vendedores; complejidad de marketplace; Cloudflare bloquea integraciones; sin cuotas propias/locales; soporte percibido lento.
- **Lecciones:** Mensaje de confianza inline en PDP (garantía/devolución/envío); **financiamiento "desde L X/mes"**; **localizar pagos para HN**; **reviews + rating agregado**; **facetas** (modelo, almacenamiento, precio HNL); checkout corto (7-8 campos, one-page); **wishlist + alertas de precio**; **envío gratis** como gancho; trust band con propuesta de valor; mobile-first/PWA; SSR/SEO con URLs semánticas; **garantía extendida como upsell**.

### 2.5 eBay Honduras — `hn.ebay.com`
**Confianza:** Alta en stack/naturaleza; media en UI exacta (timeout por bot wall + JS pesado).

- **Stack / arquitectura:** Framework propio **Marko.js + Node** (SSR streaming, hidratación parcial, runtime ~10kb). Búsqueda propietaria **Cassini**. **hn.ebay.com NO es marketplace local**: es eBay global localizado (es-HN), no curado para Honduras.
- **IA / navegación:** Marketplace horizontal; buscador central dominante; mega-menú por departamentos; breadcrumb; árbol enorme (miles de hojas).
- **Home:** Algorítmica/descubrimiento: Daily Deals, "Recently viewed", "Based on your recent views", Trending, Brand Outlet. Scroll largo de módulos.
- **Búsqueda (corazón):** Cassini; autocomplete, **por voz, por imagen, escaneo de código de barras** (app); facetas riquísimas, "Best Match", **filtro "ship to Honduras"**, saved searches.
- **Listados:** Facetas hiper-granulares (Condition: New/Open box/Certified Refurbished/Used/For parts; Buying Format: Auction/Buy It Now/Best Offer; ubicación/entrega); grid o list; badge "Sponsored", rating del vendedor, Watchlist; paginación numerada.
- **PDP:** Galería con zoom; **condición destacada**; precio con múltiples modos (Buy It Now / Add to cart / Make Offer / subasta con contador); envío (eIS con import charges + fecha estimada a HN); bloque de **vendedor (% feedback)**; item specifics; reviews; "Similar items"; urgencia ("X sold", "X watching").
- **Carrito / checkout:** Server-side multi-vendedor; **managed payments**; **guest checkout**; muestra import charges/impuestos antes de pagar.
- **Cuenta / lealtad:** "My eBay" (Watchlist, Purchases, Saved searches/sellers, ofertas/pujas). eBay Bucks descontinuado.
- **Promos / financiamiento:** Daily Deals, Brand Outlet, cupones, Certified Refurbished. **BNPL no disponible para Honduras** (Klarna/Afterpay solo en mercados selectos) → pago al contado.
- **Confianza (lo que mejor hace):** **eBay Money Back Guarantee** automático; **feedback bidireccional** maduro; product reviews; "Top Rated" sellers; PayPal buyer protection muy mencionado en HN.
- **Móvil:** App nativa muy madura (imagen, cámara, código de barras, voz, push). Web responsive Marko.
- **Pagos:** Managed Payments: tarjeta (no Amex), Apple Pay, Google Pay, PayPal, (US: Venmo/Klarna). Para HN: tarjeta internacional o PayPal. **Precios típicamente en USD.**
- **Logística (punto débil para HN):** Muchos vendedores no envían directo; eBay International Shipping con import charges; práctica común = **casillero/forwarder en EEUU**. Sin retiro ni logística local.
- **Destacado:** Money Back Guarantee + feedback; búsqueda de clase mundial; múltiples formatos de compra; mercado de condición robusto; guest checkout; transparencia de importación; Marko SSR; personalización algorítmica; app nativa.
- **Debilidades:** **No es tienda hondureña** (USD, experiencia US); **logística cara/lenta** (casillero); **sin financiamiento para HN**; sin soporte/garantía Apple local; calidad variable; home/PDP ruidosas; JS pesado; confianza fragmentada por vendedor.
- **Lecciones:** **Confianza local como ventaja** (garantía Apple, factura, producto nuevo, soporte HN); **todo en Lempiras** sin sorpresas de aduana; **cuotas** (mayor hueco de eBay en HN); **logística local como killer feature**; módulo condición/variantes simple; autocomplete + facetas; reviews; CTA "consultar por WhatsApp"; guest checkout + Apple/Google Pay vía PayPal/Braintree; "vistos recientemente"; **performance** (cada 100ms LCP = -1.11% conversión, estudio eBay/Deloitte); PDP densa pero limpia; **schema.org** (Product/Offer/AggregateRating).

### 2.6 Amazon — `amazon.com/-/es`
**Confianza:** Alta en UX/pagos/financiamiento (fuentes oficiales); en vivo bloqueado (HTTP 503).

- **Stack / arquitectura:** 100% propietario sobre AWS; composición por **widgets/slots SSR** (micro-frontends ensamblados por un "UI composer"); **CloudFront** + S3; microservicios EC2/Fargate/Lambda + DynamoDB. Búsqueda **A9/A10** + capa IA **COSMO** + asistente **Rufus** (LLMs en Bedrock, incl. Claude).
- **IA / navegación:** Barra superior con "Enviar a", buscador con dropdown de departamento; menú "Todo" (panel lateral multi-columna); barra secundaria contextual; breadcrumb; árbol profundísimo.
- **Home:** **100% personalizado** (item-based collaborative filtering): "Comprar de nuevo", "Inspirado en tu historial", "Recomendaciones para ti", "Los más vendidos". Alta densidad.
- **Búsqueda (corazón):** Autocomplete + scoping por departamento; ranking A9/COSMO (relevancia + conversión + velocidad de ventas + reviews); facetas; badges (Amazon's Choice, Best Seller); **búsqueda visual (StyleSnap) + código de barras** (app); **Rufus** conversacional.
- **Listados:** Grid/lista; facetas densas (slider de precio, marca, rating mín., Prime); badges; precio tachado + %; etiqueta de entrega; variantes como miniaturas; sponsored intercalados.
- **PDP (anatomía de referencia):** Galería con zoom + video; rating agregado; **Buy Box sticky** (precio, entrega estimada por CP, stock/urgencia, "Agregar"/"Comprar ya"/1-Click); variantes; **financiamiento en la PDP** (Monthly Payments, Affirm); **"Comprados juntos habitualmente"** (add-all 1 clic); Q&A; **reviews con resumen IA "Los clientes dicen"** + "Compra verificada". ~35% de ventas atribuidas a recomendaciones.
- **Carrito / checkout:** **1-Click**; mini-cart con upsell; checkout lineal con fricción mínima; **⚠️ sin guest checkout** (obliga cuenta); financiamiento seleccionable en checkout.
- **Cuenta / lealtad:** **Amazon Prime** (motor de retención); wishlist/listas múltiples; "Comprar de nuevo"; "Subscribe & Save"; personalización total.
- **Promos / financiamiento:** Lightning Deals (temporizador + % reclamado), cupones clicables, Prime Day. **Financiamiento muy desarrollado**: Monthly Payments (cuotas 0% en elegibles), Affirm (>$50), tarjetas propias (0% hasta 24 meses >$150), Citi Flex Pay (3-24 meses). **Cuota visible en PDP y checkout.**
- **Confianza (estándar de oro):** Rating agregado + nº reseñas; "Compra verificada"; **resumen IA de reviews**; filtros por estrellas/sentimiento; fotos/videos de clientes; Q&A; Amazon's Choice/Best Seller; garantía A-to-z; devolución 30 días gratis. (Riesgo: reseñas IA.)
- **Móvil:** App principal (barra inferior); **búsqueda visual + código de barras + Rufus**; push.
- **Pagos:** Tarjetas, tarjetas propias, Amazon Pay, gift cards, **BNPL Affirm/Citi Flex/Monthly Payments**. **No PayPal.** Foco en 1-clic.
- **Logística (clase mundial):** Prime envío gratis (Two/Next/Same-Day); **fecha de entrega calculada por CP en PDP/checkout**; lockers; tracking en tiempo real; devolución gratis sin caja.
- **Destacado:** 1-Click; **Buy Box sticky con entrega calculada + urgencia**; recomendaciones item-to-item (~35% ventas); **resumen IA de reviews**; asistente IA (Rufus); búsqueda visual; financiamiento en PDP; facetas/badges; logística propia.
- **Debilidades:** **Sin guest checkout** (timesmart SÍ puede); densidad/ruido de sponsored; estética genérica (resta a Apple premium); integridad de reviews (IA); poca curaduría; localización español parcial.
- **Lecciones:** **Buy Box sticky** en `/producto/[slug]` (precio HNL, swatches, urgencia, fecha por ciudad, "Agregar"/"Comprar ya"; barra inferior sticky en móvil); **financiamiento desde el día 1** ("desde L X/mes a 12 meses", componente `<FinancingBadge/>`); **checkout invitado** + cuenta post-compra; fecha de entrega por ciudad persistida; **"Comprados juntos" curados manualmente**; reviews verificadas + trust band; **wishlist + "Comprar de nuevo"**; autocomplete + facetas; personalización ligera (cookies); **NO copiar la densidad** (minimalismo premium tipo apple.com); urgencia honesta; **performance** (AVIF/WebP + fetchpriority hero, LCP <2.5s).

---

## 3. Matriz comparativa (¿quién gana cada dimensión?)

| Dimensión | Gana | Nota para timesmart |
|---|---|---|
| **Financiamiento/cuotas visibles** | Jetstereo (Solvenza), Amazon/Back Market (PDP) | La Curacao tiene cuotas 0% pero las **esconde** → gap explotable: mostrar "desde L X/mes" en cada tarjeta y PDP |
| **Reviews / prueba social** | Amazon (oro), Back Market | La Curacao: cero. Jetstereo: infrautilizado. timesmart: no tiene → **mayor oportunidad** |
| **Velocidad / CWV móvil** | timesmart (potencial) | La Curacao = Luma pesado; Jetstereo home ~838KB. Next.js 16 RSC → LCP <2.5s, medible y promocionable |
| **Omnicanalidad / logística local** | Jetstereo (90 min), La Curacao | Gap estructural (no tenemos tiendas) → compensar con retiro Tegus/SPS + entrega 24-48h + envío gratis sobre monto |
| **Pago localizado** | La Curacao / Jetstereo | Sumar tarjeta local (POS virtual), transferencia; evitar el cargo de USD 1 de La Curacao |
| **Checkout sin fricción (invitado)** | Walmart / eBay / Back Market | Amazon NO lo tiene → ofrecer guest checkout + cuenta post-compra |
| **Buy box / PDP** | Amazon (referencia) | Falta buy box sticky, swatches, entrega por ciudad, financiamiento inline |
| **Foco / curaduría** | **timesmart** (ventaja estructural) | Todos son generalistas ruidosos; Apple-puro = claridad, autoridad, comparadores, estética premium |
| **Confianza operacionalizada** | Back Market / Walmart | Trust band con garantía Apple + producto sellado + devolución + WhatsApp en home y PDP |
| **Canal WhatsApp** | Jetstereo / La Curacao | Esperado en HN; botón flotante + deep link `wa.me` con contexto — bajo esfuerzo, alto impacto |

---

## 4. Lo mejor de cada uno (best-in-class a adoptar)

| Feature | Quién | Por qué |
|---|---|---|
| Buy Box sticky (entrega por ubicación + urgencia + financiamiento) | Amazon | Anatomía de PDP más copiada; ~35% de ventas por sus módulos |
| Resumen IA de reviews + "Compra verificada" | Amazon | Convierte prueba social en decisión; cierra el gap de confianza vs. locales |
| Financiamiento propio end-to-end (cuota a medida, 1ª cuota flexible) | Jetstereo (Solvenza) | Driver #1 de conversión en tickets altos en Lempiras |
| Garantía 1 año + 30 días + envío gratis SIEMPRE visibles | Back Market | Reduce el miedo a comprar caro |
| Compra y retira en 90 minutos | Jetstereo | Reduce miedo al envío; replicable ligero (retiro en oficina Tegus/SPS) |
| Cuotas 0% con banco local (BAC 3-6-9-12) | La Curacao | Mecanismo de pago esperado en HN (¡pero mostrarlo, ellos lo esconden!) |
| Facetas/filtros por specs | La Curacao / eBay | Estándar en compra considerada; curar a Apple |
| WhatsApp como canal de venta/soporte | Jetstereo / La Curacao | En HN se compra y consulta por WhatsApp |
| Grados/condición transparente + trade-in | Back Market | Si vendemos seminuevo Apple: diferenciador de alto valor |
| Guest checkout | Walmart / eBay | -20% abandono (Baymard) |

---

## 5. Brechas actuales de timesmart

1. **Sin financiamiento ni visualización de cuota mensual** (driver #1 en HN).
2. **Sin reviews/ratings** (mayor brecha de confianza).
3. **Checkout sin construir** (PayPal pendiente; sin guest checkout, sin tarjeta local/transferencia/contra-entrega).
4. **PDP sin buy box sticky**, sin swatches, sin fecha de entrega por ciudad, sin financiamiento inline, sin garantía/devolución visibles.
5. **Sin omnicanalidad/logística local visible** (retiro Tegus/SPS, entrega 24-48h, envío gratis sobre monto).
6. **Sin WhatsApp** como canal de venta/soporte.
7. **Sin recomendaciones ni cross-sell** (AppleCare/fundas/AirPods, alto margen).
8. **Sin wishlist ni alertas de bajada de precio**.
9. **Sin comparador** Mac-vs-Mac / iPhone-vs-iPhone.
10. **Sin página de estado de orden sin login**.
11. **Sin datos estructurados schema.org** ni SEO de catálogo para Google HN.
12. **Sin señales de urgencia honestas** ni badges derivados de stock real.

---

## 6. Roadmap priorizado (cómo superarlos a todos)

### P0 — Imprescindibles
| Feature | Por qué | Implementación (Next.js 16 + Medusa v2) | Esfuerzo |
|---|---|---|---|
| **Checkout PayPal + guest checkout + total transparente** | Sin checkout no hay venta; -20% abandono; sin cargos ocultos (vs. USD 1 de La Curacao) | Cart de Medusa (ya integrado) + Payment Module con provider PayPal (`medusa-payment-paypal` o `@paypal/checkout-server-sdk` en API route). Server Actions para complete-cart. Email-only cart + `createCustomer` post-compra. Desglose `cart.total/shipping_total/tax_total`. | L |
| **Módulo financiamiento `<CuotaBadge/>` "desde L X/mes"** | Driver #1 en HN; gap del líder local | Componente server: recibe `price` (HNL de `variant.calculated_price`) + planes (3/6/9/12) desde `product.metadata` o módulo custom `financing`. `cuota = precio/n` con disclaimers. Render en `ProductCard` y PDP. Modal con tabla de cuotas. | M |
| **Reviews/ratings verificados** | Mayor brecha de confianza; ningún local lo hace bien | Módulo custom Medusa `review` (`product_id, customer_id, order_id, rating, body, verified, status`), link a Product/Order. API `/store/products/:id/reviews` (POST validando order completada). Workflow de moderación. AggregateRating en card/PDP + schema.org. | L |
| **Buy box mejorado en PDP** (swatches, urgencia, entrega por ciudad, trust inline) | Donde se decide la compra de alto ticket | Refactor `/producto/[slug]` (RSC). Swatches desde `product.options/variants`. Mapear `inventory_quantity` a estados en el **server** (no exponer crudo, error de Jetstereo). Sticky desktop + barra inferior móvil. Selector "Enviar a" (ciudad HN) en cookie. | M |

### P1 — Alto impacto
| Feature | Por qué | Implementación | Esfuerzo |
|---|---|---|---|
| **WhatsApp flotante + CTA contextual** | Canal esperado en HN | `FloatingWhatsApp` con `wa.me/<num>?text=` (producto/carrito). `NEXT_PUBLIC_WHATSAPP_NUMBER`. Sin dependencias. | S |
| **Pagos locales** (POS virtual banco HN, transferencia, cuotas BAC) | El hondureño paga con tarjeta local/transferencia | 2º Payment Provider (POS con 3DS) + método manual "transferencia" (confirmación admin). Cuotas 0% vía provider de tarjeta. | L |
| **Retiro en tienda/oficina + entrega 24-48h + envío gratis sobre monto** | Replica ligera de omnicanalidad local | Fulfillment Module: Shipping Option "Retiro en oficina" (L 0) + envío por zona (stock locations Tegus/SPS). Envío gratis vía Promotion Module. | M |
| **Buscador autocomplete + facetas Apple** (modelo, chip, almacenamiento, color, precio HNL) | Estándar de compra considerada; SEO | Medusa product search + filtros UI en `/tienda` (searchParams). Autocomplete con debounce a `/store/products?q=`. Escalar a Search/Index o Meilisearch si crece. | M |
| **Trust band global + schema.org** | Confianza + rich results en Google HN | Ampliar `TrustBand` (garantía Apple, sellado, devolución, pago seguro, WhatsApp). JSON-LD Product/Offer/AggregateRating/Breadcrumb en PDP. | S |

### P2 — Diferenciadores
| Feature | Por qué | Implementación | Esfuerzo |
|---|---|---|---|
| **Wishlist + alertas de bajada de precio** | Retención barata en electrónica cara | Módulo `wishlist` (Customer↔Product). Job que compara precio y notifica (Notification Module). | M |
| **Recomendaciones/cross-sell curados** ("Comprados juntos", AppleCare/fundas/AirPods) | Accesorios de alto margen | Bundles en `product.metadata` + "add-all" 1 clic (Server Action). "Vistos recientemente" con cookies. | M |
| **Comparador Mac-vs-Mac / iPhone-vs-iPhone** | Esperado en premium; diferenciador de especialista | `/comparar` con ids en searchParams; tabla de specs desde `metadata/options`. | M |
| **Estado de orden sin login + presales de lanzamientos** | Tranquilidad + captura de demanda | `/estado-orden` (nº + email → Order Module). Presales: producto con metadata + captura de email. | M |

---

## 7. Playbook Honduras (tácticas locales)

1. **Financiamiento como héroe:** "desde L X/mes" en CADA tarjeta y en el buy box, con modal de cuotas (3/6/9/12). Empezar con 0% vía tarjeta BAC/Ficohsa/Atlántida/Banpaís y PayPal Pay Later; planear partner BNPL/convenio bancario.
2. **Cuotas sin intereses con banco local:** integrar y **comunicar** "0% con tarjeta BAC a 3-6-9-12" desde la tarjeta (La Curacao lo esconde).
3. **Pago localizado real:** además de PayPal, tarjeta local (POS 3DS), transferencia y evaluar contra-entrega en Tegus/SPS. **"Sin cargos ocultos"** (vs. USD 1 de La Curacao).
4. **Entrega y retiro local:** "retiro en oficina Tegus/SPS hoy/24h" (gratis) + domicilio 24-48h con fecha en HNL; envío gratis sobre monto.
5. **Confianza Apple local:** trust band permanente (garantía Apple, producto nuevo sellado, factura, devolución, soporte). En HN la garantía/servicio vende más que el precio.
6. **Reviews verificadas desde el día 1:** atadas a órdenes Medusa reales; estrellas en card y PDP. Gap de TODOS los locales.
7. **WhatsApp como canal de venta:** botón flotante + CTA con deep link de producto/carrito.
8. **Moneda y transparencia:** todo en Lempiras, precio total claro, sin sorpresas de aduana (ventaja directa vs. eBay/Amazon).
9. **Velocidad como arma:** Next.js 16 RSC + streaming + next/image (AVIF/WebP), LCP <2.5s en gama media y 4G.
10. **Foco Apple como posicionamiento:** "el especialista Apple de Honduras", comparadores, accesorios curados, PDP premium tipo apple.com.
11. **Guest checkout + cuenta post-compra:** comprar sin registro (capturar email), crear cuenta al final.
12. **Urgencia honesta y stock seguro:** "Últimas unidades" desde stock real, mapeado a estados en el server (nunca crudo, error de Jetstereo). Badges discretos azul/blanco/Poppins.

---

## 8. North Star

> **timesmart gana siendo EL especialista Apple de Honduras con la experiencia de compra más rápida, confiable y financiable del país.**
>
> Supera a los generalistas globales (Walmart, Amazon, eBay, Back Market) eliminando su fricción local: todo en Lempiras sin aduana, garantía y soporte Apple local, retiro en Tegucigalpa/SPS y WhatsApp.
>
> Supera a los líderes directos (La Curacao, Jetstereo) en los tres frentes donde ellos fallan: **(1)** hace VISIBLE la cuota mensual "desde L X/mes" en cada tarjeta y PDP (La Curacao la esconde), **(2)** tiene **reviews verificadas** atadas a órdenes reales (gap de todos), y **(3)** entrega **velocidad superior** con Next.js 16 RSC frente al Magento Luma pesado de La Curacao y la home de 838KB de Jetstereo.
>
> Apalanca su única desventaja estructural (no tener red de tiendas) convirtiendo el **foco Apple-puro** en autoridad: PDP premium estilo apple.com, comparadores específicos, accesorios de alto margen y una arquitectura headless limpia (Medusa v2: módulos custom de *financing*, *review* y *wishlist*; Payment Module multi-provider; Fulfillment con retiro local) que le permite iterar más rápido que cualquier competidor sobre plataforma legacy o stack propietario monolítico.
>
> **Resultado: la cuota visible convierte, las reviews dan confianza, la velocidad retiene, el foco Apple posiciona y la logística local cierra la venta.**

---

*Generado por análisis multi-agente (7 agentes, ~439k tokens, 117 herramientas). Niveles de confianza por competidor indicados en cada sección. Sitios con WAF/bot wall (Walmart, Amazon, eBay, Back Market) se complementaron con fuentes secundarias confiables; La Curacao y Jetstereo se verificaron en vivo (HTML/headers/RSC payload).*
