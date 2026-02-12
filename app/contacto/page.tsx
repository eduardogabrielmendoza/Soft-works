'use client';

import { useState } from 'react';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';
import { usePagesContent } from '@/lib/hooks/usePagesContent';
import CustomSectionsRenderer from '@/app/components/CustomSections';
import { Loader2 } from 'lucide-react';

export default function ContactoPage() {
  const { config, isLoading: configLoading } = useSiteConfig();
  const { contacto: content, isLoading: contentLoading } = usePagesContent();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío del formulario
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitMessage(content.formLabels.successMessage);
    setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
    setIsSubmitting(false);
    
    setTimeout(() => setSubmitMessage(''), 5000);
  };

  if (configLoading || contentLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-4xl font-medium mb-4">{content.hero.title}</h1>
        <p className="text-foreground/70">{content.hero.subtitle1}</p>
        <p className="text-foreground/70">{content.hero.subtitle2}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {submitMessage}
            </div>
          )}
          
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium mb-2">
              {content.formLabels.nombre}
            </label>
            <input
              type="text"
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              {content.formLabels.email}
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div>
            <label htmlFor="asunto" className="block text-sm font-medium mb-2">
              {content.formLabels.asunto}
            </label>
            <input
              type="text"
              id="asunto"
              value={formData.asunto}
              onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div>
            <label htmlFor="mensaje" className="block text-sm font-medium mb-2">
              {content.formLabels.mensaje}
            </label>
            <textarea
              id="mensaje"
              value={formData.mensaje}
              onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {content.formLabels.submitting}
              </>
            ) : (
              content.formLabels.submitButton
            )}
          </button>
        </form>

        {/* Contact Info */}
        <div>
          <h2 className="text-xl font-medium mb-6">{content.infoSection.title}</h2>
          <div className="space-y-6 text-foreground/70">
            {config.contact_email && (
              <div>
                <strong className="text-foreground block mb-1">Email:</strong>
                <a href={`mailto:${config.contact_email}`} className="hover:text-foreground transition-colors">
                  {config.contact_email}
                </a>
              </div>
            )}
            
            {config.contact_phone && (
              <div>
                <strong className="text-foreground block mb-1">Teléfono:</strong>
                <a href={`tel:${config.contact_phone.replace(/\s/g, '')}`} className="hover:text-foreground transition-colors">
                  {config.contact_phone}
                </a>
              </div>
            )}
            
            {config.contact_hours && (
              <div>
                <strong className="text-foreground block mb-1">Horario:</strong>
                <p>{config.contact_hours}</p>
              </div>
            )}
            
            {config.contact_address && (
              <div>
                <strong className="text-foreground block mb-1">Dirección:</strong>
                <p>{config.contact_address}</p>
              </div>
            )}

            {/* Redes Sociales */}
            {(config.social_instagram || config.social_youtube || config.social_tiktok || config.social_twitter || config.social_facebook) && (
              <div>
                <strong className="text-foreground block mb-2">Redes Sociales:</strong>
                <div className="space-y-2">
                  {config.social_instagram && (
                    <p>
                      <span className="font-medium">Instagram:</span>{' '}
                      <a 
                        href={`https://instagram.com/${config.social_instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {config.social_instagram}
                      </a>
                    </p>
                  )}
                  {config.social_youtube && (
                    <p>
                      <span className="font-medium">YouTube:</span>{' '}
                      <a 
                        href={`https://youtube.com/@${config.social_youtube}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {config.social_youtube}
                      </a>
                    </p>
                  )}
                  {config.social_tiktok && (
                    <p>
                      <span className="font-medium">TikTok:</span>{' '}
                      <a 
                        href={`https://tiktok.com/${config.social_tiktok.replace('@', '@')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {config.social_tiktok}
                      </a>
                    </p>
                  )}
                  {config.social_twitter && (
                    <p>
                      <span className="font-medium">Twitter / X:</span>{' '}
                      <a 
                        href={`https://twitter.com/${config.social_twitter.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {config.social_twitter}
                      </a>
                    </p>
                  )}
                  {config.social_facebook && (
                    <p>
                      <span className="font-medium">Facebook:</span>{' '}
                      <a 
                        href={`https://facebook.com/${config.social_facebook}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {config.social_facebook}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomSectionsRenderer sections={content.customSections} />
    </div>
  );
}
