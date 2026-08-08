import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'

export type HeroBannerProps = {
  headline: string
  subheadline: string
  buttonText: string
  buttonUrl: string
  buttonColor: string
  backgroundImage: string
  overlayOpacity: number
  textAlign: 'left' | 'center' | 'right'
  minHeight: number
}

export const HeroBanner: ComponentConfig<HeroBannerProps> = {
  label: 'Hero Banner',
  fields: {
    headline:        { type: 'text',    label: 'Headline' },
    subheadline:     { type: 'textarea',label: 'Subheadline' },
    buttonText:      { type: 'text',    label: 'Button Text' },
    buttonUrl:       { type: 'text',    label: 'Button URL' },
    buttonColor:     { type: 'text',    label: 'Button Colour (hex)' },
    backgroundImage: { type: 'custom',  label: 'Background Image', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:  { type: 'number',  label: 'Dark Overlay (0–100)' },
    textAlign:       { type: 'select',  label: 'Text Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
    minHeight:       { type: 'number',  label: 'Min Height (px)' },
  },
  defaultProps: {
    headline:        'Welcome to Our Store',
    subheadline:     'Discover our latest collection of products.',
    buttonText:      'Shop Now',
    buttonUrl:       '/shop',
    buttonColor:     '#3182ce',
    backgroundImage: '',
    overlayOpacity:  40,
    textAlign:       'center',
    minHeight:       480,
  },
  render({ headline, subheadline, buttonText, buttonUrl, buttonColor, backgroundImage, overlayOpacity, textAlign, minHeight }) {
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
        }}
      >
        {backgroundImage && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
          <h1 style={{ color: '#fff', fontSize: 48, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.15 }}>{headline}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, margin: '0 0 32px', lineHeight: 1.6 }}>{subheadline}</p>
          {buttonText && (
            <a
              href={buttonUrl}
              style={{
                display: 'inline-block',
                backgroundColor: buttonColor,
                color: '#fff',
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
