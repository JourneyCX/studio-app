import type { ComponentConfig } from '@measured/puck'
import { ImageUploadField } from '../shared/ImageUploadField'
import { ColorField } from '../shared/ColorField'

type TeamMember = {
  photo: string
  name: string
  role: string
  bio: string
  linkedin: string
  twitter: string
}

export type TeamSectionProps = {
  headline: string
  subheadline: string
  columns: 2 | 3 | 4
  backgroundColor: string
  cardColor: string
  textColor: string
  accentColor: string
  members: TeamMember[]
}

export const TeamSection: ComponentConfig<TeamSectionProps> = {
  label: 'Team Section',
  fields: {
    headline:        { type: 'text',    label: 'Section Headline' },
    subheadline:     { type: 'textarea', label: 'Section Subheadline' },
    columns:         { type: 'select',  label: 'Columns', options: [{ label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }] },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    cardColor:       { type: 'custom', label: 'Card Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:       { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    accentColor:     { type: 'custom', label: 'Accent / Link Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    members: {
      type: 'array',
      label: 'Team Members',
      arrayFields: {
        photo:    { type: 'custom', label: 'Photo', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
        name:     { type: 'text',    label: 'Full Name' },
        role:     { type: 'text',    label: 'Job Title / Role' },
        bio:      { type: 'textarea', label: 'Short Bio' },
        linkedin: { type: 'text',    label: 'LinkedIn URL (optional)' },
        twitter:  { type: 'text',    label: 'Twitter / X URL (optional)' },
      },
      defaultItemProps: {
        photo: '',
        name: 'Team Member',
        role: 'Role Title',
        bio: 'Short bio about this team member and their expertise.',
        linkedin: '',
        twitter: '',
      },
      getItemSummary: (item: TeamMember) => item.name || 'Member',
    },
  },
  defaultProps: {
    headline:        'Meet the Team',
    subheadline:     'The people behind the product.',
    columns:         3,
    backgroundColor: '#ffffff',
    cardColor:       '#f8fafc',
    textColor:       '#1e293b',
    accentColor:     '#2563eb',
    members: [
      { photo: '', name: 'Alex Morgan', role: 'Founder & CEO', bio: 'Passionate about building products that make a real difference for small businesses.', linkedin: '', twitter: '' },
      { photo: '', name: 'Sam Patel', role: 'Head of Product', bio: 'Obsessed with user experience and turning complex problems into elegant solutions.', linkedin: '', twitter: '' },
      { photo: '', name: 'Jordan Lee', role: 'Lead Developer', bio: 'Full-stack engineer with a love for performance and clean, maintainable code.', linkedin: '', twitter: '' },
    ],
  },
  render({ headline, subheadline, columns, backgroundColor, cardColor, textColor, accentColor, members }) {
    return (
      <section style={{ backgroundColor, padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {(headline || subheadline) && (
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              {headline && <h2 style={{ color: textColor, fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>{headline}</h2>}
              {subheadline && <p style={{ color: textColor, opacity: 0.7, fontSize: 18, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 28 }}>
            {members.map((member, i) => (
              <div key={i} style={{ backgroundColor: cardColor, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '4/3', backgroundColor: accentColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 56, color: accentColor, fontWeight: 700 }}>{member.name.charAt(0)}</span>
                  </div>
                )}
                <div style={{ padding: '24px 28px' }}>
                  <h3 style={{ color: textColor, fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{member.name}</h3>
                  <p style={{ color: accentColor, fontSize: 14, fontWeight: 600, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{member.role}</p>
                  {member.bio && <p style={{ color: textColor, opacity: 0.7, fontSize: 14, lineHeight: 1.65, margin: '0 0 18px' }}>{member.bio}</p>}
                  {(member.linkedin || member.twitter) && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                          LinkedIn ↗
                        </a>
                      )}
                      {member.twitter && (
                        <a href={member.twitter} target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                          Twitter ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  },
}
