'use client'
import React, { useEffect, useState } from 'react'

export default function RolesPage(){
  const [roles, setRoles] = useState<any[]>([])
  useEffect(()=>{ fetch('/api/admin/roles/manage?')
    .then(r=>r.json()).then(d=>setRoles(d.roles||[])).catch(()=>{}) },[])
  return (
    <div>
      <h1>Roles</h1>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr><th>Name</th><th>Description</th></tr></thead>
        <tbody>
          {roles.map(r=> (
            <tr key={r.id}><td>{r.name}</td><td>{r.description}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
