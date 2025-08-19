import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params

    // Get image with album info
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select(`
        id,
        filename,
        original_name,
        file_size,
        mime_type,
        public_url,
        alt_text,
        created_at,
        updated_at,
        albums!inner (
          id,
          name,
          description,
          is_public,
          user_id
        )
      `)
      .eq('id', imageId)
      .single()

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Check if the album is public
    const album = Array.isArray(image.albums) ? image.albums[0] : image.albums
    if (!album?.is_public) {
      return NextResponse.json(
        { error: 'Image is in a private album' },
        { status: 403 }
      )
    }

    // Return image data
    return NextResponse.json({
      image: {
        id: image.id,
        filename: image.filename,
        original_name: image.original_name,
        file_size: image.file_size,
        mime_type: image.mime_type,
        public_url: image.public_url,
        alt_text: image.alt_text,
        created_at: image.created_at,
        updated_at: image.updated_at
      },
      album: {
        id: album?.id,
        name: album?.name,
        description: album?.description,
        is_public: album?.is_public
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
