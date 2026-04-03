import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BrandSection from "./components/BrandSection";
import CookieBanner from "./components/CookieBanner";
import ChatBubble from "./components/ChatBubble";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Softworks - Tienda Online",
  description: "Marca de ropa minimalista con diseño atemporal y calidad excepcional",
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

async function getInitialData() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('configuracion_sitio')
      .select('clave, valor') as { data: Array<{ clave: string; valor: any }> | null };

    if (!data) return {};

    const result: Record<string, any> = {};
    for (const row of data) {
      if (row.clave === 'contenido_layout') {
        result.layout = typeof row.valor === 'string' ? JSON.parse(row.valor) : row.valor;
      } else if (row.clave === 'contenido_index') {
        result.index = typeof row.valor === 'string' ? JSON.parse(row.valor) : row.valor;
      } else if (row.valor && typeof row.valor === 'object') {
        if (!result.siteConfig) result.siteConfig = {};
        Object.assign(result.siteConfig, row.valor);
      }
    }
    return result;
  } catch {
    return {};
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialData = await getInitialData();

  // Preload first hero image and logo for instant display
  const firstHeroImage = initialData?.index?.heroSlides?.[0]?.image;
  const logoUrl = initialData?.layout?.header?.logoUrl;

  return (
    <html lang="es" className="overflow-x-hidden">
      <head>
        {firstHeroImage && (
          <link rel="preload" as="image" href={firstHeroImage} fetchPriority="high" />
        )}
        {logoUrl && (
          <link rel="preload" as="image" href={logoUrl} fetchPriority="high" />
        )}
      </head>
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <Providers initialData={initialData}>
          <Navbar />
          <main className="min-h-screen overflow-x-hidden">
            {children}
          </main>
          <BrandSection />
          <Footer />
          <CookieBanner />
          <ChatBubble />
        </Providers>
      </body>
    </html>
  );
}
