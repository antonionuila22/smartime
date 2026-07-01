# 03 — UX/UI System (Sistema de diseño) — smartime

> **Producto:** smartime — tienda online especialista Apple + electrónica de consumo para Honduras (HNL).
> **Alcance:** sistema de diseño completo del storefront (Next.js 16, App Router, React 19, Tailwind 4, shadcn/ui, lucide-react).
> **Estilo rector:** "Back Market en azul" — fondo cálido off-white, texto carbón, tarjetas blancas, acento AZUL, titulares serif Fraunces, cuerpo Poppins, botones píldora, radio 1rem.
> **Estado:** Vigente. Fuente de verdad visual y de interacción.
> **Fecha:** 2026-06-29.

### Documentos relacionados (cruce de referencias)

| Doc | Cuándo consultarlo |
|---|---|
| **`01-PRD.md`** | Qué pantalla cumple qué RF y para qué persona |
| **`02-TRD.md`** | Cómo se implementa cada componente/endpoint |
| **`03-UXUI-system.md`** (este) | Tokens, tipografía, color, componentes, patrones, accesibilidad, microcopy |
| **`04-app-flow.md`** | Recorridos extremo a extremo (carrito → checkout → pago → pedido) |
| **`05-schema-db.md`** | Datos que alimentan cada componente (`ViewProduct`, `ReviewItem`) |
| **`06-implementation-plan.md`** | Orden de construcción de los patrones aquí descritos |

> Tokens reales leídos de `src/app/(frontend)/globals.css`. Escala tipográfica de `tailwind.config.mjs`. La mayoría de componentes citados existen en `src/components/**`; **excepción:** `Header` y `Footer` viven en `src/Header/` y `src/Footer/` (no bajo `src/components/`). Ver mapa de archivos en la memoria del proyecto.

---

## 1. Marca y personalidad

### 1.1 Quiénes somos

**smartime** es el especialista Apple de Honduras: la compra de tecnología más **rápida, confiable y financiable** del país. La marca proyecta tres atributos sobre cualquier decisión visual:

1. **Premium accesible** — estética limpia tipo apple.com / Back Market, pero hablándole a un comprador hondureño real que paga en cuotas y retira en tienda.
2. **Confianza operacionalizada** — todo lo que decimos se demuestra: reseñas verificadas por compra, fecha de entrega visible, precio en Lempiras sin sorpresas.
3. **Velocidad** — la interfaz se siente instantánea (RSC, LCP < 2.5 s); el diseño nunca pelea contra el rendimiento (imágenes ligeras, sin adornos pesados).

### 1.2 Logo / monograma ST

El logo (`src/components/Logo/Logo.tsx`) tiene tres partes:

- **Monograma "ST"** — SVG: anillo azul "roto" con puntos de velocidad (alude a movimiento/tecnología). El monograma es el favicon y la marca mínima en espacios reducidos (header móvil, avatar).
- **Wordmark** — "smar" en `text-foreground` (carbón) + "time" en `text-primary` (azul). Nunca todo azul ni todo carbón.
- **Tagline** — "TECNOLOGÍA QUE TE CONECTA" en versalitas, `text-muted-foreground`, solo cuando `showTagline=true` (footer, splash). Se omite en el header para no competir con la navegación.

**Reglas de uso del logo:**
- Área de protección: mínimo la altura de la "S" alrededor del monograma.
- Sobre fondo azul (`bg-primary`): usar la variante mono-blanco (`text-primary-foreground`).
- No deformar, no rotar, no aplicar sombras ni degradados al monograma.
- Tamaño mínimo del wordmark legible: ~96px de ancho; por debajo, solo monograma.

### 1.3 Voz y tono (español de Honduras)

| Atributo | Sí | No |
|---|---|---|
| **Claro** | "Recíbelo entre el 2 y 4 de julio" | "Tiempos de entrega sujetos a disponibilidad logística" |
| **Cercano (HN)** | "Pagalo en cuotas, 0% de interés" · "Retiralo hoy en Tegucigalpa" | Tuteo neutro forzado; tecnicismos de checkout |
| **Honesto** | "Últimas unidades" · "Precio en Lempiras, sin cargos sorpresa" | Urgencia falsa, contadores inventados |
| **Conciso** | "Agregar al carrito" | "Proceda a incorporar este artículo a su cesta de compras" |

- **Voseo suave hondureño** en llamados a la acción y mensajes de confianza ("Pagalo en cuotas", "Retiralo en tienda"), tuteo aceptable en textos neutros. Mantener consistencia por sección.
- **Moneda siempre "L"** antepuesta sin decimales: `L 32,999` (ver §12).
- **Sin spanglish** salvo términos consagrados del producto (iPhone, MacBook, AirPods, Apple Watch).

---

## 2. Principios de diseño ("Back Market en azul")

1. **Fondo cálido, no blanco puro.** El lienzo es off-white (`--background: oklch(96.6% 0.006 90deg)`); las tarjetas son blancas (`--card`). El contraste tarjeta/fondo crea profundidad sin sombras agresivas. Esto separa a smartime del blanco clínico de los generalistas.
2. **El producto manda.** Packshots sobre blanco, sin ruido. El UI rodea al producto pero no compite con él.
3. **El precio y la cuota son protagonistas.** En cada tarjeta y PDP, el precio en Lempiras y el `CuotaBadge` "desde L X/mes" tienen jerarquía alta — es nuestra ventaja vs. La Curacao.
4. **Azul = acción y confianza.** El azul (`--primary`) se reserva para acciones primarias, enlaces y el wordmark "time". No se usa como decoración de relleno.
5. **Formas suaves, ritmo amable.** Radio base 1rem; botones píldora (`rounded-full`); bordes sutiles (`--border`). Nada anguloso ni "industrial".
6. **Serif para titular, sans para leer.** Fraunces da carácter editorial premium a h1/h2; Poppins mantiene el cuerpo legible y neutro.
7. **Honestidad sobre adorno.** Estados de stock como texto ("Últimas unidades"), no números crudos; ETAs conservadoras; sin badges de urgencia falsos.
8. **Rápido por defecto.** Preferir `<img>` plano y CSS sobre librerías pesadas; animaciones cortas y de bajo costo (`tw-animate-css`).

---

## 3. Tokens de diseño (exactos, leídos de `globals.css`)

> Todos los colores son OKLCH. Se exponen como variables CSS y como utilidades Tailwind vía `@theme inline` (p. ej. `--color-primary` → `bg-primary`, `text-primary`, `border-primary`). Modo claro en `:root`; modo oscuro en `[data-theme='dark']`.

### 3.1 Paleta semántica — modo claro (`:root`)

| Token (CSS var) | Utilidad Tailwind | Valor OKLCH | Rol semántico |
|---|---|---|---|
| `--background` | `bg-background` | `oklch(96.6% 0.006 90deg)` | Lienzo de la app (off-white cálido) |
| `--foreground` | `text-foreground` | `oklch(21% 0.006 60deg)` | Texto principal (carbón) |
| `--card` | `bg-card` | `oklch(100% 0 0deg)` | Superficie de tarjetas/paneles (blanco) |
| `--card-foreground` | `text-card-foreground` | `oklch(21% 0.006 60deg)` | Texto sobre tarjeta |
| `--popover` | `bg-popover` | `oklch(100% 0 0deg)` | Dropdowns, menús, modales |
| `--popover-foreground` | `text-popover-foreground` | `oklch(21% 0.006 60deg)` | Texto sobre popover |
| `--primary` | `bg-primary` / `text-primary` | `oklch(55% 0.2 255deg)` | **Azul de marca**: acciones primarias, enlaces, wordmark "time" |
| `--primary-foreground` | `text-primary-foreground` | `oklch(98.5% 0 0deg)` | Texto/ícono sobre azul (casi blanco) |
| `--secondary` | `bg-secondary` | `oklch(93.5% 0.006 90deg)` | Botón/superficie secundaria suave |
| `--secondary-foreground` | `text-secondary-foreground` | `oklch(25% 0.006 60deg)` | Texto sobre secundario |
| `--muted` | `bg-muted` | `oklch(93.5% 0.006 90deg)` | Fondos atenuados, skeletons, chips inactivos |
| `--muted-foreground` | `text-muted-foreground` | `oklch(48% 0.012 70deg)` | Texto secundario, captions, tagline |
| `--accent` | `bg-accent` | `oklch(93% 0.008 90deg)` | Hover de ítems, realces sutiles |
| `--accent-foreground` | `text-accent-foreground` | `oklch(25% 0.006 60deg)` | Texto sobre accent |
| `--destructive` | `bg-destructive` / `text-destructive` | `oklch(57.7% 0.245 27.325deg)` | Acción destructiva / error fuerte (eliminar) |
| `--destructive-foreground` | `text-destructive-foreground` | `oklch(57.7% 0.245 27.325deg)` | Texto destructivo |
| `--border` | `border-border` | `oklch(88.5% 0.006 90deg)` | Bordes y divisores (default global vía `* { border-border }`) |
| `--input` | `border-input` | `oklch(88.5% 0.006 90deg)` | Borde de campos de formulario |
| `--ring` | `ring-ring` | `oklch(55% 0.2 255deg)` | Anillo de foco (azul = primary) |
| `--radius` | `rounded-lg` etc. | `1rem` | Radio base (ver §3.4) |
| `--success` | `bg-success` / `border-success` | `oklch(78% 0.08 200deg)` | Éxito / en stock / pago confirmado |
| `--warning` | `bg-warning` / `border-warning` | `oklch(89% 0.1 75deg)` | Aviso / últimas unidades / pendiente |
| `--error` | `bg-error` / `border-error` | `oklch(75% 0.15 25deg)` | Error suave / agotado (distinto de `destructive`) |

> **Charts** (`--chart-1..5`) y **sidebar** (`--sidebar-*`) existen en los tokens para futuras vistas de datos/admin; no se usan en el storefront cliente hoy. Disponibles si se construyen dashboards.

### 3.2 Sombras

`globals.css` **no define tokens de sombra personalizados**. Se usa la escala estándar de Tailwind. Convención del sistema:

| Uso | Clase Tailwind | Notas |
|---|---|---|
| Tarjeta en reposo | `shadow-sm` o sin sombra (solo `border`) | Profundidad la da el contraste card/background |
| Tarjeta en hover | `hover:shadow-md` | Elevación sutil al pasar el cursor |
| Popover/dropdown/modal | `shadow-lg` | Separa del contenido |
| Header sticky | `shadow-sm` al hacer scroll (opcional) | No sombra pesada |

> Principio: la jerarquía se construye con **contraste de superficie + borde** antes que con sombras. Evitar `shadow-xl`/`shadow-2xl` salvo en el modal de cuotas.

### 3.3 Diferencias clave en modo oscuro (`[data-theme='dark']`)

| Token | Claro | Oscuro |
|---|---|---|
| `--background` | `oklch(96.6% …)` off-white | `oklch(14.5% 0 0deg)` casi negro |
| `--card` | blanco | `oklch(17% 0 0deg)` gris muy oscuro |
| `--primary` | `oklch(55% 0.2 255deg)` | `oklch(70% 0.16 255deg)` (azul más claro para contraste) |
| `--success` | `oklch(78% 0.08 200deg)` | `oklch(28% 0.1 200deg)` |
| `--warning` | `oklch(89% 0.1 75deg)` | `oklch(35% 0.08 70deg)` |
| `--error` | `oklch(75% 0.15 25deg)` | `oklch(45% 0.1 25deg)` |

El tema se controla con el atributo `data-theme` en `<html>` (gestionado por `ThemeProvider`, persiste en localStorage). El truco anti-FOUC: `html { opacity: 0 }` y se revela cuando `data-theme` está presente.

### 3.4 Radio (radius)

Base `--radius: 1rem`. Derivados en `@theme inline`:

| Variable | Cálculo | Valor | Uso típico |
|---|---|---|---|
| `--radius-sm` | `calc(1rem - 4px)` | 12px | inputs, chips, badges |
| `--radius-md` | `calc(1rem - 2px)` | 14px | botones rectangulares, selects |
| `--radius-lg` | `var(--radius)` | 16px | tarjetas, paneles, modales |
| `--radius-xl` | `calc(1rem + 4px)` | 20px | contenedores hero, banners |
| (píldora) | `rounded-full` | 9999px | **botones de acción, CuotaBadge, chips de filtro** |

---

## 4. Tipografía

### 4.1 Familias

| Rol | Familia | Variable | Fallback | Dónde |
|---|---|---|---|---|
| Titulares | **Fraunces** (serif humanista) | `--font-serif` / `font-serif` | `Georgia, 'Times New Roman', serif` | `h1`, `h2` (aplicado en `@layer base`) |
| Cuerpo / UI | **Poppins** (sans geométrica) | `--font-sans` / `font-sans` | sans del sistema | Todo lo demás (h3–h6, párrafos, botones, labels) |
| Mono | **Geist Mono** | `--font-mono` / `font-mono` | mono del sistema | Códigos de pedido, SKUs, datos técnicos |

`h1, h2` reciben automáticamente Fraunces con `letter-spacing: -0.02em` (tracking ceñido para look editorial premium). `h3`–`h6` quedan en Poppins.

> Nota técnica: en `globals.css`, `@layer base` resetea `font-weight` y `font-size` de los headings a `unset`. **Por eso el tamaño/peso de cada heading se define explícitamente con clases Tailwind** (no hay tamaño por defecto). La escala de `prose` (typography plugin) abajo es para contenido largo.

### 4.2 Escala tipográfica (clases Tailwind recomendadas)

| Token de UI | Móvil | ≥ md | Clases Tailwind | Familia |
|---|---|---|---|---|
| Display / Hero | 2.25rem | 3rem–3.75rem | `text-4xl md:text-6xl font-medium tracking-tight` | Fraunces (h1) |
| H1 página | 2rem | 2.5rem | `text-3xl md:text-4xl font-medium` | Fraunces |
| H2 sección | 1.5rem | 1.875rem | `text-2xl md:text-3xl font-medium` | Fraunces |
| H3 subsección | 1.25rem | 1.5rem | `text-xl md:text-2xl font-semibold` | Poppins |
| Título de tarjeta | 1rem | 1rem | `text-base font-medium` | Poppins |
| Cuerpo | 1rem | 1rem | `text-base leading-relaxed` | Poppins |
| Cuerpo pequeño | 0.875rem | 0.875rem | `text-sm` | Poppins |
| Caption / meta | 0.75rem | 0.75rem | `text-xs text-muted-foreground` | Poppins |
| Precio (PDP) | 1.875rem | 2.25rem | `text-3xl md:text-4xl font-semibold tabular-nums` | Poppins |
| Precio (tarjeta) | 1.125rem | 1.125rem | `text-lg font-semibold tabular-nums` | Poppins |
| Eyebrow / overline | 0.75rem | 0.75rem | `text-xs uppercase tracking-wider text-muted-foreground` | Poppins |

> Para contenido editorial largo (descripciones ricas) usar `prose` del plugin `@tailwindcss/typography`, cuya escala base está en `tailwind.config.mjs` (`base`: h1 2.5rem / h2 1.25rem; `md`: h1 3.5rem / h2 1.5rem).
> **Precios y cantidades:** usar siempre `tabular-nums` para alineación de cifras.
> **Nota (placeholders existentes):** las pantallas ya construidas como `checkout/page.tsx` y `cuenta/page.tsx` usan headings `text-3xl/2xl font-bold tracking-tight` (son placeholders). Al construir las Fases 1–3 deben alinearse al sistema (`font-medium` serif Fraunces para h1/h2), o bien documentar `font-bold` como peso aceptado si se decide mantenerlo.

---

## 5. Color: paleta + uso semántico + estados

### 5.1 Roles de acción

| Acción | Fondo | Texto | Clases ejemplo |
|---|---|---|---|
| Primaria (Comprar, Agregar, Continuar) | `bg-primary` | `text-primary-foreground` | `bg-primary text-primary-foreground rounded-full hover:bg-primary/90` |
| Secundaria (Seguir comprando) | `bg-secondary` | `text-secondary-foreground` | `bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80` |
| Outline (terciaria) | transparente | `text-foreground` | `border border-input bg-card hover:bg-accent rounded-full` |
| Ghost (íconos, links de UI) | transparente | `text-foreground` | `hover:bg-accent hover:text-accent-foreground` |
| Link | — | `text-primary` | `text-primary underline-offset-4 hover:underline` |
| Destructiva (Eliminar) | `bg-destructive` | `text-white` | `bg-destructive text-white hover:bg-destructive/90` |

### 5.2 Estados de feedback (semánticos)

| Estado | Color token | Patrón visual | Microcopy típico |
|---|---|---|---|
| Éxito / En stock / Pagado | `success` | punto/ícono + texto verde-azulado; `border-success bg-success/30` | "En stock", "Pago confirmado", "Entregado" |
| Aviso / Últimas unidades / Pendiente | `warning` | `border-warning bg-warning/30` | "Últimas unidades", "Pago pendiente", "En preparación" |
| Error suave / Agotado | `error` | `border-error bg-error/30` | "Agotado", "No pudimos procesar tu pago" |
| Destructivo (confirmación) | `destructive` | botón rojo sólido | "Eliminar del carrito" |
| Info / Financiamiento | `primary` | azul suave `bg-primary/10 text-primary` | "Cuotas 0% disponibles" |

> Las clases `border-success`, `bg-success/30`, `border-warning`, `bg-warning/30`, `border-error`, `bg-error/30`, `border-border`, `bg-card` están **safelisted** en `globals.css` (`@source inline(...)`) para que Tailwind no las purgue aunque se compongan dinámicamente.

### 5.3 Estados de interacción (todos los interactivos)

| Estado | Tratamiento |
|---|---|
| Hover | `hover:bg-*/90` (sólidos) o `hover:bg-accent` (ghost/outline); tarjetas `hover:shadow-md` |
| Focus-visible | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none` (anillo azul; el global ya aplica `outline-ring/50`) |
| Active/pressed | `active:scale-[0.98]` opcional en botones píldora |
| Disabled | `disabled:opacity-50 disabled:pointer-events-none` |
| Loading | spinner o texto ("Procesando…") + `aria-busy="true"` |

---

## 6. Espaciado, grid y breakpoints

### 6.1 Escala de espaciado

Escala base de Tailwind (múltiplos de 4px). Convención del sistema:

| Token | Uso |
|---|---|
| `gap-2` / `p-2` (8px) | dentro de chips, badges, ítems compactos |
| `gap-3`/`gap-4` (12–16px) | entre elementos de una tarjeta |
| `p-4 md:p-6` (16–24px) | padding interno de tarjetas/paneles |
| `gap-6` (24px) | entre tarjetas en grilla |
| `py-12 md:py-16` (48–64px) | separación vertical entre secciones de página |
| `py-16 md:py-24` | bloques hero / secciones destacadas |

### 6.2 Contenedor

`.container` (definido en `globals.css`): ancho 100%, centrado, `padding-inline: 1rem` (2rem desde `md`), con `max-width` por breakpoint:

| Breakpoint | `max-width` del container |
|---|---|
| `sm` | 40rem (640px) |
| `md` | 48rem (768px) — padding lateral 2rem |
| `lg` | 64rem (1024px) |
| `xl` | 80rem (1280px) |
| `2xl` | 86rem (1376px) |

### 6.3 Breakpoints (de `@theme` en `globals.css`)

| Nombre | Min-width | Uso típico |
|---|---|---|
| `sm` | 40rem / 640px | 2 columnas en grillas |
| `md` | 48rem / 768px | aparece AddToCart hover en tarjeta; nav desktop |
| `lg` | 64rem / 1024px | 3–4 columnas; buy box sticky de 2 columnas |
| `xl` | 80rem / 1280px | grilla de catálogo 4 col |
| `2xl` | 86rem / 1376px | ancho máximo de contenido |

> Variantes custom (`sm`, `md`, `lg`, `xl`, `2xl`, `dark`) están registradas con `@custom-variant` para mapear al sistema de breakpoints/theme.

### 6.4 Grids de producto (patrones)

| Vista | Clases recomendadas |
|---|---|
| Grilla catálogo `/tienda` | `grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6` |
| Carrusel home (`ProductCarousel`, 6 visibles) | `flex gap-4 overflow-x-auto snap-x` o grilla responsive |
| Layout PDP | `grid lg:grid-cols-2 gap-8 lg:gap-12` (galería \| buy box) |
| Layout cuenta/checkout | `grid lg:grid-cols-[1fr_360px] gap-8` (contenido \| resumen) |
| `CategoryGrid` | `grid grid-cols-2 lg:grid-cols-4 gap-4` |

> Clases `lg:col-span-4/6/8/12` están safelisted (`@source inline`) para layouts de 12 columnas puntuales.

---

## 7. Iconografía e imágenes

### 7.1 Iconos — lucide-react

- **Única librería de íconos.** Importar por nombre desde `lucide-react`.
- Tamaño por defecto **20–24px** (`h-5 w-5` / `h-6 w-6`); 16px (`h-4 w-4`) en contextos densos (chips, captions).
- Trazo de 2 (default de lucide); no mezclar con otros sets.
- Color hereda de `currentColor` → usar `text-*` del contexto. Íconos decorativos: `aria-hidden="true"`. Íconos que son la única etiqueta de un botón: `aria-label`.

**Mapa de íconos canónico (consistencia):**

| Concepto | Ícono lucide |
|---|---|
| Carrito | `ShoppingCart` / `ShoppingBag` |
| Cuenta | `User` / `UserCircle` |
| Buscar | `Search` |
| Wishlist | `Heart` (relleno cuando guardado) |
| WhatsApp flotante | `MessageCircle` (o SVG de marca) |
| Estrella reseña | `Star` (relleno/semirelleno por rating) |
| Seguridad / pago | `Lock`, `ShieldCheck` |
| Envío | `Truck` |
| Retiro en tienda | `Store` / `MapPin` |
| Cuota / financiamiento | `CreditCard`, `CalendarClock` |
| Éxito | `Check`, `CheckCircle2` |
| Aviso | `AlertTriangle` |
| Cerrar | `X` |
| Navegación carrusel | `ChevronLeft`, `ChevronRight` |

### 7.2 Imágenes (packshots)

- **Packshots sobre fondo blanco**, recortados, sin sombras de estudio agresivas — coherente con el blanco de `--card`.
- El storefront usa **`<img>` plano** (no `next/image` en componentes de catálogo), por decisión de proyecto; las fuentes son CDNs externos (Amazon/Apple/Best Buy/Wikimedia) declarados en `remotePatterns` de `next.config.ts`.
- **Relación de aspecto** consistente: contenedor `aspect-square` (tarjetas) o `aspect-[4/3]` (hero), con `object-contain` para no recortar el producto y `bg-card`/`bg-white` detrás.
- **`alt` significativo siempre** (título del producto). Decorativas → `alt=""`.
- **LCP:** la imagen del hero/primer producto debe cargar con prioridad (`fetchpriority="high"`, `loading="eager"`); el resto `loading="lazy"`.
- Mientras carga: contenedor con `bg-muted animate-pulse` (skeleton).

```tsx
<div className="aspect-square bg-card rounded-lg overflow-hidden">
  <img src={product.image} alt={product.title}
       loading="lazy" decoding="async"
       className="h-full w-full object-contain" />
</div>
```

---

## 8. Inventario de componentes

### 8.1 Primitivos shadcn/ui (`src/components/ui/`)

| Componente | Propósito | Variantes / estados | Dónde se usa |
|---|---|---|---|
| `button` | Acción primitiva (CVA) | variants: `default` (primary), `secondary`, `outline`, `ghost`, `destructive`, `link`; sizes: `sm/default/lg/icon`; estados hover/focus/disabled | En toda la app; base de AddToCart, BuyNowButton, paginación |
| `card` | Superficie contenedora | `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle` | ProductCard, paneles de cuenta/checkout, resúmenes |
| `checkbox` | Selección booleana | checked / indeterminate / disabled / focus | Facetas en `/tienda`, aceptar términos en checkout |
| `input` | Campo de texto | default / focus (`ring-ring`) / error (`border-error`) / disabled | Login, registro, búsqueda, dirección de envío |
| `label` | Etiqueta accesible | asociada vía `htmlFor` | Todos los formularios |
| `pagination` | Navegación de páginas | activo / hover / disabled (primera/última) | Listado `/tienda` |
| `select` | Selector desplegable | abierto / cerrado / opción activa / disabled | `SortSelect`, ciudad, método de envío |
| `textarea` | Texto multilínea | default / focus / error | Contenido de reseña |

### 8.2 Componentes de marca/catálogo (custom)

| Componente | Propósito | Variantes / estados | Dónde se usa |
|---|---|---|---|
| `Logo/Logo` | Identidad smartime | `showTagline` on/off; mono blanco sobre azul | Header, Footer |
| `ProductCard` | Tarjeta de producto | con/sin descuento; in/out stock; hover (AddToCart visible en md+); WishlistButton flotante | `/tienda`, carruseles, resultados |
| `ProductCarousel` | Riel horizontal (6 visibles) | con `title` + `viewAllHref`; flechas prev/next; scroll-snap | Home (por categoría) |
| `HeroCarousel` | Slides destacados | eyebrow/título/subtítulo/precio/CTA; auto/manual; dots | Home (top) |
| `BrandStrip` | Tira de marcas | logos en fila; hover sutil | Home |
| `CategoryGrid` / `CategoryTiles` | Mosaico de categorías | tile con imagen + nombre + count; **oculta si count = 0** | Home, navegación |
| `CategoryNav` | Nav horizontal de categorías | activo / hover; scrollable en móvil | Header / `/tienda` |
| `SearchBar` | Búsqueda con autocomplete | debounce 250ms; hasta 6 sugerencias; estados loading/vacío; dropdown abierto/cerrado | Header (móvil + desktop) |
| `SortSelect` | Orden del catálogo | precio asc/desc, rating; aplica server-side | `/tienda` |
| `CuotaBadge` | Financiamiento "desde L X/mes" | `compact` (oneliner) / `full` (caja + modal de cuotas); oculto si < L 3,000 | ProductCard (compact), PDP (full) |
| `ReviewStars` | Rating en estrellas | 0–5, medias estrellas; tamaño sm/md; solo-lectura o interactivo (form) | ProductCard, PDP, ReviewsSection |
| `ReviewsSection` | Lista + resumen de reseñas | con/sin reseñas; promedio + conteo; orden fecha desc | PDP (`#reviews`) |
| `ProductGallery` | Galería de imágenes PDP | thumbnails + imagen principal; estado activo | PDP |
| `AddToCart` | Agregar al carrito | idle / añadiendo / añadido (`Check`); disabled si agotado | ProductCard (hover), PDP |
| `BuyNowButton` | Compra directa | navega a checkout/carrito | PDP |
| `WishlistButton` | Guardar deseo | guardado (corazón relleno) / no guardado; flotante en card | ProductCard, PDP |
| `Cart/CartButton` | Acceso al carrito | badge de conteo + total HNL; vacío/lleno | Header |
| `account/AccountButton` | Acceso a cuenta | autenticado / no autenticado | Header |
| `account/LogoutButton` | Cerrar sesión | idle / cerrando | `/cuenta` |
| `AnnouncementBar` | Anuncio superior | descartable; un mensaje | Top de layout |
| `TrustBand` | Banda de confianza | íconos + claims (garantía, envío, retiro, pago seguro, WhatsApp) | Home, PDP, footer-adjacent |
| `PromoBanner` | Banner promocional | con CTA; variantes de color | Home / categorías |
| `FloatingWhatsApp` | Botón WhatsApp flotante | visible si `NEXT_PUBLIC_WHATSAPP_NUMBER`; deep link contextual (P1) | Todas las páginas |
| `Header/Component(.client)` (en `src/Header/`, **no** `src/components/`) | Cabecera sticky | sticky `top-0 z-40`; logo + SearchBar + Account + Cart; SearchBar duplicada móvil/desktop | Layout global |
| `Footer/Component` (en `src/Footer/`, **no** `src/components/`) | Pie | 4–5 columnas (logo+redes, comprar, ayuda, empresa, newsletter) | Layout global |

---

## 9. Patrones de UI

### 9.1 Tarjeta de producto (`ProductCard`)

Anatomía (de arriba a abajo):
1. **Media** — `aspect-square bg-card` con packshot `object-contain`; `WishlistButton` flotante arriba-derecha; **badge de descuento** arriba-izquierda si hay `originalPrice`.
2. **Meta** — marca (`metadata.brand`) y categoría en `text-xs text-muted-foreground`.
3. **Título** — `text-base font-medium line-clamp-2`, enlace a `/producto/{handle}`.
4. **Rating** — `ReviewStars` sm + conteo (`text-xs text-muted-foreground`).
5. **Precio** — actual `text-lg font-semibold tabular-nums`; tachado `originalPrice` en `text-sm text-muted-foreground line-through` + ahorro.
6. **`CuotaBadge` compact** — "desde L X/mes".
7. **`AddToCart`** — aparece en hover desde `md` (`hidden md:block`), siempre visible/táctil en móvil.

```tsx
<Card className="group rounded-lg border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
  <div className="relative aspect-square bg-card">
    {discount && (
      <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
        -{discount.percent}%
      </span>
    )}
    <WishlistButton className="absolute right-3 top-3" />
    <img src={image} alt={title} loading="lazy" className="h-full w-full object-contain" />
  </div>
  <div className="p-4 space-y-1.5">
    <p className="text-xs text-muted-foreground">{brand} · {categoryName}</p>
    <h3 className="text-base font-medium line-clamp-2">{title}</h3>
    <ReviewStars value={rating} size="sm" count={reviewCount} />
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-semibold tabular-nums">{formatPrice(price)}</span>
      {originalPrice && <span className="text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</span>}
    </div>
    <CuotaBadge price={price} variant="compact" />
    <AddToCart variantId={variantId} className="mt-2 hidden md:block" />
  </div>
</Card>
```

### 9.2 Buy box PDP

Layout: galería (`lg:col-span-1`) \| buy box (`lg:col-span-1`, opción `lg:sticky lg:top-24`).

Orden del buy box:
1. Marca + título (`h1`, Fraunces).
2. `ReviewStars` + enlace "(N reseñas)" → `#reviews`.
3. **Precio** grande + descuento (% y ahorro en Lempiras).
4. **`CuotaBadge` full** — caja `bg-primary/5 border border-primary/20 rounded-lg p-4` con "desde L X/mes" + enlace "Ver planes de cuotas" (abre modal).
5. **Variantes / swatches** (P0.4) — al cambiar, actualizan precio, cuota y stock.
6. **Estado de stock** como texto/badge: "En stock" (`success`), "Últimas unidades" (`warning`), "Agotado" (`error`) — **nunca número crudo** (RNF-SEC-07). **Pendiente (objetivo de diseño, no estado actual):** hoy `toViewProduct` en `src/lib/medusa/data.ts` fija `inStock: true` hardcodeado, por lo que en la práctica siempre se muestra "En stock"; los estados variables ("Últimas unidades"/"Agotado") aún no están implementados.
7. **Entrega por ciudad** (P0.2/P0.4) — "Recíbelo en Tegucigalpa entre el 2–4 jul" o "Retiro disponible hoy"; ciudad recordada por cookie.
8. **`AddToCart`** (primaria) + **`BuyNowButton`** (secundaria/outline).
9. **TrustBand** compacta: garantía, sellado, devolución, pago seguro.

### 9.3 CuotaBadge (compact / full + modal)

- **compact** (tarjeta): una línea `text-sm text-primary` — "o L 2,749/mes" (cuota del plazo mayor que califica).
- **full** (PDP): caja destacada azul suave con título "Págalo en cuotas", la cuota mensual mínima en grande, y CTA "Ver planes" que abre **modal**.
- **Modal de cuotas:** tabla con planes **3 / 6 / 12 meses (0% interés)**; columnas: plazo · cuota mensual (`precio / meses`, `tabular-nums`) · total. Disclaimer al pie: "Cuotas 0% con tarjetas participantes (BAC, Ficohsa, Atlántida, Banpaís). Sujeto a aprobación del banco emisor."
- **Regla de negocio:** solo si `price ≥ MIN_FINANCING_AMOUNT (3000)`; si no, no se renderiza (utilidad `startingMonthly` retorna `null`).
- **Modal a11y:** atrapa foco, cierra con `Esc`, `role="dialog"` + `aria-modal="true"`, retorno de foco al disparador.

### 9.4 Banda de confianza (`TrustBand`)

Fila de 4–5 ítems (ícono + claim corto). Móvil: 2 columnas; desktop: fila. Claims: "Garantía oficial", "Producto sellado", "Pago 100% seguro", "Retiro en tienda Tegus/SPS", "Soporte por WhatsApp". Tono honesto, sin superlativos vacíos.

```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
  <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
    <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
    <span className="text-sm">Garantía oficial</span>
  </div>
  {/* … */}
</div>
```

### 9.5 Reseñas / estrellas (`ReviewStars`, `ReviewsSection`)

- `ReviewStars` solo-lectura: estrellas `text-warning` (rellenas) / `text-muted` (vacías), medias con clip. Acompañar con texto accesible (`aria-label="4.6 de 5 estrellas"`).
- En el **formulario** de reseña (post-compra, `/cuenta` o PDP), las estrellas son interactivas (hover + click + teclado con flechas), `role="radiogroup"`.
- **Badge "Compra verificada"** en reseñas `verified=true`: `bg-success/30 text-foreground` con ícono `CheckCircle2`.
- `ReviewsSection`: cabecera con promedio grande (1 decimal) + conteo + distribución opcional; lista ordenada por fecha desc; estado vacío "Sé el primero en opinar".

### 9.6 Badges de descuento

- **Porcentaje** (tarjeta/PDP): píldora `bg-primary text-primary-foreground` "-15%" arriba-izquierda.
- **Ahorro** (PDP): texto "Ahorrás L 5,000" en `text-success` o `text-primary`.
- Cálculo desde `getDiscount(price, originalPrice)` → `{ percent, save }` (`src/utilities/format.ts`). No mostrar descuento si no hay `originalPrice`.
- **Precedencia de `originalPrice`** (precio tachado, base del % y del ahorro): primero `calculated_price.original_amount` (si es mayor que `price`); si no aplica, `metadata.compare_at_price` (si es mayor que `price`). Es decir, `original_amount` tiene prioridad sobre `compare_at_price`.

### 9.7 WhatsApp flotante (`FloatingWhatsApp`)

- Botón circular fijo abajo-derecha (`fixed bottom-4 right-4 z-40`), `bg-[#25D366]` (verde WhatsApp, excepción de marca permitida) con ícono blanco, `shadow-lg`, `rounded-full h-14 w-14`.
- `aria-label="Escríbenos por WhatsApp"`.
- P1: deep link `https://wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>?text=` con contexto (título + URL del producto).
- No tapar acciones primarias en móvil; respetar `safe-area-inset`.

---

## 10. Estados de UI y microcopy

### 10.1 Matriz de estados

| Patrón | Cargando | Vacío | Error |
|---|---|---|---|
| **Listado `/tienda`** | Skeleton grid (`bg-muted animate-pulse` con `aspect-square`) | "No encontramos productos con esos filtros." + botón "Limpiar filtros" | "No pudimos cargar el catálogo. Reintentar." |
| **Búsqueda (autocomplete)** | Spinner pequeño en el dropdown | "Sin resultados para «{q}»." | Silencioso (no romper la barra) |
| **PDP** | Skeleton de galería + buy box | (404 → `/not-found`) | Mensaje + enlace a `/tienda` |
| **Carrito** | Skeleton de ítems | "Tu carrito está vacío." + "Ir a la tienda" | "No pudimos actualizar el carrito." |
| **Checkout** | "Procesando…" en botón (`aria-busy`) | "No hay nada que pagar." + enlace a `/tienda` | "No pudimos procesar tu pago. Tu carrito sigue intacto." + reintentar |
| **Cuenta → Mis pedidos** | Skeleton de filas | "Aún no tenés pedidos." + "Explorar productos" | "No pudimos cargar tus pedidos." |
| **Reseñas** | Skeleton de tarjetas | "Sé el primero en opinar." | Mensaje suave |
| **Wishlist** | — | "Tu lista de deseos está vacía." | — |

### 10.2 Microcopy clave (es-HN)

| Contexto | Texto |
|---|---|
| CTA agregar | "Agregar al carrito" → "Agregado ✓" |
| CTA comprar ya | "Comprar ahora" |
| Gate de checkout (D1) | "Iniciá sesión o creá tu cuenta para finalizar la compra. Así podés seguir tu pedido y dejar reseñas." |
| Registro express | "Creá tu cuenta en un paso" |
| Cuota | "Desde L {X}/mes · 0% interés" |
| Stock | "En stock" · "Últimas unidades" · "Agotado" |
| Envío/ETA | "Recíbelo entre el {d1} y {d2}" · "Retiro disponible {fecha}" |
| Envío gratis | "Envío gratis en compras sobre L 25,000" |
| Pago seguro | "Pago 100% seguro · sin cargos sorpresa" |
| Confirmación pedido | "¡Listo! Tu pedido #{n} está confirmado." |
| Error de pago | "No pudimos procesar tu pago. Tu carrito sigue intacto, podés reintentar." |
| Reseña verificada | "Compra verificada" |

> Principio de microcopy: **decir qué pasó y qué hacer después**. Nunca un error sin salida.

---

## 11. Accesibilidad (objetivo WCAG 2.1 AA)

| Área | Regla | Implementación |
|---|---|---|
| **Contraste** | Texto normal ≥ 4.5:1; grande ≥ 3:1 | `foreground` (oklch 21%) sobre `background`/`card` cumple holgado. **Cuidado:** `text-muted-foreground` (48%) solo para texto secundario, no para datos críticos. El azul `primary` (55%) sobre blanco para texto requiere tamaño/peso suficiente; preferir `primary` para fondos de botón con `primary-foreground`. |
| **Foco visible** | Nunca remover outline sin reemplazo | Global `* { outline-ring/50 }`; en interactivos `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. Anillo azul = `--ring`. |
| **Teclado** | Toda acción alcanzable y operable por teclado | Orden de tabulación lógico; modales (cuotas) atrapan foco y cierran con `Esc`; carrusel navegable con flechas; dropdown de búsqueda con ↑/↓/Enter/Esc. |
| **Labels** | Todo control con nombre accesible | `label htmlFor` en formularios; `aria-label` en botones-ícono (carrito, wishlist, WhatsApp, cerrar). |
| **Color no es el único canal** | Estado comunicado también por texto/ícono | Stock como texto ("Agotado") no solo color; errores con texto + ícono; reseña verificada con texto, no solo badge de color. |
| **Imágenes** | `alt` significativo | Producto: título; decorativas: `alt=""` / `aria-hidden`. |
| **Formularios** | Errores accesibles | Mensaje asociado vía `aria-describedby`; `aria-invalid` en campo; resumen de errores al inicio del form. |
| **Movimiento** | Respetar `prefers-reduced-motion` | Animaciones (`tw-animate-css`, autoplay del hero) se reducen/pausan; `motion-reduce:transition-none`. |
| **Estructura** | Landmarks y jerarquía de headings | `header`/`main`/`nav`/`footer`; un solo `h1` por página; orden de h2/h3 sin saltos. |
| **Targets táctiles** | ≥ 44×44px en móvil | Botones-ícono `h-11 w-11` mínimo en móvil (`size-icon` ampliado). |

---

## 12. Localización (es-HN / HNL)

- **Idioma:** español de Honduras, voseo suave en CTAs/confianza (§1.3). `<html lang="es-HN">`.
- **Moneda — `formatPrice` (`src/utilities/format.ts`):**

```ts
new Intl.NumberFormat('es-HN', {
  style: 'currency', currency: 'HNL', minimumFractionDigits: 0, maximumFractionDigits: 2,
}).format(amount) // → "L 32,999"
```

  - **Sin decimales forzados** (`minimumFractionDigits: 0`), pero con `maximumFractionDigits: 2`: un importe entero se muestra sin decimales (`L 32,999`) y uno con fracción puede mostrar hasta 2 decimales.
  - Precios en **unidades mayores** de HNL: `amount = 24999` ⇒ `L 24,999` (nunca dividir por 100, nunca centavos).
  - Símbolo "L" antepuesto, separador de miles con coma. Usar `tabular-nums` al renderizar.
- **Descuento — `getDiscount`** retorna `{ percent, save }`; `save` se formatea con `formatPrice`.
- **Financiamiento — `financing.ts`:** `MIN_FINANCING_AMOUNT = 3000`; planes 3/6/12 meses 0%; `startingMonthly()` → `{ amount, months }` o `null`. La cuota mensual mostrada = `precio / meses` (interés 0%).
- **Fechas (ETA, pedidos):** formato local es-HN (`Intl.DateTimeFormat('es-HN', { day:'numeric', month:'short' })` → "2 jul"); rangos "entre el 2 y 4 jul".
- **Números:** `toLocaleString('es-HN')` para cantidades; estrellas/ratings con 1 decimal ("4.6").

---

### Apéndice — Trazabilidad patrón ↔ RF (de `01-PRD.md`)

| Patrón / componente | RF que soporta |
|---|---|
| ProductCard + CuotaBadge compact + ReviewStars | RF-CAT-01, RF-PDP-05/P0.5, RF-REV-02 |
| SearchBar autocomplete | RF-CAT-02 |
| CategoryGrid (oculta count=0) | RF-CAT-03 |
| Buy box PDP + estados de stock + entrega por ciudad | RF-PDP-01, RF-PDP-03 |
| CuotaBadge full + modal | RF-PDP-01, RF-PDP-02 |
| Carrito (subtotal, qty, envío placeholder) | RF-CAR-01 |
| Gate de autenticación + microcopy | RF-CHK-01, RF-AUTH-01/02 |
| Checkout (envío con ETA, resumen, pago) | RF-CHK-02, RF-PAY-01, RF-SHIP-01/02/03 |
| Mis pedidos (estado + ETA) | RF-ORD-01, RF-ORD-02 |
| ReviewsSection + badge verificada | RF-REV-01, RF-REV-02 |
| WishlistButton | RF-WL-01 |
| FloatingWhatsApp (deep link) | RF-WA-01 |
| TrustBand + estados accesibles | RNF-A11Y-03, P1.4 |

> Para el detalle técnico de cada componente ver **`02-TRD.md`**; para los recorridos completos **`04-app-flow.md`**; para qué datos los alimentan **`05-schema-db.md`**.
