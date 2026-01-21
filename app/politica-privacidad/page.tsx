export default function PoliticaPrivacidadPage() {
  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl lg:text-4xl font-medium mb-6">Política de Privacidad</h1>
      <p className="text-sm text-foreground/70 mb-8">Última actualización: Enero 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/70">
        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">1. Información que Recopilamos</h2>
          <p>
            Recopilamos información que nos proporcionas directamente cuando creas una cuenta, 
            realizas una compra, te suscribes a nuestro newsletter o te comunicas con nosotros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">2. Cómo Usamos tu Información</h2>
          <p>
            Utilizamos la información que recopilamos para procesar tus pedidos, 
            comunicarnos contigo, mejorar nuestros servicios y personalizar tu experiencia.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">3. Compartir Información</h2>
          <p>
            No vendemos ni alquilamos tu información personal a terceros. 
            Solo compartimos información cuando es necesario para procesar tus pedidos 
            o cuando lo requiere la ley.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">4. Seguridad de los Datos</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para proteger 
            tu información personal contra acceso no autorizado, pérdida o alteración.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">5. Tus Derechos</h2>
          <p>
            Tienes derecho a acceder, corregir o eliminar tu información personal. 
            También puedes oponerte al procesamiento de tus datos o solicitar su portabilidad.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">6. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta Política de Privacidad, contáctanos en 
            privacidad@softworks.com
          </p>
        </section>
      </div>
    </div>
  );
}
