export default function PoliticaCookiesPage() {
  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl lg:text-4xl font-medium mb-6">Política de Cookies</h1>
      <p className="text-sm text-foreground/70 mb-8">Última actualización: Enero 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/70">
        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">¿Qué son las Cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
            cuando visitas nuestro sitio web. Nos ayudan a mejorar tu experiencia de navegación 
            y a entender cómo interactúas con nuestro sitio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Tipos de Cookies que Usamos</h2>
          
          <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Cookies Esenciales</h3>
          <p>
            Necesarias para el funcionamiento básico del sitio. 
            Permiten la navegación y el uso de funcionalidades como el carrito de compras.
          </p>

          <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Cookies de Rendimiento</h3>
          <p>
            Recopilan información sobre cómo los visitantes usan nuestro sitio, 
            como las páginas más visitadas y mensajes de error.
          </p>

          <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Cookies de Funcionalidad</h3>
          <p>
            Permiten que el sitio recuerde tus preferencias 
            (como idioma, región o preferencias de visualización).
          </p>

          <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Cookies de Marketing</h3>
          <p>
            Se utilizan para rastrear visitantes en diferentes sitios web 
            con el fin de mostrar anuncios relevantes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Gestión de Cookies</h2>
          <p>
            Puedes configurar tu navegador para rechazar cookies o para que te avise 
            cuando se envíen cookies. Sin embargo, algunas funcionalidades del sitio 
            podrían no funcionar correctamente si deshabilitas las cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Más Información</h2>
          <p>
            Para más detalles sobre cómo manejamos tus datos personales, 
            consulta nuestra Política de Privacidad.
          </p>
        </section>
      </div>
    </div>
  );
}
