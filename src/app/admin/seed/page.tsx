'use client'
import React, { useState } from 'react'

export default function SeedPage(){
  const [status, setStatus] = useState<string | null>(null)
  async function run(){
    setStatus('Running...')
    const res = await fetch('/api/admin/seed/run', { method: 'POST' })
    const data = await res.json().catch(()=>({ok:false}))
    setStatus(data.ok ? 'Seed completed' : ('Failed: ' + (data.message || 'unknown')))
  }
  return (
    <div>
      <h1>Run Seed</h1>
      <p>This will run the idempotent seed operations (create permissions & roles).</p>
      <button onClick={run}>Run Seed</button>
      {status && <div style={{marginTop:12}}>{status}</div>}
    </div>
  )
}
