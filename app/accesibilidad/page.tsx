export default function AccesibilidadPage() {
  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl lg:text-4xl font-medium mb-6">Declaración de Accesibilidad</h1>
      <p className="text-sm text-foreground/70 mb-8">Última actualización: Enero 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/70">
        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Nuestro Compromiso</h2>
          <p>
            Softworks está comprometido con garantizar que nuestro sitio web sea accesible 
            para todas las personas, incluyendo aquellas con discapacidades. 
            Nos esforzamos por cumplir con las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 nivel AA.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Características de Accesibilidad</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Navegación por teclado completa</li>
            <li>Texto alternativo para todas las imágenes</li>
            <li>Contraste de color adecuado</li>
            <li>Tamaños de texto escalables</li>
            <li>Etiquetas ARIA para tecnologías de asistencia</li>
            <li>Formularios accesibles con etiquetas claras</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Mejora Continua</h2>
          <p>
            Continuamente trabajamos para mejorar la accesibilidad de nuestro sitio. 
            Realizamos auditorías regulares y actualizaciones para garantizar que 
            cumplamos con los estándares más recientes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Compatibilidad</h2>
          <p>
            Nuestro sitio está diseñado para funcionar con las siguientes tecnologías de asistencia:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Lectores de pantalla (JAWS, NVDA, VoiceOver)</li>
            <li>Software de ampliación de pantalla</li>
            <li>Software de reconocimiento de voz</li>
            <li>Navegadores web modernos con soporte de accesibilidad</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Retroalimentación</h2>
          <p>
            Valoramos tus comentarios sobre la accesibilidad de nuestro sitio. 
            Si encuentras alguna barrera de accesibilidad o tienes sugerencias para mejorar, 
            por favor contáctanos en accesibilidad@softworks.com
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Limitaciones Conocidas</h2>
          <p>
            A pesar de nuestros esfuerzos, algunas áreas de nuestro sitio pueden tener 
            limitaciones temporales de accesibilidad. Estamos trabajando activamente 
            para abordar estos problemas.
          </p>
        </section>
      </div>
    </div>
  );
}
