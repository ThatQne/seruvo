'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { CheckCircle, AlertCircle, User } from 'lucide-react'

export default function FixProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'checking' | 'creating' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const supabase = createSupabaseClient()

  const checkAndCreateProfile = async () => {
    if (!user) {
      setStatus('error')
      setMessage('No user logged in')
      return
    }

    setLoading(true)
    setStatus('checking')
    setMessage('Checking if profile exists...')

    try {
      // Check if profile exists
      const { data: profile, error: checkError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (profile) {
        setStatus('success')
        setMessage(`Profile already exists! Email: ${profile.email}`)
        setLoading(false)
        return
      }

      // Profile doesn't exist, create it
      setStatus('creating')
      setMessage('Creating profile...')

      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
          }
        ])

      if (insertError) {
        throw insertError
      }

      setStatus('success')
      setMessage('Profile created successfully! You can now create albums.')

    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card variant="elevated">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Logged In</h2>
            <p className="text-gray-600">Please log in first to fix your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Fix Profile Issue</h1>
        <p className="text-gray-600 mt-2">
          This will check and create your user profile if it&apos;s missing
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            User Information
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Full Name:</strong> {user.user_metadata?.full_name || 'Not set'}</div>
              <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={checkAndCreateProfile}
              loading={loading}
              className="w-full"
              disabled={status === 'success'}
            >
              {status === 'success' ? 'Profile Fixed!' : 'Check & Fix Profile'}
            </Button>

            {status !== 'idle' && (
              <div className={`p-4 rounded-lg flex items-start space-x-3 ${
                status === 'success' ? 'bg-green-50 border border-green-200' :
                status === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                {(status === 'checking' || status === 'creating') && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5"></div>
                )}
                <div>
                  <p className={`font-medium ${
                    status === 'success' ? 'text-green-800' :
                    status === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {status === 'success' ? 'Success!' :
                     status === 'error' ? 'Error' :
                     status === 'checking' ? 'Checking...' :
                     'Creating...'}
                  </p>
                  <p className={`text-sm ${
                    status === 'success' ? 'text-green-700' :
                    status === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    {message}
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Your profile is now fixed! You can:</p>
                <div className="space-y-2">
                  <a href="/albums" className="block">
                    <Button variant="outline" className="w-full">
                      Go to Albums
                    </Button>
                  </a>
                  <a href="/dashboard" className="block">
                    <Button variant="outline" className="w-full">
                      Go to Dashboard
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-gray-900 mb-3">What this does:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Checks if your user profile exists in the database</li>
            <li>• Creates a profile record if it&apos;s missing</li>
            <li>• Links your authentication account to the profiles table</li>
            <li>• Enables you to create albums and upload images</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
