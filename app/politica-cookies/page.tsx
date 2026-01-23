import LegalPageLayout from '../components/LegalPageLayout';

export default function PoliticaCookiesPage() {
  return (
    <LegalPageLayout title="Política de Cookies" lastUpdated="Enero 2026">
      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">¿Qué son las Cookies?</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
          cuando visitas nuestro sitio web. Nos ayudan a mejorar tu experiencia de navegación 
          y a entender cómo interactúas con nuestro sitio.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">Tipos de Cookies que Usamos</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-[#545454] mb-2">Cookies Esenciales</h3>
            <p className="text-[#545454]/70 leading-relaxed">
              Necesarias para el funcionamiento básico del sitio. 
              Permiten la navegación y el uso de funcionalidades como el carrito de compras.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[#545454] mb-2">Cookies de Rendimiento</h3>
            <p className="text-[#545454]/70 leading-relaxed">
              Recopilan información sobre cómo los visitantes usan nuestro sitio, 
              como las páginas más visitadas y mensajes de error.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[#545454] mb-2">Cookies de Funcionalidad</h3>
            <p className="text-[#545454]/70 leading-relaxed">
              Permiten que el sitio recuerde tus preferencias 
              (como idioma, región o preferencias de visualización).
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[#545454] mb-2">Cookies de Marketing</h3>
            <p className="text-[#545454]/70 leading-relaxed">
              Se utilizan para rastrear visitantes en diferentes sitios web 
              con el fin de mostrar anuncios relevantes.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">Gestión de Cookies</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Puedes configurar tu navegador para rechazar cookies o para que te avise 
          cuando se envíen cookies. Sin embargo, algunas funcionalidades del sitio 
          podrían no funcionar correctamente si deshabilitas las cookies.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">Más Información</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Para más detalles sobre cómo manejamos tus datos personales, 
          consulta nuestra Política de Privacidad.
        </p>
      </section>
    </LegalPageLayout>
  );
}
