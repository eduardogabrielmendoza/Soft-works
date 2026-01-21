export default function TerminosServicioPage() {
  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl lg:text-4xl font-medium mb-6">Términos de Servicio</h1>
      <p className="text-sm text-foreground/70 mb-8">Última actualización: Enero 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/70">
        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">1. Aceptación de Términos</h2>
          <p>
            Al acceder y usar este sitio web, aceptas estar sujeto a estos Términos de Servicio 
            y todas las leyes y regulaciones aplicables.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">2. Uso del Sitio</h2>
          <p>
            Este sitio es solo para tu uso personal y no comercial. 
            No puedes modificar, copiar, distribuir, transmitir, mostrar, realizar, 
            reproducir, publicar o crear trabajos derivados sin nuestro consentimiento previo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">3. Productos y Precios</h2>
          <p>
            Nos reservamos el derecho de modificar o discontinuar productos sin previo aviso. 
            Los precios están sujetos a cambios sin previo aviso.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">4. Pedidos y Pagos</h2>
          <p>
            Nos reservamos el derecho de rechazar o cancelar cualquier pedido. 
            En caso de cancelación, se emitirá un reembolso completo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">5. Propiedad Intelectual</h2>
          <p>
            Todo el contenido de este sitio, incluyendo textos, gráficos, logos e imágenes, 
            es propiedad de Softworks y está protegido por leyes de derechos de autor.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground mb-3">6. Limitación de Responsabilidad</h2>
          <p>
            Softworks no será responsable por daños indirectos, incidentales, 
            especiales o consecuentes derivados del uso o incapacidad de usar nuestros servicios.
          </p>
        </section>
      </div>
    </div>
  );
}
