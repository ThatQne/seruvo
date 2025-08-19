'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import Header from './Header'
import Footer from './Footer'
import { theme } from '@/config/theme'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: theme.grayscale.background,
          color: theme.grayscale.foreground,
          fontFamily: theme.font.sans,
        }}
      >
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
