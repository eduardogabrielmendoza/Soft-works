'use client'

import { AuthProvider } from '@/lib/hooks/useAuth'
import { CartProvider } from '@/lib/hooks/useCart'
import { SiteConfigProvider } from '@/lib/hooks/useSiteConfig'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteConfigProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </SiteConfigProvider>
    </AuthProvider>
  )
}
