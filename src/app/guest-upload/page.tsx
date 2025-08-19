'use client'

import { useState, useEffect } from 'react'
interface GuestSession {
  id: string;
  // Add more fields if your guest session stores more data
}
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { generateUniqueFilename, formatFileSize, isValidImageType } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { theme } from '../../config/theme'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, Clock, Link as LinkIcon, Copy } from 'lucide-react'

interface GuestUploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
  shareLink?: string
  expiresAt?: string
}

export default function GuestUploadPage() {
  const [uploadFiles, setUploadFiles] = useState<GuestUploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [expiryOption, setExpiryOption] = useState<'on-open' | '1-hour' | '1-day' | '3-days'>('1-day')
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Check for guest session
    const session = localStorage.getItem('guest-session')
    if (!session) {
      router.push('/auth')
      return
    }
    setGuestSession(JSON.parse(session) as GuestSession)
  }, [router])

  const onDrop = (acceptedFiles: File[]) => {
    const newFiles: GuestUploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'pending'
    }))
    setUploadFiles(prev => [...prev, ...newFiles])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getExpiryDate = () => {
    const now = new Date()
    switch (expiryOption) {
      case 'on-open':
        return null // Will be set when link is first opened
      case '1-hour':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case '1-day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case '3-days':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  const handleUpload = async () => {
    if (!guestSession) return

    setUploading(true)
    const filesToUpload = uploadFiles.filter(f => f.status === 'pending')

    for (const uploadFile of filesToUpload) {
      try {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
        ))

        if (!isValidImageType(uploadFile.file.type)) {
          throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.')
        }

        const filename = generateUniqueFilename(uploadFile.file.name)
        const storagePath = `guest/${filename}`

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('images')
          .upload(storagePath, uploadFile.file, {
            cacheControl: '3600',
            upsert: false
          })

        if (storageError) throw storageError

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(storagePath)

        const expiresAt = getExpiryDate()

        // Save guest image metadata
        const { data: imageData, error: dbError } = await supabase
          .from('guest_images')
          .insert([
            {
              guest_session_id: guestSession.id,
              filename,
              original_name: uploadFile.file.name,
              file_size: uploadFile.file.size,
              mime_type: uploadFile.file.type,
              storage_path: storagePath,
              public_url: publicUrl,
              expires_at: expiresAt?.toISOString(),
              expires_on_open: expiryOption === 'on-open'
            }
          ])
          .select()
          .single()

        if (dbError) throw dbError

        const shareLink = `${window.location.origin}/share/${imageData.id}`

        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'success' as const, 
                progress: 100, 
                url: publicUrl,
                shareLink,
                expiresAt: expiresAt?.toISOString()
              }
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
  }

  const copyShareLink = async (shareLink: string) => {
    try {
      await navigator.clipboard.writeText(shareLink)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!guestSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold" style={{ color: theme.grayscale.foreground }}>Guest Upload</h1>
        <p className="mt-2" style={{ color: theme.grayscale.muted }}>Upload images temporarily - no account required</p>
      </div>

      {/* Expiry Options */}
      <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardHeader>
          <h2 className="text-lg font-semibold flex items-center" style={{ color: theme.grayscale.foreground }}>
            <Clock className="h-5 w-5 mr-2" style={{ color: theme.accent.blue }} />
            Auto-Delete Options
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'on-open', label: 'On First View', desc: 'Deletes when link is opened' },
              { value: '1-hour', label: '1 Hour', desc: 'Auto-delete after 1 hour' },
              { value: '1-day', label: '1 Day', desc: 'Auto-delete after 24 hours' },
              { value: '3-days', label: '3 Days', desc: 'Auto-delete after 3 days' }
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
                onClick={() => setExpiryOption(option.value as typeof expiryOption)}
              >
                <div className="text-sm font-medium" style={{ color: theme.grayscale.foreground }}>{option.label}</div>
                <div className="text-xs" style={{ color: theme.grayscale.muted }}>{option.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
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

          {uploadFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Files to Upload</h3>
                {uploadFiles.some(f => f.status === 'pending') && (
                  <Button onClick={handleUpload} loading={uploading}>
                    Upload {uploadFiles.filter(f => f.status === 'pending').length} Files
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {uploadFiles.map((uploadFile) => (
                  <div key={uploadFile.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {uploadFile.file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {uploadFile.status === 'pending' && (
                          <button
                            onClick={() => removeFile(uploadFile.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        
                        {uploadFile.status === 'uploading' && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                        
                        {uploadFile.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>

                    {uploadFile.status === 'success' && uploadFile.shareLink && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <LinkIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-800">Share Link Ready</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyShareLink(uploadFile.shareLink!)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Link
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-green-700 font-mono bg-white p-2 rounded border">
                          {uploadFile.shareLink}
                        </div>
                        {uploadFile.expiresAt && (
                          <div className="mt-1 text-xs text-green-600">
                            Expires: {new Date(uploadFile.expiresAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    {uploadFile.status === 'error' && uploadFile.error && (
                      <div className="mt-2 text-sm text-red-600">
                        Error: {uploadFile.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
