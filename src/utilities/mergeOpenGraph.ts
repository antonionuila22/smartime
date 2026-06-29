import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Mac y iPhone originales en Honduras, con garantía y envío a todo el país. Precios en Lempiras.',
  locale: 'es_HN',
  siteName: 'smartime',
  title: 'smartime — Apple Mac y iPhone en Honduras',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
