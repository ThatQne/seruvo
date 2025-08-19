'use client'
import { theme } from '@/config/theme'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import ImageUpload from '@/components/upload/ImageUpload'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { FolderOpen, Plus } from 'lucide-react'

interface Album {
  id: string
  name: string
  description: string | null
  is_public: boolean
}

export default function UploadPage() { 
  const { user, loading } = useAuth()
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('')
  const [loadingAlbums, setLoadingAlbums] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchAlbums()
    }
  }, [user])

  const fetchAlbums = async () => {
    if (!user?.id) {
      setLoadingAlbums(false)
      return
    }

    try {
      // First ensure profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || ''
            }
          ])

        if (createError) {
          console.error('Error creating profile:', createError)
          setLoadingAlbums(false)
          return
        }
      }

      // Now fetch albums
      const { data, error } = await supabase
        .from('albums')
        .select('id, name, description, is_public')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlbums(data || [])

      // Auto-select first album if available
      if (data && data.length > 0) {
        setSelectedAlbumId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching albums:', error)
    } finally {
      setLoadingAlbums(false)
    }
  }

  const handleUploadComplete = () => {
    // Optionally redirect to the album or show success message
    if (selectedAlbumId) {
      router.push(`/albums/${selectedAlbumId}`)
    }
  }

  if (loading || loadingAlbums) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: theme.grayscale.foreground }}>Upload Images</h1>
        <p className="mt-1" style={{ color: theme.grayscale.muted }}>Add new images to your collection</p>
      </div>

      {/* Album Selection */}
      <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardHeader>
          <h2 className="text-lg font-semibold" style={{ color: theme.grayscale.foreground }}>Select Album</h2>
          <p className="text-sm" style={{ color: theme.grayscale.muted }}>Choose which album to upload your images to</p>
        </CardHeader>
        <CardContent>
          {albums.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto mb-4" style={{ color: theme.grayscale.muted }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: theme.grayscale.foreground }}>No albums found</h3>
              <p className="mb-4" style={{ color: theme.grayscale.muted }}>You need to create an album before uploading images</p>
              <Button
                onClick={() => router.push('/albums')}
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
                <Plus className="h-4 w-4 mr-2" />
                Create Album
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {albums.map((album) => {
                  const selected = selectedAlbumId === album.id
                  return (
                    <div
                      key={album.id}
                      className="p-4 rounded-lg cursor-pointer transition-all"
                      style={{
                        border: `2px solid ${selected ? theme.accent.blue : theme.grayscale.border}`,
                        background: selected ? theme.grayscale.subtle : theme.grayscale.surface,
                        color: theme.grayscale.foreground,
                        boxShadow: selected ? `0 0 0 2px ${theme.accent.blue}44` : 'none',
                      }}
                      onClick={() => setSelectedAlbumId(album.id)}
                      onMouseOver={e => {
                        if (!selected) e.currentTarget.style.background = theme.grayscale.subtle;
                      }}
                      onMouseOut={e => {
                        if (!selected) e.currentTarget.style.background = theme.grayscale.surface;
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor: selected ? theme.accent.blue : theme.grayscale.border,
                            background: selected ? theme.accent.blue : 'transparent',
                          }}
                        >
                          {selected && (
                            <div className="w-2 h-2 rounded-full" style={{ background: theme.grayscale.surface }}></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate" style={{ color: theme.grayscale.foreground }}>{album.name}</h3>
                          {album.description && (
                            <p className="text-sm truncate" style={{ color: theme.grayscale.muted }}>{album.description}</p>
                          )}
                          <div className="flex items-center mt-1">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                background: album.is_public ? theme.accent.green : theme.grayscale.subtle,
                                color: album.is_public ? theme.grayscale.background : theme.grayscale.muted,
                              }}
                            >
                              {album.is_public ? 'Public' : 'Private'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between items-center pt-4" style={{ borderTop: `1px solid ${theme.grayscale.border}` }}>
                <p className="text-sm" style={{ color: theme.grayscale.muted }}>
                  {selectedAlbumId 
                    ? `Selected: ${albums.find(a => a.id === selectedAlbumId)?.name}`
                    : 'No album selected'
                  }
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/albums')}
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
                  Create New Album
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Component */}
      {albums.length > 0 && (
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardHeader>
            <h2 className="text-lg font-semibold" style={{ color: theme.grayscale.foreground }}>Upload Images</h2>
            <p className="text-sm" style={{ color: theme.grayscale.muted }}>
              Drag and drop your images or click to browse
            </p>
          </CardHeader>
          <CardContent>
            <ImageUpload
              albumId={selectedAlbumId}
              isPublicAlbum={albums.find(a => a.id === selectedAlbumId)?.is_public ?? true}
              onUploadComplete={handleUploadComplete}
              theme={theme}
            />
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardContent className="p-6">
          <h3 className="font-medium mb-3" style={{ color: theme.grayscale.foreground }}>Upload Tips</h3>
          <ul className="space-y-2 text-sm" style={{ color: theme.grayscale.muted }}>
            <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
            <li>• Maximum file size: 10MB per image</li>
            <li>• You can upload multiple images at once</li>
            <li>• Images will be automatically optimized for web delivery</li>
            <li>• Private albums are only visible to you</li>
            <li>• Public albums can be accessed via API</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
