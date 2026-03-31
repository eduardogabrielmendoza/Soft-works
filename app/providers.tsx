'use client'

import { AuthProvider } from '@/lib/hooks/useAuth'
import { CartProvider } from '@/lib/hooks/useCart'
import { SiteConfigProvider } from '@/lib/hooks/useSiteConfig'
import { IndexContentProvider } from '@/lib/hooks/useIndexContent'
import { PagesContentProvider } from '@/lib/hooks/usePagesContent'
import { LayoutContentProvider } from '@/lib/hooks/useLayoutContent'
import { NotificationsProvider } from '@/lib/hooks/useNotifications'
import SmoothScroll from '@/app/components/SmoothScroll'

interface ProvidersProps {
  children: React.ReactNode
  initialData?: Record<string, any>
}

export function Providers({ children, initialData }: ProvidersProps) {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <SmoothScroll />
        <SiteConfigProvider initialData={initialData?.siteConfig}>
          <LayoutContentProvider initialData={initialData?.layout}>
            <IndexContentProvider initialData={initialData?.index}>
              <PagesContentProvider>
                <CartProvider>
                  {children}
                </CartProvider>
              </PagesContentProvider>
            </IndexContentProvider>
          </LayoutContentProvider>
        </SiteConfigProvider>
      </NotificationsProvider>
    </AuthProvider>
  )
}
