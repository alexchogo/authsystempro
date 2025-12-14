'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type AvatarUploadProps = {
  src?: string | null
  name?: string
  uploadUrl?: string
  accept?: string
  maxSizeMb?: number
  onUploaded?: (result: { url?: string; file: File }) => void
}

export default function AvatarUpload({
  src,
  name,
  uploadUrl,
  accept = 'image/*',
  maxSizeMb = 5,
  onUploaded,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | null>(src || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = () => inputRef.current?.click()

  const handleFile = async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Max file size is ${maxSizeMb}MB`)
      return
    }
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    if (!uploadUrl) {
      onUploaded?.({ file })
      return
    }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(uploadUrl, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = (await res.json()) as { url?: string }
      onUploaded?.({ url: data.url, file })
      if (data.url) setPreview(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={preview ?? undefined} alt={name || 'avatar'} />
        <AvatarFallback>{name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={pick} disabled={busy}>
            {busy ? 'Uploading…' : 'Change'}
          </Button>
          {preview && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setPreview(null)}
              disabled={busy}
            >
              Remove
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
        }}
      />
    </div>
  )
}
