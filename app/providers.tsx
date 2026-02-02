'use client'

import { AuthProvider } from '@/lib/hooks/useAuth'
import { CartProvider } from '@/lib/hooks/useCart'
import { SiteConfigProvider } from '@/lib/hooks/useSiteConfig'
import { IndexContentProvider } from '@/lib/hooks/useIndexContent'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteConfigProvider>
        <IndexContentProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </IndexContentProvider>
      </SiteConfigProvider>
    </AuthProvider>
  )
}
