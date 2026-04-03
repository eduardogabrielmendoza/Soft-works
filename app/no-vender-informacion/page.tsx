export default function NoVenderInformacionPage() {
  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl lg:text-4xl font-medium mb-6">
        No Vender o Compartir Mi Información Personal
      </h1>
      <p className="text-sm text-foreground/70 mb-8">Última actualización: Abril 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/70">
        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Tus Derechos de Privacidad</h2>
          <p>
            De acuerdo con la Ley N.° 25.326 de Protección de Datos Personales de la República Argentina 
            y su normativa complementaria, tenés derecho a conocer, acceder, rectificar y suprimir 
            tus datos personales, así como a oponerte a su tratamiento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Nuestra Política</h2>
          <p>
            Softworks no vende tu información personal a terceros. 
            Respetamos tu privacidad y solo compartimos información cuando es estrictamente necesario 
            para procesar tus pedidos o mejorar nuestros servicios, siempre en cumplimiento 
            de la legislación argentina vigente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Información que Compartimos</h2>
          <p>
            Podemos compartir información con:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Proveedores de servicios (procesamiento de pagos, logística de envíos)</li>
            <li>Plataformas de análisis (para mejorar nuestro sitio)</li>
            <li>Autoridades competentes (cuando lo requiera la legislación argentina)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Ejercer tus Derechos</h2>
          <p>
            Si deseás ejercer tus derechos bajo la Ley de Protección de Datos Personales, 
            podés:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Solicitar acceso a tus datos personales</li>
            <li>Solicitar la rectificación o actualización de tus datos</li>
            <li>Solicitar la supresión de tus datos personales</li>
            <li>Oponerte al tratamiento de tus datos</li>
          </ul>
          <p className="mt-3">
            La Dirección Nacional de Protección de Datos Personales (DNPDP), órgano de control 
            de la Ley N.° 25.326, tiene la atribución de atender denuncias y reclamos que se 
            interpongan con relación al incumplimiento de las normas sobre protección de datos personales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Cómo Contactarnos</h2>
          <p>
            Para ejercer cualquiera de estos derechos o si tenés consultas, 
            contactanos en:
          </p>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg">
            <p className="mb-2"><strong>Email:</strong> softworksargentina@gmail.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">Tiempo de Respuesta</h2>
          <p>
            Responderemos a tu solicitud dentro de los 10 días hábiles, 
            conforme lo establece la normativa vigente.
          </p>
        </section>
      </div>
    </div>
  );
}
