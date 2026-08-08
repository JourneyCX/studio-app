import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'

export type ImageBlockProps = {
  src: string
  alt: string
  width: string
  borderRadius: number
  objectFit: 'cover' | 'contain' | 'fill'
}

export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  label: 'Image',
  fields: {
    src: {
      type: 'custom',
      label: 'Image',
      render: ({ value, onChange }) => (
        <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} />
      ),
    },
    alt:          { type: 'text',   label: 'Alt Text' },
    width:        { type: 'text',   label: 'Width (e.g. 100% or 400px)' },
    borderRadius: { type: 'number', label: 'Border Radius (px)' },
    objectFit:    { type: 'select', label: 'Object Fit', options: [{ label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }, { label: 'Fill', value: 'fill' }] },
  },
  defaultProps: {
    src: '',
    alt: '',
    width: '100%',
    borderRadius: 0,
    objectFit: 'cover',
  },
  render({ src, alt, width, borderRadius, objectFit }) {
    if (!src) {
      return (
        <div style={{ width, border: '2px dashed #cbd5e0', borderRadius, padding: 32, textAlign: 'center', color: '#a0aec0', fontSize: 14 }}>
          📷 No image set — enter a URL in the properties panel
        </div>
      )
    }
    return (
      <img
        src={src}
        alt={alt}
        style={{ width, borderRadius, objectFit, display: 'block', maxWidth: '100%' }}
      />
    )
  },
}
