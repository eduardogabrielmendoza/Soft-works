export default function FuturosSoftworksPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="px-4 py-16 lg:py-24 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl lg:text-5xl font-medium mb-6">Futuros Softworks</h1>
        <p className="text-lg text-foreground/70 leading-relaxed">
          Nuestra fundación apoya organizaciones que trabajan para desmantelar 
          las barreras que retienen a las mujeres.
        </p>
      </section>

      {/* Image Placeholder */}
      <div className="aspect-[16/9] lg:aspect-[21/9] bg-gray-100 mb-16 flex items-center justify-center">
        <span className="text-gray-400">Banner Filantropía</span>
      </div>

      {/* Impact Stats */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-medium mb-2">$XXX,XXX</div>
            <p className="text-foreground/70">Donado hasta la fecha</p>
          </div>
          <div>
            <div className="text-4xl font-medium mb-2">XX+</div>
            <p className="text-foreground/70">Organizaciones apoyadas</p>
          </div>
          <div>
            <div className="text-4xl font-medium mb-2">XXX+</div>
            <p className="text-foreground/70">Vidas impactadas</p>
          </div>
        </div>
      </section>
    </div>
  );
}
