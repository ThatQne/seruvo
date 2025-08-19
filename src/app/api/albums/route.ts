import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 items
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortOrder = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    
    const offset = (page - 1) * limit

    // Get public albums only
    const { data: albums, error: albumsError, count } = await supabase
      .from('albums')
      .select(`
        id,
        name,
        description,
        is_public,
        created_at,
        updated_at,
        images(count)
      `, { count: 'exact' })
      .eq('is_public', true)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    if (albumsError) {
      return NextResponse.json(
        { error: 'Failed to fetch albums' },
        { status: 500 }
      )
    }

    // Format albums with image count
    const formattedAlbums = albums?.map(album => ({
      id: album.id,
      name: album.name,
      description: album.description,
      is_public: album.is_public,
      created_at: album.created_at,
      updated_at: album.updated_at,
      image_count: album.images?.[0]?.count || 0
    })) || []

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      albums: formattedAlbums,
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
