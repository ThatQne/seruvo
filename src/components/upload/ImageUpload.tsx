'use client'
import { theme } from '@/config/theme'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { generateUniqueFilename, formatFileSize, isValidImageType } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Upload, X, CheckCircle, AlertCircle, Clock, Lock, Image as ImageIcon } from 'lucide-react'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
  preview?: string
}

interface ImageUploadProps {
  albumId?: string
  onUploadComplete?: (files: UploadFile[]) => void
  isPublicAlbum?: boolean
}

export default function ImageUpload({ albumId, onUploadComplete, isPublicAlbum = true }: ImageUploadProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [expiryOption, setExpiryOption] = useState<'never' | 'on-open' | '1-hour' | '1-day' | '3-days' | '7-days'>('never')
  const supabase = createSupabaseClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => {
      // Create preview URL for image files
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined

      return {
        file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: 'pending',
        preview
      }
    })

    setUploadFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      // Clean up preview URL to prevent memory leaks
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const getExpiryDate = () => {
    // If album is private, always return null (never expires)
    if (!isPublicAlbum) {
      return null
    }

    const now = new Date()
    switch (expiryOption) {
      case 'never':
        return null
      case 'on-open':
        return null // Will be set when link is first opened
      case '1-hour':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case '1-day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case '3-days':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      case '7-days':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      default:
        return null
    }
  }

  const handleUploadFiles = async () => {
    if (!user || !albumId) return

    setUploading(true)
    const filesToUpload = uploadFiles.filter(f => f.status === 'pending')

    for (const uploadFile of filesToUpload) {
      try {
        // Update status to uploading
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
        ))

        // Validate file type
        if (!isValidImageType(uploadFile.file.type)) {
          throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.')
        }

        // Generate unique filename
        const filename = generateUniqueFilename(uploadFile.file.name)
        const storagePath = `${filename}` // Simplified path

        // Debug: Check user and path
        console.log('Upload debug:', {
          userId: user.id,
          storagePath,
          fileName: uploadFile.file.name,
          fileSize: uploadFile.file.size,
          fileType: uploadFile.file.type
        })

        // Try direct upload first, fallback to API route
        let publicUrl: string

        try {
          const { data: storageData, error: storageError } = await supabase.storage
            .from('images')
            .upload(storagePath, uploadFile.file)

          if (storageError) {
            throw storageError
          }

          // Get public URL
          const { data: { publicUrl: directUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(storagePath)

          publicUrl = directUrl
        } catch (directUploadError) {
          console.log('Direct upload failed, trying API route...', directUploadError)

          // Fallback to API route upload
          const formData = new FormData()
          formData.append('file', uploadFile.file)
          formData.append('albumId', albumId)
          formData.append('userId', user.id)

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'API upload failed')
          }

          const result = await response.json()
          publicUrl = result.url

          // Update status to success and continue
          setUploadFiles(prev => prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'success' as const, progress: 100, url: publicUrl }
              : f
          ))
          continue // Skip the rest of the loop for this file
        }

        // publicUrl is already set above
        const expiresAt = getExpiryDate()

        // Save image metadata to database
        const { error: dbError } = await supabase
          .from('images')
          .insert([
            {
              album_id: albumId,
              user_id: user.id,
              filename,
              original_name: uploadFile.file.name,
              file_size: uploadFile.file.size,
              mime_type: uploadFile.file.type,
              storage_path: storagePath,
              public_url: publicUrl,
              expires_at: expiresAt?.toISOString(),
              expires_on_open: isPublicAlbum && expiryOption === 'on-open'
            }
          ])

        if (dbError) throw dbError

        // Update status to success
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'success' as const, progress: 100, url: publicUrl }
            : f
        ))

      } catch (error) {
        console.error('Upload error:', error)
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : f
        ))
      }
    }

    setUploading(false)
    
    // Call completion callback
    const successfulUploads = uploadFiles.filter(f => f.status === 'success')
    if (onUploadComplete && successfulUploads.length > 0) {
      onUploadComplete(successfulUploads)
    }
  }

  const hasFilesToUpload = uploadFiles.some(f => f.status === 'pending')
  const allFilesProcessed = uploadFiles.length > 0 && uploadFiles.every(f => f.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Expiry Options - Only show for public albums */}
      {isPublicAlbum && (
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center" style={{ color: theme.grayscale.foreground }}>
              <Clock className="h-5 w-5 mr-2" style={{ color: theme.accent.blue }} />
              Image Expiration
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { value: 'never', label: 'Never', desc: 'Keep forever' },
                { value: 'on-open', label: 'On View', desc: 'Delete when shared link is opened' },
                { value: '1-hour', label: '1 Hour', desc: 'Auto-delete after 1 hour' },
                { value: '1-day', label: '1 Day', desc: 'Auto-delete after 24 hours' },
                { value: '3-days', label: '3 Days', desc: 'Auto-delete after 3 days' },
                { value: '7-days', label: '1 Week', desc: 'Auto-delete after 7 days' }
              ].map((option) => (
                <div
                  key={option.value}
                  className="p-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    border: `2px solid ${expiryOption === option.value ? theme.accent.blue : theme.grayscale.border}`,
                    background: expiryOption === option.value ? theme.accent.blue + '22' : theme.grayscale.surface,
                    color: expiryOption === option.value ? theme.accent.blue : theme.grayscale.foreground,
                    fontWeight: expiryOption === option.value ? 600 : 400,
                  }}
                  onClick={() => setExpiryOption(option.value as any)}
                >
                  <div className="text-sm font-medium" style={{ color: theme.grayscale.foreground }}>{option.label}</div>
                  <div className="text-xs" style={{ color: theme.grayscale.muted }}>{option.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info for private albums */}
      {!isPublicAlbum && (
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 text-gray-600">
              <Lock className="h-5 w-5" />
              <div>
                <p className="font-medium">Private Album</p>
                <p className="text-sm">Images in private albums never expire and cannot be shared publicly.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dropzone */}
      <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? theme.accent.blue : theme.grayscale.border}`,
              background: isDragActive ? theme.accent.blue + '22' : theme.grayscale.subtle,
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: theme.accent.blue }} />
            {isDragActive ? (
              <p style={{ color: theme.accent.blue, fontWeight: 600 }}>Drop the images here...</p>
            ) : (
              <div>
                <p style={{ color: theme.grayscale.muted, fontWeight: 500, marginBottom: 8 }}>
                  Drag & drop images here, or click to select
                </p>
                <p className="text-sm" style={{ color: theme.grayscale.muted }}>
                  Supports JPEG, PNG, GIF, WebP (max 10MB each)
                </p>
              </div>
            )}
          </div>

      {/* File List */}

      {uploadFiles.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: theme.grayscale.foreground, fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Files to Upload</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 18,
                  background: theme.grayscale.surface,
                  border: `1.5px solid ${theme.grayscale.border}`,
                  borderRadius: 14,
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                  minHeight: 120,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  {uploadFile.preview ? (
                    <div style={{
                      width: 96, height: 96, borderRadius: 10, overflow: 'hidden', background: theme.grayscale.subtle, flexShrink: 0,
                      border: `1.5px solid ${theme.accent.blue}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img
                        src={uploadFile.preview}
                        alt={uploadFile.file.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: 96, height: 96, borderRadius: 10, background: theme.grayscale.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      border: `1.5px solid ${theme.grayscale.border}`
                    }}>
                      <ImageIcon style={{ width: 36, height: 36, color: theme.grayscale.muted }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {uploadFile.status === 'pending' ? (
                      <input
                        type="text"
                        value={uploadFile.file.name}
                        onChange={e => {
                          const newName = e.target.value
                          setUploadFiles(prev => prev.map(f =>
                            f.id === uploadFile.id
                              ? {
                                  ...f,
                                  file: new File([f.file], newName, { type: f.file.type })
                                }
                              : f
                          ))
                        }}
                        style={{
                          color: theme.grayscale.foreground,
                          fontWeight: 500,
                          fontSize: 16,
                          marginBottom: 2,
                          background: theme.grayscale.surface,
                          border: `1px solid ${theme.grayscale.border}`,
                          borderRadius: 6,
                          padding: '2px 6px',
                          width: '100%',
                          outline: `1.5px solid ${theme.accent.blue}55`,
                        }}
                        spellCheck={false}
                        maxLength={128}
                      />
                    ) : (
                      <p style={{ color: theme.grayscale.foreground, fontWeight: 500, fontSize: 16, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {uploadFile.file.name}
                      </p>
                    )}
                    <p style={{ color: theme.grayscale.muted, fontSize: 13 }}>
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {uploadFile.status === 'pending' && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      style={{ padding: 6, color: theme.grayscale.muted, background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseOver={e => (e.currentTarget.style.color = theme.accent.pink)}
                      onMouseOut={e => (e.currentTarget.style.color = theme.grayscale.muted)}
                    >
                      <X style={{ width: 18, height: 18 }} />
                    </button>
                  )}

                  {uploadFile.status === 'uploading' && (
                    <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', borderBottom: `2.5px solid ${theme.accent.blue}`, borderLeft: '2.5px solid transparent', animation: 'spin 1s linear infinite',
                      }} />
                      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                  )}

                  {uploadFile.status === 'success' && (
                    <CheckCircle style={{ width: 22, height: 22, color: theme.accent.green }} />
                  )}

                  {uploadFile.status === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle style={{ width: 22, height: 22, color: theme.accent.pink }} />
                      {uploadFile.error && (
                        <span style={{ color: theme.accent.pink, fontSize: 13, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {uploadFile.error}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {hasFilesToUpload && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <Button
                onClick={handleUploadFiles}
                loading={uploading}
                disabled={!albumId}
                style={{
                  background: theme.accent.blue,
                  color: theme.grayscale.background,
                  border: `1.5px solid ${theme.accent.blue}`,
                  fontWeight: 600,
                  fontSize: 16,
                  borderRadius: 8,
                  padding: '10px 28px',
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = theme.accent.purple;
                  e.currentTarget.style.color = theme.grayscale.background;
                  e.currentTarget.style.border = `1.5px solid ${theme.accent.purple}`;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = theme.accent.blue;
                  e.currentTarget.style.color = theme.grayscale.background;
                  e.currentTarget.style.border = `1.5px solid ${theme.accent.blue}`;
                }}
              >
                Upload {uploadFiles.filter(f => f.status === 'pending').length} Files
              </Button>
            </div>
          )}

          {/* Clear All Button */}
          {allFilesProcessed && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {albumId && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/albums/${albumId}`)}
                    className="transition-colors"
                    style={{
                      borderColor: theme.accent.blue,
                      color: theme.accent.blue,
                      background: theme.grayscale.surface,
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = theme.accent.blue + '22'
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = theme.grayscale.surface
                    }}
                  >
                    Go To Album
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setUploadFiles([])}
                className="transition-colors"
                style={{
                  borderColor: theme.accent.pink,
                  color: theme.accent.pink,
                  background: theme.grayscale.surface
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = theme.accent.pink + '22'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = theme.grayscale.surface
                }}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

        </CardContent>
      </Card>

      {/* Album Selection Warning */}
      {uploadFiles.length > 0 && !albumId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              Please select an album before uploading images.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
