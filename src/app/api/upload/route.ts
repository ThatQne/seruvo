import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin access
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const albumId = formData.get('albumId') as string
    const userId = formData.get('userId') as string

    if (!file || !albumId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}_${randomString}.${extension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage using service role (bypasses RLS)
    const { data: storageData, error: storageError } = await supabase.storage
      .from('images')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600'
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json(
        { error: 'Failed to upload to storage' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filename)

    // Save image metadata to database
    const { data: imageData, error: dbError } = await supabase
      .from('images')
      .insert([
        {
          album_id: albumId,
          user_id: userId,
          filename,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: filename,
          public_url: publicUrl
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('images').remove([filename])
      return NextResponse.json(
        { error: 'Failed to save image metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      image: imageData,
      url: publicUrl
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
