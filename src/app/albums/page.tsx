
'use client'
import { theme } from '@/config/theme'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Plus, FolderOpen, Image as ImageIcon, Edit, Trash2, Globe, Lock } from 'lucide-react'

interface Album {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  image_count?: number
}

export default function AlbumsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loadingAlbums, setLoadingAlbums] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAlbum, setNewAlbum] = useState({ name: '', description: '', is_public: false })
  const [creating, setCreating] = useState(false)
  const [copiedAlbumId, setCopiedAlbumId] = useState<string | null>(null)
  const [copyErrorAlbumId, setCopyErrorAlbumId] = useState<string | null>(null)
  const supabase = createSupabaseClient()

  // Clipboard copy with fallback
  const copyAlbumId = async (albumId: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(albumId)
      } else {
        // fallback for insecure context or missing API
        const textarea = document.createElement('textarea')
        textarea.value = albumId
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopiedAlbumId(albumId)
      setCopyErrorAlbumId(null)
      setTimeout(() => setCopiedAlbumId(null), 1000)
    } catch (err) {
      setCopyErrorAlbumId(albumId)
      setCopiedAlbumId(null)
      setTimeout(() => setCopyErrorAlbumId(null), 1200)
    }
  }

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
      const { data, error } = await supabase
        .from('albums')
        .select(`
          *,
          images(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching albums:', error)
        setAlbums([])
      } else {
        const albumsWithCount = data?.map(album => ({
          ...album,
          image_count: album.images?.[0]?.count || 0
        })) || []
        setAlbums(albumsWithCount)
      }
    } catch (error) {
      console.error('Error fetching albums:', error)
      setAlbums([])
    } finally {
      setLoadingAlbums(false)
    }
  }

  const createAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newAlbum.name.trim()) return

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('albums')
        .insert([
          {
            user_id: user.id,
            name: newAlbum.name.trim(),
            description: newAlbum.description.trim() || null,
            is_public: newAlbum.is_public
          }
        ])
        .select()
        .single()

      if (error) throw error

      setAlbums(prev => [{ ...data, image_count: 0 }, ...prev])
      setNewAlbum({ name: '', description: '', is_public: false })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating album:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteAlbum = async (albumId: string) => {
    if (!user?.id) return
    if (!confirm('Delete this album and all its images? This cannot be undone.')) return

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/delete-album`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId, userId: user.id })
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete album')
      }
      setAlbums(prev => prev.filter(album => album.id !== albumId))
    } catch (error) {
      console.error('Error deleting album and its images:', error)
      alert('Failed to delete album. See console for details.')
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: theme.grayscale.foreground }}>Albums</h1>
          <p className="mt-1" style={{ color: theme.grayscale.muted }}>Organize your images into collections</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
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

      {/* Create Album Form */}
      {showCreateForm && (
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardHeader>
            <h2 className="text-lg font-semibold" style={{ color: theme.grayscale.foreground }}>Create New Album</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAlbum} className="space-y-4">
              <Input
                label="Album Name"
                value={newAlbum.name}
                onChange={(e) => setNewAlbum(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter album name"
                required
              />
              <Input
                label="Description (Optional)"
                value={newAlbum.description}
                onChange={(e) => setNewAlbum(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter album description"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newAlbum.is_public}
                  onChange={(e) => setNewAlbum(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="text-sm" style={{ color: theme.grayscale.foreground }}>
                  Make this album public
                </label>
              </div>
              <div className="flex gap-2">
            <Button
              type="submit"
              loading={creating}
              disabled={!newAlbum.name.trim()}
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
              Create Album
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateForm(false)
                setNewAlbum({ name: '', description: '', is_public: false })
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
              Cancel
            </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Albums Grid */}
      {albums.length === 0 ? (
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-16 w-16 mx-auto mb-4" style={{ color: theme.grayscale.muted }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: theme.grayscale.foreground }}>No albums yet</h3>
            <p className="mb-6" style={{ color: theme.grayscale.muted }}>Create your first album to start organizing your images</p>
            <Button
              onClick={() => setShowCreateForm(true)}
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
              Create Your First Album
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.id} variant="elevated" className="hover:shadow-xl transition-shadow" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5" style={{ color: theme.accent.blue }} />
                    {album.is_public ? (
                      <Globe className="h-4 w-4" style={{ color: theme.accent.green }} />
                    ) : (
                      <Lock className="h-4 w-4" style={{ color: theme.grayscale.muted }} />
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button className="p-1 transition-colors" style={{ color: theme.grayscale.muted }}>
                      <Edit className="h-4 w-4" />
                    </button>
                    {/* Copy Album ID Button (<> icon, blue) */}
                    <button
                      title={
                        copyErrorAlbumId === album.id
                          ? "Copy failed"
                          : copiedAlbumId === album.id
                            ? "Copied!"
                            : "Copy Album ID"
                      }
                      onClick={e => {
                        e.stopPropagation();
                        copyAlbumId(album.id);
                      }}
                      className="p-1 transition-colors relative"
                      style={{ color: copyErrorAlbumId === album.id ? theme.accent.pink : theme.accent.blue }}
                    >
                      {copyErrorAlbumId === album.id ? (
                        // Red X icon for error
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.accent.pink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      ) : copiedAlbumId === album.id ? (
                        // Checkmark icon (Lucide Check)
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.accent.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        // Lucide Code Icon (<>), blue
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => deleteAlbum(album.id)}
                      className="p-1 transition-colors"
                      style={{ color: theme.accent.pink }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold truncate" style={{ color: theme.grayscale.foreground }}>{album.name}</h3>
                </div>
                {album.description && (
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: theme.grayscale.muted }}>{album.description}</p>
                )}
                <div className="flex items-center justify-between text-sm" style={{ color: theme.grayscale.muted }}>
                  <div className="flex items-center space-x-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>{album.image_count || 0} images</span>
                  </div>
                  <span>{new Date(album.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.grayscale.border}` }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/albums/${album.id}`)}
                  >
                    View Album
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
