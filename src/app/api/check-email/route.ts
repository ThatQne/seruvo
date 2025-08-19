import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Use the admin API to check if user exists
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })

    if (error) {
      console.error('Error checking users:', error)
      return NextResponse.json(
        { exists: null, error: 'Unable to check email' },
        { status: 500 }
      )
    }

    // Search for the specific email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json(
        { exists: null, error: 'Unable to check email' },
        { status: 500 }
      )
    }

    const userExists = users.users.some(user => user.email === email)

    return NextResponse.json({
      exists: userExists
    })

  } catch (error) {
    console.error('Email check error:', error)
    return NextResponse.json(
      { exists: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
