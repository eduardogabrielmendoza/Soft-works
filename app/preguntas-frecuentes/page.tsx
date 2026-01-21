export default function FAQPage() {
  const faqs = [
    {
      question: '¿Cuál es su política de devoluciones?',
      answer: 'Aceptamos devoluciones dentro de 30 días de la compra.',
    },
    {
      question: '¿Hacen envíos internacionales?',
      answer: 'No, hacemos envíos solo dentro de Argentina.',
    },
    {
      question: '¿Cuánto tarda el envío?',
      answer: 'Los envíos estándar tardan entre 5-7 días hábiles.',
    },
    {
      question: '¿Cuál es la guía de tallas?',
      answer: 'Cada producto incluye una guía de tallas detallada en su página.',
    },
  ];

  return (
    <div className="pt-20 px-4 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl lg:text-4xl font-medium mb-4">Preguntas Frecuentes</h1>
      <p className="text-foreground/70 mb-12">Encuentra respuestas a las preguntas más comunes</p>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="pb-6 border-b border-gray-200">
            <h3 className="text-lg font-medium mb-2">{faq.question}</h3>
            <p className="text-foreground/70">{faq.answer}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gray-50 rounded-lg text-center">
        <p className="text-foreground/70 mb-4">¿No encontraste lo que buscabas?</p>
        <a
          href="/contacto"
          className="inline-block px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
        >
          Contáctanos
        </a>
      </div>
    </div>
  );
}
