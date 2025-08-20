'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { theme } from '@/config/theme'

export default function ProfileSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [pwOld, setPwOld] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwNewConfirm, setPwNewConfirm] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (!error && data) {
        setFullName(data.full_name || '')
      }
    }
    loadProfile()
  }, [user, supabase])

  const handleChangePassword = async () => {
    if (!user?.email) return
    setStatus(null)
    if (!pwOld || !pwNew || !pwNewConfirm) {
      setStatus('All password fields required.')
      return
    }
    if (pwNew !== pwNewConfirm) {
      setStatus('New passwords do not match.')
      return
    }
    if (pwNew.length < 6) {
      setStatus('New password must be at least 6 characters.')
      return
    }
    setChangingPw(true)
    try {
      // Re-authenticate with old password
      const { error: reErr } = await supabase.auth.signInWithPassword({ email: user.email, password: pwOld })
      if (reErr) {
        setStatus('Old password incorrect.')
        return
      }
      const { error: updErr } = await supabase.auth.updateUser({ password: pwNew })
      if (updErr) {
        setStatus('Failed to update password.')
        return
      }
      setStatus('Password updated successfully.')
      setPwOld(''); setPwNew(''); setPwNewConfirm('')
    } catch (e) {
      setStatus('Unexpected error updating password.')
    } finally {
      setChangingPw(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    setStatus(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName || null })
        .eq('id', user.id)
      if (error) throw error
      setStatus('Profile updated.')
    } catch (e) {
      setStatus('Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const reauthenticateUser = async (password: string) => {
    if (!user?.email) return { error: 'No user email' }
    // Sign in again to verify password (Supabase doesn't have explicit reauth)
    const { data, error } = await supabase.auth.signInWithPassword({ email: user.email, password })
    if (error) return { error: error.message }
    return { data }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setStatus(null)
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      setStatus('Enter your password to confirm account deletion.')
      return
    }
    if (!deletePassword) {
      setStatus('Password required.')
      return
    }
    setDeleting(true)
    try {
      // Reauth
      const { error: reauthErr } = await reauthenticateUser(deletePassword)
      if (reauthErr) {
        setStatus('Password incorrect.')
        setDeleting(false)
        return
      }
      // Call backend to perform cascade deletion
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (!resp.ok) {
        setStatus('Server failed to delete account.')
        setDeleting(false)
        return
      }
      setStatus('Account deleted. Redirecting...')
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (e) {
      setStatus('Unexpected error deleting account.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <h1 className="text-3xl font-bold" style={{ color: theme.grayscale.foreground }}>Profile Settings</h1>

      {status && (
        <div className="text-sm" style={{ color: theme.accent.orange }}>{status}</div>
      )}

      {/* Profile Info */}
      <section style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }} className="rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: theme.grayscale.muted }}>Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: theme.grayscale.subtle, color: theme.grayscale.foreground, border: `1px solid ${theme.grayscale.border}` }}
              placeholder="Your name"
              maxLength={80}
            />
          </div>
          <Button onClick={handleSaveProfile} loading={savingProfile} disabled={savingProfile} style={{ background: theme.accent.blue, color: '#000', border: '1px solid ' + theme.accent.blue }}>Save Profile</Button>
        </div>
      </section>

      {/* Security */}
      <section style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }} className="rounded-lg p-6 space-y-5">
        <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Security</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="block text-sm mb-1" style={{ color: theme.grayscale.muted }}>Current Password</label>
            <input
              type="password"
              value={pwOld}
              onChange={e => setPwOld(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: theme.grayscale.subtle, color: theme.grayscale.foreground, border: `1px solid ${theme.grayscale.border}` }}
              placeholder="Old password"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: theme.grayscale.muted }}>New Password</label>
            <input
              type="password"
              value={pwNew}
              onChange={e => setPwNew(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: theme.grayscale.subtle, color: theme.grayscale.foreground, border: `1px solid ${theme.grayscale.border}` }}
              placeholder="New password"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: theme.grayscale.muted }}>Confirm New Password</label>
            <input
              type="password"
              value={pwNewConfirm}
              onChange={e => setPwNewConfirm(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: theme.grayscale.subtle, color: theme.grayscale.foreground, border: `1px solid ${theme.grayscale.border}` }}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
        </div>
        <div>
          <Button onClick={handleChangePassword} loading={changingPw} disabled={changingPw} style={{ background: theme.accent.blue, color: '#000', border: '1px solid ' + theme.accent.blue }}>Change Password</Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }} className="rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: theme.accent.pink }}>Danger Zone</h2>
        <p className="text-sm" style={{ color: theme.grayscale.muted }}>Deleting your account removes all albums, images, and profile data. This cannot be undone.</p>
        {confirmingDelete && (
          <div className="space-y-2">
            <label className="block text-sm" style={{ color: theme.grayscale.muted }}>Confirm Password</label>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: theme.grayscale.subtle, color: theme.grayscale.foreground, border: `1px solid ${theme.grayscale.border}` }}
              placeholder="Your password"
            />
          </div>
        )}
        <Button
          variant="danger"
          onClick={handleDeleteAccount}
          loading={deleting}
          style={{ background: '#ff4d4f', border: '1px solid #ff4d4f' }}
        >
          {confirmingDelete ? 'Confirm Delete Account' : 'Delete Account'}
        </Button>
      </section>
    </div>
  )
}
