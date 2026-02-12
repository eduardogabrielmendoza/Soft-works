'use client'

import { AuthProvider } from '@/lib/hooks/useAuth'
import { CartProvider } from '@/lib/hooks/useCart'
import { SiteConfigProvider } from '@/lib/hooks/useSiteConfig'
import { IndexContentProvider } from '@/lib/hooks/useIndexContent'
import { PagesContentProvider } from '@/lib/hooks/usePagesContent'
import { LayoutContentProvider } from '@/lib/hooks/useLayoutContent'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SiteConfigProvider>
        <LayoutContentProvider>
          <IndexContentProvider>
            <PagesContentProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </PagesContentProvider>
          </IndexContentProvider>
        </LayoutContentProvider>
      </SiteConfigProvider>
    </AuthProvider>
  )
}
