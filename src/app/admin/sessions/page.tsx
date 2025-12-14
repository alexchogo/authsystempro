'use client'
import React, { useEffect, useState } from 'react'

export default function SessionsPage(){
  const [sessions, setSessions] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  async function load(){
    const res = await fetch('/api/admin/sessions?userId=' + encodeURIComponent(userId))
    const data = await res.json()
    setSessions(data.sessions || [])
  }
  async function revokeAll(){
    if (!confirm('Revoke all sessions system-wide? This is destructive.')) return
    await fetch('/api/admin/sessions', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'revokeAll', confirm: true }) })
    load()
  }
  return (
    <div>
      <h1>Sessions</h1>
      <div>
        <input placeholder="user id (optional)" value={userId} onChange={e=>setUserId(e.target.value)} />
        <button onClick={load}>Load</button>
        <button onClick={revokeAll} style={{marginLeft:8}}>Revoke All (global)</button>
      </div>
      <ul>
        {sessions.map(s => <li key={s.id}>{s.jwtToken} — {new Date(s.createdAt).toLocaleString()}</li>)}
      </ul>
    </div>
  )
}
