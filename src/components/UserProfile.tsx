'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AvatarUpload from './AvatarUpload'

type Profile = {
  id: string
  email: string
  fullName: string
  username: string
  phone: string
  emailVerified: boolean
  avatarUrl?: string | null
}

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' })
        if (!res.ok) throw new Error((await res.json()).message || 'Failed to load profile')
        const data = (await res.json()) as { user: Profile }
        if (mounted) setProfile(data.user)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const onSave = async () => {
    if (!profile) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profile.fullName,
          username: profile.username,
          phone: profile.phone,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to save profile')
      setSuccess('Profile updated')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading profile…</div>
  if (error) return <div className="text-sm text-red-500">{error}</div>
  if (!profile) return null

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Your Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your personal information.</p>
      </div>

      <AvatarUpload
        src={profile.avatarUrl}
        name={profile.fullName}
        uploadUrl="/api/avatar"
        onUploaded={async () => {
          // Refetch profile to get updated avatarUrl from server
          try {
            const res = await fetch('/api/profile', { cache: 'no-store' })
            if (res.ok) {
              const data = (await res.json()) as { user: Profile }
              setProfile(data.user)
            }
          } catch (e) {
            console.error('Failed to refresh profile:', e)
          }
        }}
      />

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email} disabled />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        {success && <span className="text-sm text-green-600">{success}</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
  )
}
