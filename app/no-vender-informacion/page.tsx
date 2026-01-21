export default function NoVenderInformacionPage() {
  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl lg:text-4xl font-medium mb-6">
        No Vender o Compartir Mi Información Personal
      </h1>
      <p className="text-sm text-foreground/70 mb-8">Última actualización: Enero 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/70">
        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Tus Derechos de Privacidad</h2>
          <p>
            De acuerdo con las leyes de privacidad aplicables, incluyendo la CCPA (California Consumer Privacy Act), 
            tienes derecho a optar por no participar en la venta o el intercambio de tu información personal.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Nuestra Política</h2>
          <p>
            Softworks no vende tu información personal a terceros. 
            Respetamos tu privacidad y solo compartimos información cuando es necesario 
            para procesar tus pedidos o mejorar nuestros servicios.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Información que Compartimos</h2>
          <p>
            Podemos compartir información con:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Proveedores de servicios (procesamiento de pagos, envíos)</li>
            <li>Plataformas de análisis (para mejorar nuestro sitio)</li>
            <li>Autoridades legales (cuando lo requiera la ley)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Ejercer tus Derechos</h2>
          <p>
            Si deseas ejercer tus derechos bajo las leyes de privacidad aplicables, 
            puedes:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Solicitar acceso a tu información personal</li>
            <li>Solicitar la eliminación de tu información</li>
            <li>Optar por no recibir comunicaciones de marketing</li>
            <li>Corregir información inexacta</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Cómo Contactarnos</h2>
          <p>
            Para ejercer cualquiera de estos derechos o si tienes preguntas, 
            contáctanos en:
          </p>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            <p className="mb-2"><strong>Email:</strong> privacidad@softworks.com</p>
            <p className="mb-2"><strong>Teléfono:</strong> 1-800-SOFTWORKS</p>
            <p><strong>Dirección:</strong> Softworks Privacy Department, [Dirección]</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Tiempo de Respuesta</h2>
          <p>
            Responderemos a tu solicitud dentro de 45 días. 
            Si necesitamos más tiempo, te notificaremos la extensión y la razón.
          </p>
        </section>
      </div>
    </div>
  );
}
