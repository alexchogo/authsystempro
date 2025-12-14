'use client'
import React, { useEffect, useState } from 'react'

export default function UsersPage(){
  const [user, setUser] = useState<any | null>(null)
  // simple form to fetch a user by id
  const [id, setId] = useState('')
  async function fetchUser(){
    const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(id)}`)
    const data = await res.json()
    setUser(data.user || null)
  }
  return (
    <div>
      <h1>Users</h1>
      <div style={{marginBottom:12}}>
        <input value={id} onChange={e=>setId(e.target.value)} placeholder="user id" />
        <button onClick={fetchUser}>Fetch</button>
      </div>
      {user ? (
        <div>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      ) : <div>No user loaded</div>}
    </div>
  )
}
