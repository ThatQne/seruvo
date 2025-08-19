'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { formatFileSize } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Download, Clock, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

interface SharedImage {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  public_url: string
  expires_at: string | null
  expires_on_open: boolean
  opened_at: string | null
  created_at: string
}

export default function SharePage({ params }: { params: Promise<{ imageId: string }> }) {
  const [image, setImage] = useState<SharedImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageId, setImageId] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
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

  const fetchSharedImage = async () => {
    try {
      const { data, error } = await supabase
        .from('guest_images')
        .select('*')
        .eq('id', imageId)
        .single()

      if (error) {
        setError('Image not found or has expired')
        setLoading(false)
        return
      }

      // Check if image has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This image has expired and is no longer available')
        setLoading(false)
        return
      }

      // If expires on open and hasn't been opened yet, mark as opened and set expiry
      // For guest images, always trigger expiry since there's no owner authentication
      if (data.expires_on_open && !data.opened_at) {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

        await supabase
          .from('guest_images')
          .update({
            opened_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString()
          })
          .eq('id', imageId)

        data.opened_at = new Date().toISOString()
        data.expires_at = expiresAt.toISOString()
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
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Image Not Available</h1>
            <p className="text-gray-600 mb-6">{error}</p>
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
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Shared Image</h1>
        {timeRemaining && (
          <div className="flex items-center justify-center mt-2 text-sm">
            <Clock className="h-4 w-4 mr-1 text-orange-500" />
            <span className={timeRemaining === 'Expired' ? 'text-red-600' : 'text-orange-600'}>
              {timeRemaining}
            </span>
          </div>
        )}
      </div>

      {/* Image Display */}
      <Card variant="elevated">
        <CardContent className="p-0">
          <div className="relative bg-gray-100">
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
                <h2 className="text-lg font-semibold text-gray-900">{image.original_name}</h2>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <span>{formatFileSize(image.file_size)}</span>
                  <span>{image.mime_type}</span>
                  <span>Uploaded {new Date(image.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <Button onClick={downloadImage}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-medium text-gray-900 mb-2">Want to share your own images?</h3>
          <p className="text-gray-600 mb-4">
            Create an account or use guest upload for temporary image sharing
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
