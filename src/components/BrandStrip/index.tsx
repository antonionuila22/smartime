import React from 'react'

// Logos vía svgl.app (Apple/PlayStation/Xbox) + Simple Icons (marcas de consumo).
const BRANDS = [
  { name: 'Apple', src: 'https://svgl.app/library/apple.svg' },
  { name: 'Samsung', src: 'https://cdn.simpleicons.org/samsung' },
  { name: 'Sony', src: 'https://cdn.simpleicons.org/sony' },
  { name: 'LG', src: 'https://cdn.simpleicons.org/lg' },
  { name: 'JBL', src: 'https://cdn.simpleicons.org/jbl' },
  { name: 'Bose', src: 'https://cdn.simpleicons.org/bose' },
  { name: 'PlayStation', src: 'https://svgl.app/library/playstation.svg' },
  { name: 'Xbox', src: 'https://svgl.app/library/xbox.svg' },
]

export const BrandStrip: React.FC = () => {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="container py-10">
        <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Trabajamos con las mejores marcas
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-7 md:gap-x-12">
          {BRANDS.map((b) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={b.name}
              src={b.src}
              alt={b.name}
              title={b.name}
              loading="lazy"
              className="h-6 w-auto opacity-60 grayscale transition duration-300 hover:scale-105 hover:opacity-100 hover:grayscale-0 md:h-8"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
