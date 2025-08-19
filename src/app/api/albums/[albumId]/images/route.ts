import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 items
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortOrder = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    
    const offset = (page - 1) * limit

    // First, check if album exists and is public
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('id, name, description, is_public, user_id')
      .eq('id', albumId)
      .single()

    if (albumError || !album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      )
    }

    // For private albums, we would need authentication
    // For now, only allow public albums via API
    if (!album.is_public) {
      return NextResponse.json(
        { error: 'Album is private' },
        { status: 403 }
      )
    }

    // Get images with pagination
    const { data: images, error: imagesError, count } = await supabase
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
        updated_at
      `, { count: 'exact' })
      .eq('album_id', albumId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    if (imagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      album: {
        id: album.id,
        name: album.name,
        description: album.description,
        is_public: album.is_public
      },
      images: images || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      meta: {
        sortBy,
        sortOrder,
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
