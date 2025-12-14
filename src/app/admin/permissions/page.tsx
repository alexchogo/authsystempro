'use client'
import React, { useEffect, useState } from 'react'

export default function PermissionsPage(){
  const [items, setItems] = useState<any[]>([])
  useEffect(()=>{ fetch('/api/admin/permissions')
    .then(r=>r.json()).then(d=>setItems(d.permissions||[])).catch(()=>{}) },[])
  return (
    <div>
      <h1>Permissions</h1>
      <ul>
        {items.map(p => <li key={p.id}>{p.name} — {p.description}</li>)}
      </ul>
    </div>
  )
}
