import LegalPageLayout from '../components/LegalPageLayout';

export default function TerminosServicioPage() {
  return (
    <LegalPageLayout title="Términos de Servicio" lastUpdated="Enero 2026">
      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">1. Aceptación de Términos</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Al acceder y usar este sitio web, aceptas estar sujeto a estos Términos de Servicio 
          y todas las leyes y regulaciones aplicables.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">2. Uso del Sitio</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Este sitio es solo para tu uso personal y no comercial. 
          No puedes modificar, copiar, distribuir, transmitir, mostrar, realizar, 
          reproducir, publicar o crear trabajos derivados sin nuestro consentimiento previo.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">3. Productos y Precios</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Nos reservamos el derecho de modificar o discontinuar productos sin previo aviso. 
          Los precios están sujetos a cambios sin previo aviso.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">4. Pedidos y Pagos</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Nos reservamos el derecho de rechazar o cancelar cualquier pedido. 
          En caso de cancelación, se emitirá un reembolso completo.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">5. Propiedad Intelectual</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Todo el contenido de este sitio, incluyendo textos, gráficos, logos e imágenes, 
          es propiedad de Softworks y está protegido por leyes de derechos de autor.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium text-[#545454] mb-4">6. Limitación de Responsabilidad</h2>
        <p className="text-[#545454]/70 leading-relaxed">
          Softworks no será responsable por daños indirectos, incidentales, 
          especiales o consecuentes derivados del uso o incapacidad de usar nuestros servicios.
        </p>
      </section>
    </LegalPageLayout>
  );
}
