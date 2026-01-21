import Image from 'next/image';

export default function ImpactoPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="px-4 py-16 lg:py-24 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl lg:text-5xl font-medium mb-6">Nuestra Producción</h1>
        <p className="text-lg text-foreground/70 leading-relaxed">
          Cada prenda es fabricada con dedicación y precisión en nuestro taller. 
          Nos comprometemos con la calidad artesanal y procesos responsables.
        </p>
      </section>

      {/* Production Pillars */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {[
            { title: 'Diseño Artesanal', desc: 'Cada pieza diseñada con atención al detalle', img: '/images/impacto1.png' },
            { title: 'Calidad Premium', desc: 'Materiales seleccionados y procesos cuidadosos', img: '/images/impacto2.png' },
            { title: 'Producción Local', desc: 'Fabricado en Argentina con orgullo', img: '/images/impacto3.png' },
          ].map((pillar, i) => (
            <div key={i} className="text-center">
              <div className="aspect-square rounded-lg mx-auto mb-6 w-full max-w-sm relative overflow-hidden group cursor-pointer">
                <Image
                  src={pillar.img}
                  alt={pillar.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-medium mb-2">{pillar.title}</h3>
              <p className="text-foreground/70">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
