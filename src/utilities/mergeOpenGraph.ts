import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Tecnología original en Honduras: Apple, electrodomésticos, audio, gaming y smart home, con garantía y envío a todo el país. Precios en Lempiras.',
  locale: 'es_HN',
  siteName: 'smartime',
  title: 'smartime — Tecnología original en Honduras',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
