import LegalPageLayout from '../components/LegalPageLayout';

export default function PoliticaPrivacidadPage() {
  return (
    <LegalPageLayout title="Política de Privacidad" lastUpdated="Enero 2026">
      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">1. Información que Recopilamos</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Recopilamos información que nos proporcionas directamente cuando creas una cuenta, 
          realizas una compra, te suscribes a nuestro newsletter o te comunicas con nosotros.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">2. Cómo Usamos tu Información</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Utilizamos la información que recopilamos para procesar tus pedidos, 
          comunicarnos contigo, mejorar nuestros servicios y personalizar tu experiencia.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">3. Compartir Información</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          No vendemos ni alquilamos tu información personal a terceros. 
          Solo compartimos información cuando es necesario para procesar tus pedidos 
          o cuando lo requiere la ley.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">4. Seguridad de los Datos</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Implementamos medidas de seguridad técnicas y organizativas para proteger 
          tu información personal contra acceso no autorizado, pérdida o alteración.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">5. Tus Derechos</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Tienes derecho a acceder, corregir o eliminar tu información personal. 
          También puedes oponerte al procesamiento de tus datos o solicitar su portabilidad.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">6. Contacto</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Si tienes preguntas sobre esta Política de Privacidad, contáctanos en 
          <a href="mailto:softworksargentina@gmail.com" className="text-[#545454] underline hover:no-underline ml-1">
            softworksargentina@gmail.com
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
