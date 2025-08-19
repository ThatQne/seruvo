'use client'

import Link from 'next/link'
import { Camera, Code, FileText, Github, ExternalLink } from 'lucide-react'
import { EXTERNAL_LINKS } from '@/config/links'

import { theme } from '@/config/theme'

export default function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{
        background: theme.grayscale.surface,
        borderTop: `1px solid ${theme.grayscale.border}`,
        color: theme.grayscale.muted,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="h-8 w-8" style={{ color: theme.accent.blue }} />
              <span className="text-xl font-bold" style={{ color: theme.grayscale.foreground }}>Seruvo</span>
            </div>
            <p className="mb-4 max-w-md" style={{ color: theme.grayscale.muted }}>
              A modern, minimalist image hosting platform with drag-and-drop uploads, 
              album management, and powerful API access for developers.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href={EXTERNAL_LINKS.github.main}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                title="View on GitHub"
                style={{ color: theme.grayscale.muted }}
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Developer Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: theme.grayscale.foreground }}>
              Developer
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={EXTERNAL_LINKS.docs.api}
                  className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>API Documentation</span>
                </Link>
              </li>
              <li>
                <Link
                  href={EXTERNAL_LINKS.docs.explorer}
                  className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Code className="h-4 w-4" />
                  <span>API Explorer</span>
                </Link>
              </li>
              <li>
                <a
                  href={EXTERNAL_LINKS.github.main}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Github className="h-4 w-4" />
                  <span>Source Code</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/albums" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Albums
                </Link>
              </li>
              <li>
                <Link 
                  href="/upload" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Upload
                </Link>
              </li>
              <li>
                <Link 
                  href="/guest-upload" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Guest Upload
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2024 ImageHost. Built with Next.js and Supabase.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link
                href={EXTERNAL_LINKS.docs.api}
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
              >
                API Docs
              </Link>
              <Link
                href={EXTERNAL_LINKS.docs.explorer}
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
              >
                API Explorer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
