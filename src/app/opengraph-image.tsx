import { ImageResponse } from 'next/og'

// Imagen social por defecto (OG/Twitter). Next 16 la detecta por convención de archivo y la
// inyecta en el <head> de home y páginas de contenido que no aportan imagen propia, evitando
// que compartan un preview vacío en redes/mensajería.
export const alt = 'smartime — Tecnología original en Honduras'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Firma Next 16: new ImageResponse(<jsx>, ImageResponseOptions) con width/height del `size`.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // Mismos azules del hero (bg-gradient-to-br): #1e3a8a → #0b1220.
          backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #0b1220 100%)',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            fontSize: 148,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          smartime
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 44,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.82)',
          }}
        >
          Tecnología original en Honduras
        </div>
      </div>
    ),
    { ...size },
  )
}
