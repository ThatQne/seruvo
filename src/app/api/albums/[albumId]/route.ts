import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { albumId: string } }
) {
  const supabase = createSupabaseClient()
  const { albumId } = params

  if (!albumId) {
    return NextResponse.json({ error: 'Missing albumId' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 })
  }

  if (!data.is_public) {
    return NextResponse.json({ error: 'Album is private' }, { status: 403 })
  }

  return NextResponse.json(data)
}
