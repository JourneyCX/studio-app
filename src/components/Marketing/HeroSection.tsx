import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

export type HeroSectionProps = {
  eyebrow: string
  headline: string
  headlineColor: string
  subheadline: string
  subheadlineColor: string
  textAlign: 'left' | 'center'
  primaryButtonText: string
  primaryButtonUrl: string
  primaryButtonColor: string
  secondaryButtonText: string
  secondaryButtonUrl: string
  backgroundImage: string
  backgroundColor: string
  overlayOpacity: number
  minHeight: number
}

export const HeroSection: ComponentConfig<HeroSectionProps> = {
  label: 'Hero Section',
  fields: {
    eyebrow:             { type: 'text',   label: 'Eyebrow Label (small text above headline)' },
    headline:            { type: 'text',   label: 'Headline' },
    headlineColor:       { type: 'custom', label: 'Headline Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    subheadline:         { type: 'textarea', label: 'Subheadline' },
    subheadlineColor:    { type: 'custom', label: 'Subheadline Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textAlign:           { type: 'select', label: 'Text Alignment', options: [{ label: 'Centre', value: 'center' }, { label: 'Left', value: 'left' }] },
    primaryButtonText:   { type: 'text',   label: 'Primary Button Text' },
    primaryButtonUrl:    { type: 'text',   label: 'Primary Button URL' },
    primaryButtonColor:  { type: 'custom', label: 'Primary Button Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    secondaryButtonText: { type: 'text',   label: 'Secondary Button Text' },
    secondaryButtonUrl:  { type: 'text',   label: 'Secondary Button URL' },
    backgroundImage:     { type: 'custom', label: 'Background Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor:     { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:      { type: 'number', label: 'Dark Overlay (0–100)' },
    minHeight:           { type: 'number', label: 'Min Height (px)' },
  },
  defaultProps: {
    eyebrow:             'New Collection',
    headline:            'Build Something Beautiful',
    headlineColor:       '#ffffff',
    subheadline:         'Craft stunning store pages that convert visitors into loyal customers.',
    subheadlineColor:    '#ffffff',
    textAlign:           'center',
    primaryButtonText:   'Get Started',
    primaryButtonUrl:    '/shop',
    primaryButtonColor:  '#2563eb',
    secondaryButtonText: 'Learn More',
    secondaryButtonUrl:  '/about',
    backgroundImage:     '',
    backgroundColor:     '#0f172a',
    overlayOpacity:      50,
    minHeight:           560,
  },
  render({ eyebrow, headline, headlineColor, subheadline, subheadlineColor, primaryButtonText, primaryButtonUrl, primaryButtonColor, secondaryButtonText, secondaryButtonUrl, backgroundImage, backgroundColor, overlayOpacity, textAlign, minHeight }) {
    const resolvedHeadlineColor = headlineColor || '#ffffff'
    const resolvedSubheadlineColor = subheadlineColor || '#ffffff'
    const hasImage = !!backgroundImage
    return (
      <div
        style={{
          position: 'relative',
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
          backgroundColor: hasImage ? undefined : backgroundColor,
          backgroundImage: hasImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '64px 24px',
          textAlign,
        }}
      >
        {hasImage && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: textAlign === 'center' ? 680 : 560 }}>
          {eyebrow && (
            <span style={{ display: 'inline-block', backgroundColor: primaryButtonColor, color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 20, marginBottom: 20 }}>
              {eyebrow}
            </span>
          )}
          <h1 style={{ color: resolvedHeadlineColor, fontSize: 52, fontWeight: 800, margin: '0 0 20px', lineHeight: 1.12 }}>{headline}</h1>
          {subheadline && (
            <p style={{ color: resolvedSubheadlineColor, opacity: 0.8, fontSize: 19, margin: '0 0 36px', lineHeight: 1.65 }}>{subheadline}</p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: textAlign === 'center' ? 'center' : 'flex-start' }}>
            {primaryButtonText && (
              <a href={primaryButtonUrl} style={{ display: 'inline-block', backgroundColor: primaryButtonColor, color: '#fff', padding: '14px 32px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
                {primaryButtonText}
              </a>
            )}
            {secondaryButtonText && (
              <a href={secondaryButtonUrl} style={{ display: 'inline-block', backgroundColor: 'transparent', color: resolvedHeadlineColor, padding: '14px 32px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16, border: `2px solid ${resolvedHeadlineColor}` }}>
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
      </div>
    )
  },
}
