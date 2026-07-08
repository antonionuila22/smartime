/**
 * Constructores de datos estructurados (schema.org) reutilizables y PUROS (testables).
 * Se serializan con el componente `<JsonLd>`. Todas reciben la URL base absoluta del sitio.
 */

const STORE_NAME = 'smartime'
const STORE_DESCRIPTION =
  'Tecnología original en Honduras: Apple, electrodomésticos, audio, gaming y smart home, con garantía y envío a todo el país. Precios en Lempiras.'
// Redes/perfiles oficiales (rellenar cuando existan; `sameAs` refuerza la entidad de marca).
const SAME_AS: string[] = []

/** Entidad de marca (Organization). Apuntala el panel de conocimiento y la atribución. */
export function organizationJsonLd(baseUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: STORE_NAME,
    url: `${baseUrl}/`,
    description: STORE_DESCRIPTION,
    logo: `${baseUrl}/favicon.svg`,
    ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
    areaServed: { '@type': 'Country', name: 'Honduras' },
  }
}

/**
 * WebSite + SearchAction: habilita la "sitelinks search box" de Google (buscar en el sitio
 * directamente desde los resultados). El target apunta al buscador de la tienda.
 */
export function websiteJsonLd(baseUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: STORE_NAME,
    url: `${baseUrl}/`,
    inLanguage: 'es-HN',
    publisher: { '@id': `${baseUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/tienda?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export type Crumb = { name: string; url: string }

/** Migas de pan (BreadcrumbList) → resultados enriquecidos con la ruta de navegación. */
export function breadcrumbJsonLd(items: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  }
}
