'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { Camera, User, LogOut, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { theme } from '@/config/theme'

export default function Header() {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
    router.push('/auth')
  }

  // Close user menu on outside click or Escape
  useEffect(() => {
    if (!showUserMenu) return
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [showUserMenu])

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: theme.grayscale.surface,
        borderBottom: `1px solid ${theme.grayscale.border}`,
        color: theme.grayscale.foreground,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <Camera className="h-8 w-8" style={{ color: theme.accent.blue }} />
            <span className="text-xl font-bold" style={{ color: theme.grayscale.foreground }}>Seruvo</span>
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 transition-colors"
                  style={{ color: theme.grayscale.muted }}
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:block">{user.email}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth">
                  <Button
                    size="sm"
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
                    Sign In / Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>


    </header>
  )
}
