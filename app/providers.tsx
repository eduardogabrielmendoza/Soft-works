'use client'

import { AuthProvider } from '@/lib/hooks/useAuth'
import { CartProvider } from '@/lib/hooks/useCart'
import { SiteConfigProvider } from '@/lib/hooks/useSiteConfig'
import { IndexContentProvider } from '@/lib/hooks/useIndexContent'
import { PagesContentProvider } from '@/lib/hooks/usePagesContent'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteConfigProvider>
        <IndexContentProvider>
          <PagesContentProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </PagesContentProvider>
        </IndexContentProvider>
      </SiteConfigProvider>
    </AuthProvider>
  )
}
