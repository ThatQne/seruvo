
'use client'
import { theme } from '@/config/theme'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import { formatFileSize } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Download, Clock, AlertTriangle, ArrowLeft, Share2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface SharedImage {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  public_url: string
  expires_at: string | null
  expires_on_open: boolean
  created_at: string
  album_id: string
  user_id: string
  albums: {
    id: string
    name: string
    is_public: boolean
  }
}

export default function SharedImagePage({ params }: { params: Promise<{ imageId: string }> }) {
  const [image, setImage] = useState<SharedImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageId, setImageId] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    const getImageId = async () => {
      const resolvedParams = await params
      setImageId(resolvedParams.imageId)
    }
    getImageId()
  }, [params])

  useEffect(() => {
    if (imageId) {
      fetchSharedImage()
    }
  }, [imageId])

  // Live countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // SSE stream subscription (no polling, no Supabase Realtime access needed)
  useEffect(() => {
    if (!imageId) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) return
    const es = new EventSource(`${apiUrl}/api/stream/image/${imageId}`)

    const handleExpiredOrDeleted = (msg: string) => {
      setError(msg)
      setImage(null)
    }

    es.addEventListener('deleted', () => handleExpiredOrDeleted('This image has expired or been removed'))
    es.addEventListener('expired', () => handleExpiredOrDeleted('This image has expired and is no longer available'))
    es.addEventListener('updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          handleExpiredOrDeleted('This image has expired and is no longer available')
        } else {
          setImage(prev => prev ? { ...prev, expires_at: data.expires_at || prev.expires_at } : prev)
        }
      } catch {}
    })

    return () => {
      es.close()
    }
  }, [imageId])

  // Local expiry timeout to flip UI exactly at expires_at without requiring a server delete first
  useEffect(() => {
    if (!image || !image.expires_at) return
    const expiresAtMs = new Date(image.expires_at).getTime()
    const now = Date.now()
    const diff = expiresAtMs - now
    if (diff <= 0) {
      setError('This image has expired and is no longer available')
      setImage(null)
      return
    }
    const timeout = setTimeout(() => {
      setError('This image has expired and is no longer available')
      setImage(null)
    }, diff)
    return () => clearTimeout(timeout)
  }, [image?.expires_at])

  const fetchSharedImage = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select(`
          *,
          albums!inner(id, name, is_public)
        `)
        .eq('id', imageId)
        .eq('albums.is_public', true)
        .single()

      if (error || !data) {
        setError('Image not found or is not publicly accessible')
        setLoading(false)
        return
      }

      // Check if image has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This image has expired and is no longer available')
        setLoading(false)
        return
      }

      // Expires-on-open logic: delegate to backend endpoint to ensure consistent timing
      if (data.expires_on_open && !data.opened_at && (!user || user.id !== data.user_id)) {
        try {
          const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/open-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageId })
          })
          if (resp.ok) {
            const payload = await resp.json()
            if (payload.expires_at) {
              data.expires_at = payload.expires_at
            }
          }
        } catch (e) {
          console.warn('Failed to start open-image expiry', e)
        }
      }

      setImage(data)
    } catch (error) {
      console.error('Error fetching shared image:', error)
      setError('Failed to load image')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = async () => {
    if (!image) return

    try {
      const response = await fetch(image.public_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = image.original_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getTimeRemaining = () => {
    if (!image?.expires_at) return null

    const now = currentTime // Use live time
    const expiry = new Date(image.expires_at)
    const diff = expiry.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const totalSeconds = Math.floor(diff / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else if (minutes >= 10) {
      return `${minutes}m remaining`
    } else {
      // For less than 10 minutes, show live countdown with seconds
      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`
      return `${formattedTime} remaining`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <Card style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4" style={{ color: theme.accent.orange }} />
            <h1 className="text-2xl font-bold mb-2" style={{ color: theme.grayscale.foreground }}>Image Not Available</h1>
            <p className="mb-6" style={{ color: theme.grayscale.muted }}>{error}</p>
            <Button onClick={() => router.push('/auth')}>
              Upload Your Own Images
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!image) {
    return null
  }

  const timeRemaining = getTimeRemaining()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.grayscale.foreground }}>Shared Image</h1>
          {timeRemaining && (
            <div className="flex items-center mt-2 text-sm">
              <Clock className="h-4 w-4 mr-1" style={{ color: theme.accent.orange }} />
              <span style={{ color: timeRemaining === 'Expired' ? theme.accent.pink : theme.accent.orange }}>
                {timeRemaining}
              </span>
            </div>
          )}
        </div>
        
        {image.albums && (
          <Link href={`/shared-album/${image.albums.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Album
            </Button>
          </Link>
        )}
      </div>

      {/* Image Display */}
      <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardContent className="p-0">
          <div className="relative" style={{ background: theme.grayscale.subtle }}>
            <Image
              src={image.public_url}
              alt={image.original_name}
              width={800}
              height={600}
              className="w-full h-auto object-contain max-h-[70vh]"
              unoptimized
            />
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: theme.grayscale.foreground }}>{image.original_name}</h2>
                <div className="flex items-center space-x-4 mt-1 text-sm" style={{ color: theme.grayscale.muted }}>
                  <span>{formatFileSize(image.file_size)}</span>
                  <span>{image.mime_type}</span>
                  <span>Uploaded {new Date(image.created_at).toLocaleDateString()}</span>
                  {image.albums && (
                    <span>From album: {image.albums.name}</span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(window.location.href)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button onClick={downloadImage}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardContent className="p-6 text-center">
          <h3 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Want to share your own images?</h3>
          <p className="mb-4" style={{ color: theme.grayscale.muted }}>
            Create an account to organize and share your images with custom albums
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={() => router.push('/auth')}>
              Create Account
            </Button>
            <Button variant="outline" onClick={() => router.push('/guest-upload')}>
              Guest Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
