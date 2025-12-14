'use client'

import UserProfile from '@/components/UserProfile'
import IdleLogout from '@/components/IdleLogout'

export default function ProfilePage() {
  return (
    <div className="p-6 space-y-6">
      <IdleLogout timeoutMs={15 * 60 * 1000} />
      <UserProfile />
    </div>
  )
}
