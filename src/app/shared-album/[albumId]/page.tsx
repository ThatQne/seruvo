'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { formatFileSize } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Download, Eye, Globe, Calendar, FileImage, Share2, Copy } from 'lucide-react'
import Image from 'next/image'

interface Album {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  user_id: string
}

interface AlbumImage {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  public_url: string
  created_at: string
  expires_at: string | null
  expires_on_open: boolean
}

export default function SharedAlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const [album, setAlbum] = useState<Album | null>(null)
  const [images, setImages] = useState<AlbumImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [albumId, setAlbumId] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    const getAlbumId = async () => {
      const resolvedParams = await params
      setAlbumId(resolvedParams.albumId)
    }
    getAlbumId()
  }, [params])

  useEffect(() => {
    if (albumId) {
      fetchSharedAlbum()
    }
  }, [albumId])

  const fetchSharedAlbum = async () => {
    try {
      // Fetch album details
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .eq('is_public', true)
        .single()

      if (albumError || !albumData) {
        setError('Album not found or is not public')
        setLoading(false)
        return
      }

      setAlbum(albumData)

      // Fetch album images (only non-expired ones)
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('album_id', albumId)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })

      if (imagesError) {
        console.error('Error fetching images:', imagesError)
        setImages([])
      } else {
        setImages(imagesData || [])
      }

    } catch (error) {
      console.error('Error fetching shared album:', error)
      setError('Failed to load album')
    } finally {
      setLoading(false)
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

  const getImageShareLink = (imageId: string) => {
    return `${window.location.origin}/shared-image/${imageId}`
  }

  const downloadImage = async (image: AlbumImage) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !album) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <Card>
          <CardContent className="text-center py-12">
            <FileImage className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Album Not Available</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/auth')}>
              Create Your Own Albums
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Album Header */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{album.name}</h1>
                <div className="flex items-center space-x-1 text-green-600">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Public</span>
                </div>
              </div>
              {album.description && (
                <p className="text-gray-600 mb-3">{album.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(album.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileImage className="h-4 w-4" />
                  <span>{images.length} images</span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(window.location.href)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Album
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Images Grid */}
      {images.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileImage className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images in this album</h3>
            <p className="text-gray-600">This album doesn't contain any images yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative group">
                <div className="aspect-square relative bg-gray-100 overflow-hidden">
                  <Image
                    src={image.public_url}
                    alt={image.original_name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => copyToClipboard(getImageShareLink(image.id))}
                      className="p-1 bg-white rounded-full shadow-lg hover:bg-gray-50"
                      title="Share image"
                    >
                      <Share2 className="h-3 w-3 text-gray-600" />
                    </button>
                    <a
                      href={image.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 bg-white rounded-full shadow-lg hover:bg-gray-50"
                      title="View full size"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </a>
                    <button
                      onClick={() => downloadImage(image)}
                      className="p-1 bg-white rounded-full shadow-lg hover:bg-gray-50"
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium truncate">{image.original_name}</p>
                  <p className="text-white/80 text-xs">{formatFileSize(image.file_size)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-medium text-gray-900 mb-2">Want to create your own albums?</h3>
          <p className="text-gray-600 mb-4">
            Sign up to organize and share your images with custom albums
          </p>
          <Button onClick={() => router.push('/auth')}>
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
