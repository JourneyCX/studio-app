import { useRef, useState } from 'react'
import { stratumApi } from '../../lib/api'

export function VideoUploadField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const result = await stratumApi.uploadActiveVideo(file)
      if (result.url) {
        onChange(result.url)
      } else {
        setError(result.error ?? 'Upload failed')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... or upload below"
          style={{ flex: 1, fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: uploading ? 'default' : 'pointer',
          fontSize: 12, padding: '5px 12px', borderRadius: 4,
          background: uploading ? '#e2e8f0' : '#ebf4ff', color: uploading ? '#a0aec0' : '#2b6cb0',
          border: '1px solid ' + (uploading ? '#e2e8f0' : '#bee3f8'),
        }}>
          {uploading ? '⏳ Uploading…' : '📁 Upload video'}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4"
            style={{ display: 'none' }}
            disabled={uploading}
            onChange={handleFile}
          />
        </label>
        {value && (
          <video src={value} muted style={{ height: 32, width: 48, objectFit: 'cover', borderRadius: 4, border: '1px solid #e2e8f0' }} />
        )}
      </div>
      {error && <span style={{ fontSize: 11, color: '#e53e3e' }}>{error}</span>}
      <span style={{ fontSize: 11, color: '#a0aec0' }}>Max 50 MB · mp4</span>
    </div>
  )
}
