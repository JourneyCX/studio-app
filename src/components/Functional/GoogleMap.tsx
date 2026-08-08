import type { ComponentConfig } from '@measured/puck'

export type GoogleMapProps = {
  location: string
  zoom: number
  height: number
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
  showOverlay: boolean
  overlayTitle: string
  overlayAddress: string
  overlayPhone: string
  overlayEmail: string
  overlayButtonText: string
  overlayButtonUrl: string
  overlayPosition: 'left' | 'right'
  accentColor: string
  backgroundColor: string
  textColor: string
  borderRadius: number
}

function MapPinIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
function PhoneIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}
function MailIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

export const GoogleMap: ComponentConfig<GoogleMapProps> = {
  label: 'Google Map',
  fields: {
    location:         { type: 'text',   label: 'Location (address, city, or place name)' },
    zoom:             { type: 'number', label: 'Zoom Level (1–20)' },
    height:           { type: 'number', label: 'Map Height (px)' },
    mapType:          { type: 'select', label: 'Map Type', options: [{ label: 'Road map', value: 'roadmap' }, { label: 'Satellite', value: 'satellite' }, { label: 'Hybrid', value: 'hybrid' }, { label: 'Terrain', value: 'terrain' }] },
    showOverlay:      { type: 'radio',  label: 'Show Info Card', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    overlayTitle:     { type: 'text',   label: 'Card: Business Name' },
    overlayAddress:   { type: 'textarea', label: 'Card: Address' },
    overlayPhone:     { type: 'text',   label: 'Card: Phone Number' },
    overlayEmail:     { type: 'text',   label: 'Card: Email Address' },
    overlayButtonText: { type: 'text',  label: 'Card: Button Text' },
    overlayButtonUrl:  { type: 'text',  label: 'Card: Button URL' },
    overlayPosition:  { type: 'select', label: 'Card Position', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] },
    accentColor:      { type: 'text',   label: 'Accent Colour (hex)' },
    backgroundColor:  { type: 'text',  label: 'Background Colour (hex)' },
    textColor:        { type: 'text',   label: 'Text Colour (hex)' },
    borderRadius:     { type: 'number', label: 'Border Radius (px)' },
  },
  defaultProps: {
    location:         'Cape Town, South Africa',
    zoom:             14,
    height:           480,
    mapType:          'roadmap',
    showOverlay:      true,
    overlayTitle:     'Our Store',
    overlayAddress:   '123 Long Street\nCape Town, 8001',
    overlayPhone:     '+27 21 000 0000',
    overlayEmail:     'hello@store.co.za',
    overlayButtonText: 'Get Directions',
    overlayButtonUrl:  '',
    overlayPosition:  'left',
    accentColor:      '#2563eb',
    backgroundColor:  '#ffffff',
    textColor:        '#1e293b',
    borderRadius:     16,
  },
  render({ location, zoom, height, mapType, showOverlay, overlayTitle, overlayAddress, overlayPhone, overlayEmail, overlayButtonText, overlayButtonUrl, overlayPosition, accentColor, backgroundColor, textColor, borderRadius }) {
    const clampedZoom = Math.min(20, Math.max(1, zoom))
    const mapT = mapType === 'satellite' ? 'k' : mapType === 'hybrid' ? 'h' : mapType === 'terrain' ? 'p' : 'm'
    const iframeSrc = location
      ? `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=${mapT}&z=${clampedZoom}&ie=UTF8&iwloc=near&output=embed`
      : ''

    const dirUrl = overlayButtonUrl || (location ? `https://maps.google.com/maps?q=${encodeURIComponent(location)}` : '#')

    return (
      <section style={{ backgroundColor, padding: '0' }}>
        <div style={{ position: 'relative', height, borderRadius, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              style={{ border: 'none', display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Map"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <MapPinIcon color="#94a3b8" />
              <p style={{ margin: '12px 0 0', fontSize: 15 }}>Enter a location in the panel to show the map</p>
            </div>
          )}

          {showOverlay && (
            <div style={{
              position: 'absolute',
              top: 24,
              [overlayPosition]: 24,
              backgroundColor: '#fff',
              borderRadius: borderRadius / 1.5,
              padding: '24px 28px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              maxWidth: 280,
              zIndex: 2,
            }}>
              {overlayTitle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <MapPinIcon color={accentColor} />
                  <h3 style={{ color: textColor, fontSize: 17, fontWeight: 800, margin: 0 }}>{overlayTitle}</h3>
                </div>
              )}
              {overlayAddress && (
                <p style={{ color: textColor, opacity: 0.7, fontSize: 14, lineHeight: 1.6, margin: '0 0 14px', whiteSpace: 'pre-line' }}>{overlayAddress}</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: overlayButtonText ? 18 : 0 }}>
                {overlayPhone && (
                  <a href={`tel:${overlayPhone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, opacity: 0.75, fontSize: 14, textDecoration: 'none' }}>
                    <PhoneIcon color={accentColor} />{overlayPhone}
                  </a>
                )}
                {overlayEmail && (
                  <a href={`mailto:${overlayEmail}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, opacity: 0.75, fontSize: 14, textDecoration: 'none' }}>
                    <MailIcon color={accentColor} />{overlayEmail}
                  </a>
                )}
              </div>
              {overlayButtonText && (
                <a href={dirUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', backgroundColor: accentColor, color: '#fff', padding: '10px 0', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                  {overlayButtonText}
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    )
  },
}
