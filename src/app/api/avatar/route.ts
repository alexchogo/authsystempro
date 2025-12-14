import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { errorHandler } from '@/lib/errorHandler'
import { authorize } from '@/lib/auth/authorize'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getAuthContext } from '@/lib/auth/context'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'

const UPLOAD_DIR = 'public/avatars'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const POST = errorHandler(
  authorize(
    requireAuth(async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

      const formData = await req.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ message: 'No file provided' }, { status: 400 })
      }

      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ message: 'File must be an image' }, { status: 400 })
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json({ message: 'File size must be under 5MB' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.type.split('/')[1] || 'jpg'
      const filename = `${ctx.user.id}-${Date.now()}.${ext}`
      const filepath = join(process.cwd(), UPLOAD_DIR, filename)

      try {
        await mkdir(join(process.cwd(), UPLOAD_DIR), { recursive: true })
        await writeFile(filepath, buffer)
      } catch (err) {
        console.error('[Avatar] Failed to save file:', err)
        return NextResponse.json({ message: 'Failed to save file' }, { status: 500 })
      }

      const url = `/avatars/${filename}`

      try {
        await prisma.user.update({
          where: { id: ctx.user.id },
          data: { avatarUrl: url }
        })
      } catch (err) {
        console.error('[Avatar] Failed to update user:', err)
        return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, url })
    })
  )
)
