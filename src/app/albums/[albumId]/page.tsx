
'use client'
import { theme } from '@/config/theme'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { formatFileSize } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ArrowLeft, Upload, Trash2, Download, Eye, Globe, Lock, Calendar, FileImage, Share2, Copy, Link as LinkIcon, X, Clock, FolderOpen, Edit } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ImageDisplay from '@/components/ui/ImageDisplay'

interface Album {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
}

interface ImageData {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  public_url: string
  storage_path: string
  alt_text: string | null
  created_at: string
}

export default function AlbumDetailPage({ params }: { params: Promise<{ albumId: string }> }) {
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameImageId, setRenameImageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const openRenameModal = (image: ImageData) => {
    setRenameImageId(image.id);
    setRenameValue(image.original_name);
    setShowRenameModal(true);
  };

  const handleRename = async () => {
    if (!renameImageId || !renameValue.trim()) return;
    setRenaming(true);
    try {
      const { error } = await supabase
        .from('images')
        .update({ original_name: renameValue.trim() })
        .eq('id', renameImageId)
        .eq('user_id', user?.id);
      if (error) throw error;
      setImages(prev => prev.map(img => img.id === renameImageId ? { ...img, original_name: renameValue.trim() } : img));
      setShowRenameModal(false);
      setRenameImageId(null);
      setRenameValue('');
    } catch (err) {
      alert('Failed to rename image.');
    } finally {
      setRenaming(false);
    }
  };
  const { user, loading } = useAuth()
  const router = useRouter()
  const [album, setAlbum] = useState<Album | null>(null)
  const [images, setImages] = useState<ImageData[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareImageId, setShareImageId] = useState<string | null>(null)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [availableAlbums, setAvailableAlbums] = useState<Album[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [albumId, setAlbumId] = useState<string>('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const getAlbumId = async () => {
      const resolvedParams = await params
      setAlbumId(resolvedParams.albumId)
    }
    getAlbumId()
  }, [params])

  useEffect(() => {
    if (user && albumId) {
      fetchAlbumData()
    }
  }, [user, albumId])

  // Live countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // Update every second

    return () => clearInterval(timer)
  }, [])

  const fetchAlbumData = async () => {
    try {
      // Fetch album details
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .eq('user_id', user?.id)
        .single()

      if (albumError) throw albumError
      setAlbum(albumData)

      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('album_id', albumId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (imagesError) throw imagesError
      setImages(imagesData || [])

    } catch (error) {
      console.error('Error fetching album data:', error)
      router.push('/albums')
    } finally {
      setLoadingData(false)
    }
  }

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return
    const confirmed = confirm(`Are you sure you want to delete ${selectedImages.size} image(s)? This action cannot be undone.`)
    if (!confirmed) return

    try {
      // Delete from storage and database
      const imagesToDelete = images.filter(img => selectedImages.has(img.id))
      const storagePaths = imagesToDelete.map(img => img.storage_path)
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from('images').remove(storagePaths)
        if (storageError) throw storageError
      }
      // Delete from database
      const { error } = await supabase
        .from('images')
        .delete()
        .in('id', Array.from(selectedImages))
        .eq('user_id', user?.id)
      if (error) throw error
      // Update local state
      setImages(prev => prev.filter(img => !selectedImages.has(img.id)))
      setSelectedImages(new Set())
    } catch (error) {
      console.error('Error deleting images:', error)
    }
  }

  const deleteSingleImage = async (image: ImageData) => {
    if (!confirm('Delete this image? This cannot be undone.')) return
    try {
      // Remove from storage first
      const { error: storageError } = await supabase.storage.from('images').remove([image.storage_path])
      if (storageError) throw storageError
      // Remove from DB
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id)
        .eq('user_id', user?.id)
      if (dbError) throw dbError
      // Update state
      setImages(prev => prev.filter(i => i.id !== image.id))
      setSelectedImages(prev => {
        const next = new Set(prev)
        next.delete(image.id)
        return next
      })
    } catch (err) {
      console.error('Error deleting image:', err)
      alert('Failed to delete image. See console for details.')
    }
  }

  // Cleanup expired images (run on mount and every X minutes)
  useEffect(() => {
    const cleanupExpiredImages = async () => {
  if (!albumId || !user?.id) return; // Guard against undefined user id causing bad UUID filter
      try {
        // Find expired images (expires_at in past or expires_on_open and opened)
        const { data: expired, error } = await supabase
          .from('images')
          .select('id, storage_path, expires_at, expires_on_open')
          .eq('album_id', albumId)
          .eq('user_id', user?.id)
        if (error) throw error
        const now = new Date()
        const expiredImages = (expired || []).filter(img => {
          if (img.expires_at && new Date(img.expires_at) < now) return true
          // Optionally: handle expires_on_open logic if you track 'opened' state
          return false
        })
        if (expiredImages.length > 0) {
          const expiredIds = expiredImages.map(img => img.id)
          const expiredPaths = expiredImages.map(img => img.storage_path)
          if (expiredPaths.length > 0) {
            await supabase.storage.from('images').remove(expiredPaths)
          }
          await supabase.from('images').delete().in('id', expiredIds)
          setImages(prev => prev.filter(img => !expiredIds.includes(img.id)))
        }
      } catch (err) {
        console.error('Error cleaning up expired images:', err)
      }
    }
    cleanupExpiredImages()
    const interval = setInterval(cleanupExpiredImages, 5 * 60 * 1000) // every 5 min
    return () => clearInterval(interval)
  }, [albumId, user?.id])

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Link copied to clipboard!') // Simple feedback for now
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy link')
    }
  }

  const getAlbumShareLink = () => {
    return `${window.location.origin}/shared-album/${albumId}`
  }

  const getImageShareLink = (imageId: string) => {
    return `${window.location.origin}/shared-image/${imageId}`
  }

  const fetchAvailableAlbums = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('albums')
        .select('id, name, is_public')
        .eq('user_id', user.id)
        .neq('id', albumId)
        .order('name')

      if (error) throw error
      // Map to Album type, filling missing fields with null/defaults
      const albums: Album[] = (data || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        is_public: a.is_public,
        description: null,
        created_at: ''
      }))
      setAvailableAlbums(albums)
    } catch (error) {
      console.error('Error fetching albums:', error)
    }
  }

  const moveSelectedImages = async (targetAlbumId: string) => {
    if (selectedImages.size === 0) return

    try {
      // Get target album info to check if it's public
      const { data: targetAlbum, error: albumError } = await supabase
        .from('albums')
        .select('is_public')
        .eq('id', targetAlbumId)
        .single()

      if (albumError) throw albumError

      // Prepare update data
      const updateData: {
        album_id: string;
        expires_at?: string | null;
        expires_on_open?: boolean;
      } = { album_id: targetAlbumId }

      // If moving to a private album, clear expiry settings
      if (!targetAlbum.is_public) {
        updateData.expires_at = null
        updateData.expires_on_open = false
      }
      // If moving to public album, keep existing expiry settings (no changes needed)

      const { error } = await supabase
        .from('images')
        .update(updateData)
        .in('id', Array.from(selectedImages))

      if (error) throw error

      // Refresh the album data
      fetchAlbumData()
      setSelectedImages(new Set())
      setShowMoveModal(false)
    } catch (error) {
      console.error('Error moving images:', error)
    }
  }

  const getExpiryInfo = (image: ImageData & { expires_at?: string | null; expires_on_open?: boolean }) => {
    // Handle "expires on open" case first - but check if it has been opened and has expiry time
    if (image.expires_on_open && !image.expires_at) {
      return { text: 'Expires on view', color: 'text-orange-600', urgent: false, bgColor: 'bg-orange-100' }
    }

    // Handle no expiry
    if (!image.expires_at) {
      return { text: 'Never expires', color: 'text-gray-600', urgent: false, bgColor: 'bg-gray-100' }
    }

    const now = currentTime // Use live time instead of new Date()
    const expiry = new Date(image.expires_at)
    const diff = expiry.getTime() - now.getTime()

    if (diff <= 0) {
      return { text: 'Expired', color: 'text-red-700', urgent: true, bgColor: 'bg-red-100' }
    }

    const totalSeconds = Math.floor(diff / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return { text: `${days}d remaining`, color: 'text-gray-700', urgent: false, bgColor: 'bg-gray-100' }
    } else if (hours > 0) {
      return {
        text: `${hours}h remaining`,
        color: hours <= 24 ? 'text-orange-700' : 'text-gray-700',
        urgent: hours <= 24,
        bgColor: hours <= 24 ? 'bg-orange-100' : 'bg-gray-100'
      }
    } else if (minutes >= 10) {
      return { text: `${minutes}m remaining`, color: 'text-red-700', urgent: true, bgColor: 'bg-red-100' }
    } else {
      // For less than 10 minutes, show live countdown with seconds
      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`
      return { text: `${formattedTime} remaining`, color: 'text-red-700', urgent: true, bgColor: 'bg-red-100' }
    }
  }

  const selectAllImages = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(images.map(img => img.id)))
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !album) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/albums">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Albums
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold" style={{ color: theme.grayscale.foreground }}>{album.name}</h1>
              {album.is_public ? (
                <Globe className="h-5 w-5" style={{ color: theme.accent.green }} />
              ) : (
                <Lock className="h-5 w-5" style={{ color: theme.grayscale.muted }} />
              )}
            </div>
            {album.description && (
              <p className="mt-1" style={{ color: theme.grayscale.muted }}>{album.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-sm" style={{ color: theme.grayscale.muted }}>
              <div className="flex items-center space-x-1">
                <FileImage className="h-4 w-4" />
                <span>{images.length} images</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(album.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {album?.is_public && (
            <Button
              variant="outline"
              onClick={() => copyToClipboard(getAlbumShareLink())}
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
              <Share2 className="h-4 w-4 mr-2" />
              Share Album
            </Button>
          )}
          <Link href={`/upload?album=${album.id}`}>
            <Button
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
              <Upload className="h-4 w-4 mr-2" />
              Add Images
            </Button>
          </Link>
        </div>
      </div>

      {/* Actions Bar */}
      {images.length > 0 && (
        <Card style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={selectAllImages}
                  className="text-sm"
                  style={{ color: theme.accent.blue, fontWeight: 500 }}
                  onMouseOver={e => { e.currentTarget.style.color = theme.accent.purple; }}
                  onMouseOut={e => { e.currentTarget.style.color = theme.accent.blue; }}
                >
                  {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedImages.size > 0 && (
                  <span className="text-sm" style={{ color: theme.grayscale.muted }}>
                    {selectedImages.size} selected
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedImages.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fetchAvailableAlbums()
                        setShowMoveModal(true)
                      }}
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
                      Move Selected
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={deleteSelectedImages}
                      style={{
                        background: theme.accent.pink,
                        color: theme.grayscale.background,
                        border: `1px solid ${theme.accent.pink}`,
                        fontWeight: 600,
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = theme.accent.orange;
                        e.currentTarget.style.borderColor = theme.accent.orange;
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = theme.accent.pink;
                        e.currentTarget.style.borderColor = theme.accent.pink;
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </>
                )}
                
                <div className="flex rounded-lg overflow-hidden border" style={{ border: `1px solid ${theme.grayscale.border}` }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className="px-3 py-1 text-sm rounded-l-lg"
                    style={{
                      background: viewMode === 'grid' ? theme.accent.blue : theme.grayscale.surface,
                      color: viewMode === 'grid' ? theme.grayscale.background : theme.grayscale.muted,
                      fontWeight: 600,
                      borderRight: `1px solid ${theme.grayscale.border}`
                    }}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className="px-3 py-1 text-sm rounded-r-lg"
                    style={{
                      background: viewMode === 'list' ? theme.accent.blue : theme.grayscale.surface,
                      color: viewMode === 'list' ? theme.grayscale.background : theme.grayscale.muted,
                      fontWeight: 600,
                    }}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images */}
      {images.length === 0 ? (
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardContent className="text-center py-12">
            <FileImage className="h-16 w-16 mx-auto mb-4" style={{ color: theme.grayscale.muted }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: theme.grayscale.foreground }}>No images in this album</h3>
            <p className="mb-6" style={{ color: theme.grayscale.muted }}>Start by uploading some images to this album</p>
            <Link href={`/upload?album=${album.id}`}>
              <Button
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
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card
              key={image.id}
              style={{
                background: theme.grayscale.surface,
                border: `1px solid ${theme.grayscale.border}`,
                color: theme.grayscale.foreground,
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.12)',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
              }}
              onClick={() => toggleImageSelection(image.id)}
            >
              <div className="relative group">
                <div
                  className="aspect-square relative overflow-hidden"
                  style={{ background: theme.grayscale.subtle }}
                >
                  <img
                    src={image.public_url}
                    alt={image.alt_text || image.original_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.2s, filter 0.2s',
                      filter: 'none',
                    }}
                    className="group-hover:scale-105 group-hover:brightness-75"
                  />
                </div>

                {/* Selection Overlay */}
                <div
                  className="absolute inset-0 transition-all duration-200"
                  style={selectedImages.has(image.id)
                    ? { boxShadow: `0 0 0 4px ${theme.accent.blue} inset` }
                    : {}}
                >
                  {/* Selection Indicator */}
                  {selectedImages.has(image.id) && (
                    <div className="absolute top-2 left-2">
                      <div style={{ width: 24, height: 24, background: theme.accent.blue, borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg className="w-4 h-4" style={{ color: theme.grayscale.background }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex space-x-1">
                      {album?.is_public && (
                        <button
                          onClick={() => copyToClipboard(getImageShareLink(image.id))}
                          style={{ background: theme.grayscale.surface, color: theme.grayscale.foreground, borderRadius: '9999px', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
                          className="p-1 hover:opacity-80"
                          title="Share image"
                        >
                          <Share2 className="h-3 w-3" />
                        </button>
                      )}
                      <a
                        href={image.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: theme.grayscale.surface, color: theme.grayscale.foreground, borderRadius: '9999px', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
                        className="p-1 hover:opacity-80"
                        title="View full size"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={image.public_url}
                        download={image.original_name}
                        style={{ background: theme.grayscale.surface, color: theme.grayscale.foreground, borderRadius: '9999px', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
                        className="p-1 hover:opacity-80"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => openRenameModal(image)}
                        style={{ background: theme.grayscale.surface, color: theme.accent.purple, borderRadius: '9999px', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
                        className="p-1 hover:opacity-80"
                        title="Rename image"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteSingleImage(image)}
                        style={{ background: theme.grayscale.surface, color: theme.accent.pink, borderRadius: '9999px', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
                        className="p-1 hover:opacity-80"
                        title="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate" style={{ color: theme.grayscale.foreground }}>
                  {image.original_name}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: theme.grayscale.muted }}>
                    {formatFileSize(image.file_size)}
                  </p>
                  {(() => {
                    const expiryInfo = getExpiryInfo(image)
                    // Map bgColor and color to theme
                    let bg, color;
                    if (expiryInfo.bgColor.includes('orange')) {
                      bg = theme.accent.orange + '22';
                      color = theme.accent.orange;
                    } else if (expiryInfo.bgColor.includes('red')) {
                      bg = theme.accent.pink + '22';
                      color = theme.accent.pink;
                    } else {
                      bg = theme.grayscale.subtle;
                      color = theme.grayscale.muted;
                    }
                    return (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: bg, color }}>
                        <Clock className="h-3 w-3 mr-1" />
                        {expiryInfo.text}
                      </span>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full" style={{ background: theme.grayscale.surface, color: theme.grayscale.foreground }}>
                <thead style={{ background: theme.grayscale.subtle }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: theme.grayscale.muted }}>
                      <input
                        type="checkbox"
                        checked={selectedImages.size === images.length && images.length > 0}
                        onChange={selectAllImages}
                        style={{ accentColor: theme.accent.blue, background: theme.grayscale.background, borderColor: theme.grayscale.border }}
                        className="w-4 h-4 rounded focus:ring-2"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: theme.grayscale.muted }}>
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: theme.grayscale.muted }}>
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: theme.grayscale.muted }}>
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: theme.grayscale.muted }}>
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: theme.grayscale.muted }}>
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: theme.grayscale.muted }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {images.map((image) => (
                    <tr key={image.id} style={{ background: theme.grayscale.surface }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedImages.has(image.id)}
                          onChange={() => toggleImageSelection(image.id)}
                          style={{ accentColor: theme.accent.blue, background: theme.grayscale.background, borderColor: theme.grayscale.border }}
                          className="w-4 h-4 rounded focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div style={{ width: 48, height: 48, position: 'relative', background: theme.grayscale.subtle, borderRadius: 8, overflow: 'hidden' }}>
                          <Image
                            src={image.public_url}
                            alt={image.alt_text || image.original_name}
                            fill
                            style={{ objectFit: 'cover', borderRadius: 8, border: 'none' }}
                            sizes="48px"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium max-w-xs truncate" style={{ color: theme.grayscale.foreground }}>
                          {image.original_name}
                        </div>
                        <div className="text-sm" style={{ color: theme.grayscale.muted }}>
                          {image.mime_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.grayscale.muted }}>
                        {formatFileSize(image.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.grayscale.muted }}>
                        {new Date(image.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(() => {
                          const expiryInfo = getExpiryInfo(image)
                          let bg, color;
                          if (expiryInfo.bgColor.includes('orange')) {
                            bg = theme.accent.orange + '22';
                            color = theme.accent.orange;
                          } else if (expiryInfo.bgColor.includes('red')) {
                            bg = theme.accent.pink + '22';
                            color = theme.accent.pink;
                          } else {
                            bg = theme.grayscale.subtle;
                            color = theme.grayscale.muted;
                          }
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ background: bg, color }}>
                              <Clock className="h-3 w-3 mr-1" />
                              {expiryInfo.text}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {album?.is_public && (
                            <button
                              onClick={() => copyToClipboard(getImageShareLink(image.id))}
                              style={{ color: theme.accent.purple }}
                              className="hover:opacity-80"
                              title="Share image"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          )}
                          <a
                            href={image.public_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: theme.accent.blue }}
                            className="hover:opacity-80"
                            title="View full size"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={image.public_url}
                            download={image.original_name}
                            style={{ color: theme.accent.green }}
                            className="hover:opacity-80"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => openRenameModal(image)}
                            style={{ color: theme.accent.purple }}
                            className="hover:opacity-80"
                            title="Rename image"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSingleImage(image)}
                            style={{ color: theme.accent.pink }}
                            className="hover:opacity-80"
                            title="Delete image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
      {/* Rename Image Modal */}
      {showRenameModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}`, borderRadius: 16, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)' }} className="p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: theme.grayscale.foreground }}>Rename Image</h2>
              <button onClick={() => setShowRenameModal(false)} style={{ color: theme.grayscale.muted }}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.grayscale.muted }}>New Name</label>
              <input
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${theme.grayscale.border}`,
                  borderRadius: 8,
                  background: theme.grayscale.background,
                  color: theme.grayscale.foreground,
                  fontSize: 16,
                  outline: 'none',
                }}
                autoFocus
                disabled={renaming}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRenameModal(false)} disabled={renaming} style={{ background: theme.grayscale.surface, color: theme.grayscale.muted, border: `1px solid ${theme.grayscale.border}` }}>Cancel</Button>
              <Button onClick={handleRename} loading={renaming} style={{ background: theme.accent.blue, color: theme.grayscale.background, border: `1px solid ${theme.accent.blue}`, fontWeight: 600 }}>Rename</Button>
            </div>
          </div>
        </div>
      )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Move Images Modal */}
      {showMoveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{
            background: theme.grayscale.surface,
            border: `1px solid ${theme.grayscale.border}`,
            borderRadius: 20,
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
            padding: 32,
            maxWidth: 520,
            width: '100%',
            margin: '0 16px',
          }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Move Images</h2>
                <p className="text-sm mt-1" style={{ color: theme.grayscale.muted }}>
                  Moving {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowMoveModal(false)}
                style={{ color: theme.grayscale.muted }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto', marginTop: 12, marginBottom: 12 }}>
              {availableAlbums.map((targetAlbum) => (
                <div
                  key={targetAlbum.id}
                  onClick={() => moveSelectedImages(targetAlbum.id)}
                  style={{
                    padding: 18,
                    border: `2px solid ${theme.grayscale.border}`,
                    borderRadius: 14,
                    marginBottom: 10,
                    background: theme.grayscale.subtle,
                    cursor: 'pointer',
                    transition: 'border 0.2s, background 0.2s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.border = `2px solid ${theme.accent.blue}`;
                    e.currentTarget.style.background = theme.accent.blue + '22';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.border = `2px solid ${theme.grayscale.border}`;
                    e.currentTarget.style.background = theme.grayscale.subtle;
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: targetAlbum.is_public ? theme.accent.green + '22' : theme.grayscale.background }}>
                        {targetAlbum.is_public ? (
                          <Globe style={{ width: 22, height: 22, color: theme.accent.green }} />
                        ) : (
                          <Lock style={{ width: 22, height: 22, color: theme.grayscale.muted }} />
                        )}
                      </div>
                      <div>
                        <h3 style={{ color: theme.grayscale.foreground, fontWeight: 600, fontSize: 16 }}>{targetAlbum.name}</h3>
                        <p style={{ color: theme.grayscale.muted, fontSize: 13 }}>
                          {targetAlbum.is_public ? 'Public album' : 'Private album'}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {!targetAlbum.is_public && (
                        <div style={{ fontSize: 12, color: theme.accent.orange, background: theme.accent.orange + '22', padding: '2px 8px', borderRadius: 6 }}>
                          Will remove expiry
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {availableAlbums.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: 64, height: 64, background: theme.grayscale.subtle, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <FolderOpen style={{ width: 32, height: 32, color: theme.grayscale.muted }} />
                </div>
                <p style={{ color: theme.grayscale.muted, marginBottom: 16 }}>No other albums available</p>
                <Link href="/albums">
                  <Button variant="outline" size="sm">Create New Album</Button>
                </Link>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${theme.grayscale.border}` }}>
              <Button variant="outline" onClick={() => setShowMoveModal(false)} style={{ background: theme.grayscale.surface, color: theme.grayscale.muted, border: `1px solid ${theme.grayscale.border}` }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    {/* Rename Image Modal */}
    {showRenameModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <div style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}`, borderRadius: 16, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)' }} className="p-6 max-w-sm w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold" style={{ color: theme.grayscale.foreground }}>Rename Image</h2>
            <button onClick={() => setShowRenameModal(false)} style={{ color: theme.grayscale.muted }}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: theme.grayscale.muted }}>New Name</label>
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${theme.grayscale.border}`,
                borderRadius: 8,
                background: theme.grayscale.background,
                color: theme.grayscale.foreground,
                fontSize: 16,
                outline: 'none',
              }}
              autoFocus
              disabled={renaming}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRenameModal(false)} disabled={renaming} style={{ background: theme.grayscale.surface, color: theme.grayscale.muted, border: `1px solid ${theme.grayscale.border}` }}>Cancel</Button>
            <Button onClick={handleRename} loading={renaming} style={{ background: theme.accent.blue, color: theme.grayscale.background, border: `1px solid ${theme.accent.blue}`, fontWeight: 600 }}>Rename</Button>
          </div>
        </div>
      </div>
    )}
  </div>
  )
}
