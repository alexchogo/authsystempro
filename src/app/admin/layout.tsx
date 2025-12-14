import React from 'react'
import './globals.css'

export const metadata = {
  title: 'Admin',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <aside style={{ width: 260, padding: 20, borderRight: '1px solid #eee' }}>
            <h3>Admin</h3>
            <nav>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                <li><a href="/admin">Dashboard</a></li>
                <li><a href="/admin/users">Users</a></li>
                <li><a href="/admin/roles">Roles</a></li>
                <li><a href="/admin/permissions">Permissions</a></li>
                <li><a href="/admin/sessions">Sessions</a></li>
                <li><a href="/admin/audit">Audit</a></li>
                <li><a href="/admin/seed">Run Seed</a></li>
              </ul>
            </nav>
          </aside>
          <main style={{ flex: 1, padding: 20 }}>{children}</main>
        </div>
      </body>
    </html>
  )
}
