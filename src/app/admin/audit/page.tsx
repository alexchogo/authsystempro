'use client'
import React, { useEffect, useState } from 'react'

export default function AuditPage(){
  const [logs, setLogs] = useState<any[]>([])
  const [q, setQ] = useState('')
  async function load(){
    const url = '/api/admin/audit?'+(q?('action='+encodeURIComponent(q)):'')
    const res = await fetch(url)
    const data = await res.json()
    setLogs(data.logs || [])
  }
  async function exportCsv(){
    const res = await fetch('/api/admin/audit?format=csv')
    const text = await res.text()
    const blob = new Blob([text], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'audit.csv'; a.click()
  }
  useEffect(()=>{ load() }, [])
  return (
    <div>
      <h1>Audit</h1>
      <div>
        <input placeholder="action filter" value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={load}>Load</button>
        <button onClick={exportCsv} style={{marginLeft:8}}>Export CSV</button>
      </div>
      <ul>
        {logs.map(l=> <li key={l.id}>{l.action} — {new Date(l.createdAt).toLocaleString()} — {l.userId}</li>)}
      </ul>
    </div>
  )
}
