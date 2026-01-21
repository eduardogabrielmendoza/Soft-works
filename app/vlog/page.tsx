'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function VlogPage() {
  const [activeCategory, setActiveCategory] = useState('todos');

  const categories = ['todos', 'estilo', 'sostenibilidad', 'comunidad', 'detrás de cámaras'];
  
  const posts = [
    { id: 1, title: 'Cómo Crear un Guardarropa Cápsula', category: 'estilo', date: '15 Dic 2025' },
    { id: 2, title: 'Nuestro Compromiso con la Sostenibilidad', category: 'sostenibilidad', date: '10 Dic 2025' },
    { id: 3, title: 'Conoce a Nuestros Artesanos', category: 'detrás de cámaras', date: '5 Dic 2025' },
    { id: 4, title: 'La Historia Detrás de Nuestra Colección de Invierno', category: 'estilo', date: '1 Dic 2025' },
    { id: 5, title: 'Evento Pop-up en Barcelona', category: 'comunidad', date: '28 Nov 2025' },
    { id: 6, title: 'El Proceso de Diseño: De la Idea a la Prenda', category: 'detrás de cámaras', date: '22 Nov 2025' },
  ];

  const filteredPosts = activeCategory === 'todos' 
    ? posts 
    : posts.filter(post => post.category === activeCategory);

  return (
    <div className="pt-20 px-4 py-12 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl lg:text-4xl font-medium mb-4">Vlog</h1>
        <p className="text-foreground/70 mb-12">Contenido, estilo de vida y detrás de cámaras</p>
      </motion.div>

      {/* Filtros de categoría */}
      <div className="flex flex-wrap gap-3 mb-12">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-2 rounded-full transition-all capitalize ${
              activeCategory === category
                ? 'bg-foreground text-white'
                : 'bg-gray-100 text-foreground hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Blog Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="aspect-[16/10] bg-gray-100 rounded-lg mb-4 flex flex-col items-center justify-center group-hover:bg-gray-200 transition-colors">
              <span className="text-gray-400 text-sm mb-1">Post {post.id}</span>
              <span className="text-xs text-gray-300 capitalize">{post.category}</span>
            </div>
            <div className="text-xs text-foreground/50 uppercase tracking-wider mb-2">
              {post.date}
            </div>
            <h3 className="text-lg font-medium mb-2 group-hover:text-foreground/70 transition-colors">
              {post.title}
            </h3>
            <p className="text-sm text-foreground/70 mb-3">
              Breve descripción del artículo que captura la atención del lector...
            </p>
            <button className="text-sm font-medium underline hover:text-foreground/70 transition-colors">
              Leer más
            </button>
          </motion.article>
        ))}
      </div>

      {/* Newsletter CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-24 p-12 bg-gray-50 rounded-2xl text-center"
      >
        <h2 className="text-2xl lg:text-3xl font-medium mb-4">
          No te pierdas ningún artículo
        </h2>
        <p className="text-foreground/70 mb-6">
          Suscríbete para recibir nuestras últimas historias directamente en tu inbox
        </p>
        <form className="max-w-md mx-auto flex gap-3">
          <input
            type="email"
            placeholder="Tu email"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
          >
            Suscribirse
          </button>
        </form>
      </motion.div>
    </div>
  );
}
