'use client'
import { theme } from '@/config/theme'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Camera, Upload, FolderOpen, Zap, Shield, Globe } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold" style={{ color: theme.grayscale.foreground }}>
            Modern Image Hosting
          </h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: theme.grayscale.muted }}>
            Upload, organize, and share your images with a clean, minimalist platform.
            Built for developers with powerful APIs.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  style={{
                    background: theme.accent.blue,
                    color: theme.grayscale.background,
                    border: `1px solid ${theme.accent.blue}`,
                    fontWeight: 600,
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = theme.accent.purple;
                    e.currentTarget.style.borderColor = theme.accent.purple;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = theme.accent.blue;
                    e.currentTarget.style.borderColor = theme.accent.blue;
                  }}
                >
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/upload">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  style={{
                    background: theme.grayscale.surface,
                    color: theme.accent.blue,
                    border: `1px solid ${theme.accent.blue}`,
                    fontWeight: 600,
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = theme.accent.blue;
                    e.currentTarget.style.color = theme.grayscale.background;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = theme.grayscale.surface;
                    e.currentTarget.style.color = theme.accent.blue;
                  }}
                >
                  Upload Images
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  style={{
                    background: theme.accent.blue,
                    color: theme.grayscale.background,
                    border: `1px solid ${theme.accent.blue}`,
                    fontWeight: 600,
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = theme.accent.purple;
                    e.currentTarget.style.borderColor = theme.accent.purple;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = theme.accent.blue;
                    e.currentTarget.style.borderColor = theme.accent.blue;
                  }}
                >
                  Get Started Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto" style={{ background: theme.accent.blue + '22' }}>
              <Upload className="h-6 w-6" style={{ color: theme.accent.blue }} />
            </div>
            <h3 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Drag & Drop Upload</h3>
            <p style={{ color: theme.grayscale.muted }}>
              Simply drag and drop your images for instant upload with progress tracking.
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto" style={{ background: theme.accent.green + '22' }}>
              <FolderOpen className="h-6 w-6" style={{ color: theme.accent.green }} />
            </div>
            <h3 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Album Management</h3>
            <p style={{ color: theme.grayscale.muted }}>
              Organize your images into albums with easy management and sharing options.
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto" style={{ background: theme.accent.purple + '22' }}>
              <Zap className="h-6 w-6" style={{ color: theme.accent.purple }} />
            </div>
            <h3 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>API Access</h3>
            <p style={{ color: theme.grayscale.muted }}>
              RESTful APIs for seamless integration with your projects and applications.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Benefits Section */}
      <section
        className="rounded-2xl p-8 md:p-12"
        style={{
          background: theme.grayscale.surface,
          border: `1px solid ${theme.grayscale.border}`,
          color: theme.grayscale.foreground,
        }}
      >
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-bold" style={{ color: theme.grayscale.foreground }}>Why Choose Seruvo?</h2>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: theme.grayscale.foreground }}>Secure & Reliable</h4>
                <p style={{ color: theme.grayscale.muted }}>Your images are stored securely with Supabase&apos;s enterprise-grade infrastructure.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: theme.grayscale.foreground }}>Global CDN</h4>
                <p style={{ color: theme.grayscale.muted }}>Fast image delivery worldwide with optimized performance and caching.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Camera className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: theme.grayscale.foreground }}>Multiple Formats</h4>
                <p style={{ color: theme.grayscale.muted }}>Support for JPEG, PNG, GIF, and WebP formats with automatic optimization.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: theme.grayscale.foreground }}>Developer Friendly</h4>
                <p style={{ color: theme.grayscale.muted }}>Clean APIs, comprehensive documentation, and easy integration.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
