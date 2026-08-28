import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

export type CallToActionProps = {
  headline: string
  subheadline: string
  primaryButtonText: string
  primaryButtonUrl: string
  primaryButtonColor: string
  secondaryButtonText: string
  secondaryButtonUrl: string
  backgroundImage: string
  backgroundColor: string
  overlayOpacity: number
  textColor: string
  paddingY: number
}

export const CallToAction: ComponentConfig<CallToActionProps> = {
  label: 'Call to Action',
  fields: {
    headline:            { type: 'text',    label: 'Headline' },
    subheadline:         { type: 'textarea', label: 'Subheadline' },
    primaryButtonText:   { type: 'text',   label: 'Primary Button Text' },
    primaryButtonUrl:    { type: 'text',   label: 'Primary Button URL' },
    primaryButtonColor:  { type: 'custom', label: 'Primary Button Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    secondaryButtonText: { type: 'text',   label: 'Secondary Button Text (optional)' },
    secondaryButtonUrl:  { type: 'text',   label: 'Secondary Button URL' },
    backgroundImage:     { type: 'custom', label: 'Background Image (optional)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor:     { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:      { type: 'number', label: 'Dark Overlay (0–100, used with image)' },
    textColor:           { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    paddingY:            { type: 'number', label: 'Vertical Padding (px)' },
  },
  defaultProps: {
    headline:            'Ready to Get Started?',
    subheadline:         'Join thousands of businesses growing with our platform. Set up your store in minutes.',
    primaryButtonText:   'Start for Free',
    primaryButtonUrl:    '/signup',
    primaryButtonColor:  '#ffffff',
    secondaryButtonText: 'Talk to Sales',
    secondaryButtonUrl:  '/contact',
    backgroundImage:     '',
    backgroundColor:     '#2563eb',
    overlayOpacity:      55,
    textColor:           '#ffffff',
    paddingY:            80,
  },
  render({ headline, subheadline, primaryButtonText, primaryButtonUrl, primaryButtonColor, secondaryButtonText, secondaryButtonUrl, backgroundImage, backgroundColor, overlayOpacity, textColor, paddingY }) {
    const hasImage = !!backgroundImage
    return (
      <section
        style={{
          position: 'relative',
          backgroundColor: hasImage ? undefined : backgroundColor,
          backgroundImage: hasImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: `${paddingY}px 24px`,
          textAlign: 'center',
        }}
      >
        {hasImage && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
          <h2 className="sb-text-fluid-md" style={{ color: textColor, fontWeight: 800, margin: '0 0 20px', lineHeight: 1.15 }}>{headline}</h2>
          {subheadline && (
            <p style={{ color: textColor, opacity: 0.85, fontSize: 18, margin: '0 0 40px', lineHeight: 1.65 }}>{subheadline}</p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {primaryButtonText && (
              <a
                href={primaryButtonUrl}
                style={{
                  display: 'inline-block',
                  backgroundColor: primaryButtonColor,
                  color: primaryButtonColor === '#ffffff' || primaryButtonColor === '#fff' ? backgroundColor : '#fff',
                  padding: '15px 36px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {primaryButtonText}
              </a>
            )}
            {secondaryButtonText && (
              <a
                href={secondaryButtonUrl}
                style={{
                  display: 'inline-block',
                  backgroundColor: 'transparent',
                  color: textColor,
                  padding: '15px 36px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 16,
                  border: `2px solid ${textColor}66`,
                }}
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
      </section>
    )
  },
}
