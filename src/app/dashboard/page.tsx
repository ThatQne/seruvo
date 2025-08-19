
"use client"
import { useAuth } from '@/contexts/AuthContext'
import { theme } from '@/config/theme'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Upload, FolderOpen, Image as ImageIcon, Plus, Globe, Lock, Copy, Check, Code } from 'lucide-react'

interface Album {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  image_count?: number
}

interface RecentImage {
  id: string
  original_name: string
  public_url: string
  created_at: string
  album_name: string
  album_id: string
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [recentImages, setRecentImages] = useState<RecentImage[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const supabase = createSupabaseClient()

  const copyAlbumId = (albumId: string) => {
    navigator.clipboard.writeText(albumId)
    setCopiedId(albumId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  useEffect(() => {
    console.log('Dashboard useEffect:', { loading, user: !!user, loadingData })

    if (!loading && !user) {
      router.push('/auth')
      return
    }

    if (user && loadingData) {
      console.log('Starting to fetch dashboard data...')
      fetchDashboardData()
    }
  }, [user, loading])

  const fetchDashboardData = async () => {
    console.log('fetchDashboardData called, user:', !!user)

    if (!user) {
      console.log('No user, setting loading to false')
      setLoadingData(false)
      return
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Dashboard data fetch timeout - forcing loading to false')
      setLoadingData(false)
    }, 5000) // 5 second timeout

    try {
      console.log('Fetching albums...')

      // Fetch albums with image count
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select(`
          *,
          images(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)

      console.log('Albums result:', { albumsData, albumsError })

      if (albumsError) {
        console.error('Albums error:', albumsError)
        setAlbums([])
      } else {
        const albumsWithCount = albumsData?.map(album => ({
          ...album,
          image_count: album.images?.[0]?.count || 0
        })) || []
        setAlbums(albumsWithCount)
      }

      console.log('Fetching recent images...')

      // Simplified images fetch
      const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select(`
          id,
          original_name,
          public_url,
          created_at,
          album_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8)

      console.log('Images result:', { imagesData, imagesError })

      if (imagesError) {
        console.error('Images error:', imagesError)
        setRecentImages([])
      } else {
        // Build a map of album_id to album name
        const albumNameMap = (albumsData || []).reduce((acc, album) => {
          acc[album.id] = album.name
          return acc
        }, {} as Record<string, string>)

        const recentImagesFormatted = imagesData?.map(image => ({
          id: image.id,
          original_name: image.original_name,
          public_url: image.public_url,
          created_at: image.created_at,
          album_name: albumNameMap[image.album_id] || 'Unknown',
          album_id: image.album_id
        })) || []
        setRecentImages(recentImagesFormatted)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setAlbums([])
      setRecentImages([])
    } finally {
      console.log('Dashboard data fetch complete, setting loading to false')
      clearTimeout(timeoutId)
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p style={{ color: theme.grayscale.muted }}>Loading dashboard...</p>
        <Button
          variant="outline"
          onClick={() => {
            console.log('Force stop loading clicked')
            setLoadingData(false)
          }}
        >
          Stop Loading (Debug)
        </Button>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header with single action */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme.grayscale.foreground }}>Dashboard</h1>
        <Link href="/upload">
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
      </div>

      {/* Albums Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{ color: theme.grayscale.foreground }}>Your Albums</h2>
          <Link href="/albums">
            <Button
              variant="outline"
              size="sm"
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
              <Plus className="h-4 w-4 mr-2" />
              New Album
            </Button>
          </Link>
        </div>

        {albums.length === 0 ? (
          <Card style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
            <CardContent className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto mb-4" style={{ color: theme.grayscale.muted }} />
              <p className="mb-4" style={{ color: theme.grayscale.muted }}>No albums yet</p>
              <Link href="/albums">
                <Button
                  variant="outline"
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
                  Create your first album
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album) => (
              <Card key={album.id} className="hover:shadow-lg transition-shadow" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/albums/${album.id}`} className="flex-1 min-w-0">
                      <h3 className="font-medium truncate transition-colors" style={{ color: theme.grayscale.foreground }}>
                        {album.name}
                      </h3>
                    </Link>
                    <div className="flex items-center space-x-2 ml-2">
                      {album.is_public ? (
                         <Globe className="h-4 w-4" style={{ color: theme.accent.green }} />
                      ) : (
                         <Lock className="h-4 w-4" style={{ color: theme.grayscale.muted }} />
                      )}
                      <button
                        onClick={() => copyAlbumId(album.id)}
                        className="p-1 transition-colors"
                        style={{ color: theme.grayscale.muted }}
                        title="Copy Album ID for API"
                      >
                        {copiedId === album.id ? (
                           <Check className="h-4 w-4" style={{ color: theme.accent.green }} />
                        ) : (
                          <Code className="h-4 w-4" style={{ color: theme.accent.blue }} />
                        )}
                      </button>
                    </div>
                  </div>
                  {album.description && (
                    <p className="text-sm mb-2 line-clamp-2" style={{ color: theme.grayscale.muted }}>{album.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm" style={{ color: theme.grayscale.muted }}>
                      <ImageIcon className="h-4 w-4 mr-1" />
                      <span>{album.image_count || 0} images</span>
                    </div>
                    {copiedId === album.id && (
                      <span className="text-xs font-medium" style={{ color: theme.accent.green }}>ID Copied!</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Images Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: theme.grayscale.foreground }}>Recent Images</h2>

        {recentImages.length === 0 ? (
         <Card style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
           <CardContent className="text-center py-8">
             <ImageIcon className="h-12 w-12 mx-auto mb-4" style={{ color: theme.grayscale.muted }} />
             <p className="mb-4" style={{ color: theme.grayscale.muted }}>No images yet</p>
             <Link href="/upload">
               <Button
                 variant="outline"
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
                 Upload your first image
               </Button>
             </Link>
           </CardContent>
         </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentImages.map((image) => (
              <Link key={image.id} href={`/albums/${image.album_id}`}>
                <div className="group cursor-pointer">
                   <div className="aspect-square rounded-lg overflow-hidden mb-2" style={{ background: theme.grayscale.subtle }}>
                    <img
                      src={image.public_url}
                      alt={image.original_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <p className="text-xs truncate" style={{ color: theme.grayscale.muted }}>{image.original_name}</p>
                  <p className="text-xs" style={{ color: theme.grayscale.muted }}>{image.album_name}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
