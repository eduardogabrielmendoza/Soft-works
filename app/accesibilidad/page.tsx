import LegalPageLayout from '../components/LegalPageLayout';

export default function AccesibilidadPage() {
  return (
    <LegalPageLayout title="Declaración de Accesibilidad" lastUpdated="Enero 2026">
      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">Nuestro Compromiso</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Softworks está comprometido con garantizar que nuestro sitio web sea accesible 
          para todas las personas, incluyendo aquellas con discapacidades. 
          Nos esforzamos por cumplir con las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 nivel AA.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">Características de Accesibilidad</h2>
        <ul className="list-disc pl-6 space-y-2 text-[#545454]/70">
          <li>Navegación por teclado completa</li>
          <li>Texto alternativo para todas las imágenes</li>
          <li>Contraste de color adecuado</li>
          <li>Tamaños de texto escalables</li>
          <li>Etiquetas ARIA para tecnologías de asistencia</li>
          <li>Formularios accesibles con etiquetas claras</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">Mejora Continua</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Continuamente trabajamos para mejorar la accesibilidad de nuestro sitio. 
          Realizamos auditorías regulares y actualizaciones para garantizar que 
          cumplamos con los estándares más recientes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">Compatibilidad</h2>
        <p className="text-[#545454]/70 leading-relaxed mb-3">
          Nuestro sitio está diseñado para funcionar con las siguientes tecnologías de asistencia:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[#545454]/70">
          <li>Lectores de pantalla (JAWS, NVDA, VoiceOver)</li>
          <li>Software de ampliación de pantalla</li>
          <li>Software de reconocimiento de voz</li>
          <li>Navegadores web modernos con soporte de accesibilidad</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">Retroalimentación</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Valoramos tus comentarios sobre la accesibilidad de nuestro sitio. 
          Si encuentras alguna barrera de accesibilidad o tienes sugerencias para mejorar, 
          por favor contáctanos en 
          <a href="mailto:softworksargentina@gmail.com" className="text-[#545454] underline hover:no-underline ml-1">
            softworksargentina@gmail.com
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
