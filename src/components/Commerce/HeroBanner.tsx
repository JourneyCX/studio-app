import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

export type HeroBannerProps = {
  headline: string
  subheadline: string
  buttonText: string
  buttonUrl: string
  buttonColor: string
  buttonTextColor: string
  buttonBorderColor: string
  buttonBorderWidth: number
  backgroundImage: string
  overlayOpacity: number
  textAlign: 'left' | 'center' | 'right'
  minHeight: number
  borderRadius: number
  // 0 (default) keeps the headline on the responsive sb-text-fluid-lg clamp
  // (28px–52px across viewport widths) instead of a fixed size.
  headlineFontSize: number
  subheadlineFontSize: number
}

export const HeroBanner: ComponentConfig<HeroBannerProps> = {
  label: 'Hero Banner',
  fields: {
    headline:          { type: 'text',    label: 'Headline' },
    subheadline:       { type: 'textarea',label: 'Subheadline' },
    buttonText:        { type: 'text',    label: 'Button Text' },
    buttonUrl:         { type: 'text',    label: 'Button URL' },
    buttonColor:       { type: 'custom',  label: 'Button Background (hex, or "transparent")', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} placeholder="#3182ce or transparent" /> },
    buttonTextColor:   { type: 'custom',  label: 'Button Text Colour', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    buttonBorderColor: { type: 'custom',  label: 'Button Border Colour (blank = no border)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} placeholder="none" /> },
    buttonBorderWidth: { type: 'number',  label: 'Button Border Width (px)' },
    backgroundImage:   { type: 'custom',  label: 'Background Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:    { type: 'number',  label: 'Dark Overlay (0–100)' },
    textAlign:         { type: 'select',  label: 'Text Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
    minHeight:         { type: 'number',  label: 'Min Height (px)' },
    borderRadius:      { type: 'number',  label: 'Border Radius (px)' },
    headlineFontSize:    { type: 'number', label: 'Headline Font Size (px, 0 = auto)' },
    subheadlineFontSize: { type: 'number', label: 'Subheadline Font Size (px, 0 = auto)' },
  },
  defaultProps: {
    headline:          'Welcome to Our Store',
    subheadline:       'Discover our latest collection of products.',
    buttonText:        'Shop Now',
    buttonUrl:         '/shop',
    buttonColor:       '#3182ce',
    buttonTextColor:   '#ffffff',
    buttonBorderColor: '',
    buttonBorderWidth: 0,
    backgroundImage:   '',
    overlayOpacity:    40,
    textAlign:         'center',
    minHeight:         480,
    borderRadius:      0,
    headlineFontSize:    0,
    subheadlineFontSize: 0,
  },
  render({ headline, subheadline, buttonText, buttonUrl, buttonColor, buttonTextColor, buttonBorderColor, buttonBorderWidth, backgroundImage, overlayOpacity, textAlign, minHeight, borderRadius, headlineFontSize, subheadlineFontSize }) {
    return (
      <div
        style={{
          position: 'relative',
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundColor: backgroundImage ? undefined : '#2d3748',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '40px 24px',
          textAlign,
          borderRadius,
          overflow: 'hidden',
        }}
      >
        {backgroundImage && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
          {/* sb-text-fluid-lg (styles/responsive.css) scales this down on
              narrow screens instead of staying fixed at 48px. */}
          <h1 className="sb-text-fluid-lg" style={{ color: '#fff', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.15, ...(headlineFontSize ? { fontSize: headlineFontSize } : {}) }}>{headline}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: subheadlineFontSize || 18, margin: '0 0 32px', lineHeight: 1.6 }}>{subheadline}</p>
          {buttonText && (
            <a
              href={buttonUrl}
              style={{
                display: 'inline-block',
                backgroundColor: buttonColor,
                color: buttonTextColor || '#fff',
                border: buttonBorderWidth > 0 && buttonBorderColor ? `${buttonBorderWidth}px solid ${buttonBorderColor}` : 'none',
                padding: '14px 32px',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {buttonText}
            </a>
          )}
        </div>
      </div>
    )
  },
}
