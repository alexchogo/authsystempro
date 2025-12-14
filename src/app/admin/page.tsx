import React from 'react'

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Quick links for administrative actions.</p>
      <ul>
        <li><a href="/admin/users">Manage Users</a></li>
        <li><a href="/admin/roles">Manage Roles</a></li>
        <li><a href="/admin/permissions">Manage Permissions</a></li>
        <li><a href="/admin/audit">Audit Logs</a></li>
        <li><a href="/admin/sessions">Sessions</a></li>
        <li><a href="/admin/seed">Run Seed</a></li>
      </ul>
    </div>
  )
}
