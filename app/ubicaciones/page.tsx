export default function UbicacionesPage() {
  return (
    <div className="pt-20">
      {/* Header */}
      <section className="px-4 py-16 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl lg:text-4xl font-medium mb-4">Dónde Encontrarnos</h1>
        <p className="text-foreground/70">Visitanos en nuestro showroom en Palermo, Buenos Aires</p>
      </section>

      {/* Google Maps */}
      <div className="aspect-[16/9] lg:aspect-[21/9] mb-12 overflow-hidden">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d52562.20252003802!2d-58.45328229999999!3d-34.5875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb59c771eb933%3A0x6b3113b596d78c69!2sPalermo%2C%20Buenos%20Aires%2C%20Argentina!5e0!3m2!1ses!2sar!4v1234567890" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }}
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Location Info */}
      <section className="px-4 pb-16 max-w-4xl mx-auto text-center">
        <div className="p-8 border border-gray-200 rounded-lg">
          <h3 className="text-2xl font-medium mb-4">Showroom Palermo</h3>
          <p className="text-foreground/70 mb-2">Palermo, Buenos Aires, Argentina</p>
          <p className="text-foreground/70 mb-4">Visítanos con cita previa</p>
          <a 
            href="mailto:contacto@softworks.com"
            className="inline-block px-6 py-3 bg-foreground text-white rounded-full hover:bg-foreground/90 transition-colors font-medium"
          >
            Solicitar Cita
          </a>
        </div>
      </section>
    </div>
  );
}
