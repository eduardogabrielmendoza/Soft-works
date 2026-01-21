import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BrandSection from "./components/BrandSection";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Softworks - Ropa Minimalista Premium",
  description: "Marca de ropa minimalista con diseño atemporal y calidad excepcional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen overflow-x-hidden">
            {children}
          </main>
          <BrandSection />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
