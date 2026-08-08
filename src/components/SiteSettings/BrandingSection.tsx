import { ImageUploadField } from '../shared/ImageUploadField'
import type { SiteSettings } from '../../lib/siteSettings'

interface SectionProps {
  settings: SiteSettings
  onChange: (patch: Partial<SiteSettings>) => void
}

const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }
const hint: React.CSSProperties  = { fontSize: 12, color: '#94a3b8', marginTop: 6 }
const group: React.CSSProperties = { marginBottom: 32 }

// Deliberately just logo + favicon — matches exactly what the old admin page's
// "Store Branding" panel had. Dark/light logo variants were scoped out on review;
// this is a single-logo upload like the admin page always had.
export function BrandingSection({ settings, onChange }: SectionProps) {
  return (
    <div>
      <div style={group}>
        <label style={label}>Logo</label>
        <ImageUploadField value={settings.logoUrl ?? ''} onChange={v => onChange({ logoUrl: v || null })} />
        <p style={hint}>Shown in the header of your store. Recommended: transparent PNG or SVG.</p>
      </div>

      <div style={group}>
        <label style={label}>Favicon</label>
        <ImageUploadField value={settings.faviconUrl ?? ''} onChange={v => onChange({ faviconUrl: v || null })} />
        <p style={hint}>Shown in the browser tab. Square, at least 32×32px. PNG works in every modern browser.</p>
      </div>
    </div>
  )
}
