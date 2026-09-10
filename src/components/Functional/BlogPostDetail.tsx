import type { ComponentConfig } from '@measured/puck'
import { useTenantBlogPosts } from '../../lib/hooks/useTenantBlogPosts'

// Renders the tenant's actual blog post page when assigned to a theme's
// "blog_post" slot (Store_theme_manager) — the live storefront (nuxt-storefront's
// BlogPostDetail.vue) reads the real post from the page's own URL slug and
// ports the existing, already-working rendering from the previous hardcoded
// pages/blog/[slug].vue wholesale. This editor-side component is preview-only:
// there is no "real" post being viewed while authoring a shared template, so
// it shows one representative sample post (the tenant's most recent one)
// purely for WYSIWYG purposes.
export type BlogPostDetailProps = Record<string, never>

export const BlogPostDetail: ComponentConfig<BlogPostDetailProps> = {
  label: 'Blog Post Detail',
  fields: {},
  defaultProps: {},
  render() {
    const { status, posts } = useTenantBlogPosts(1)
    const sample = status === 'success' ? posts[0] : undefined

    const title    = sample?.title ?? 'Sample Blog Post'
    const category = sample?.categories?.[0]?.name ?? null
    const image    = sample?.featured_image ?? null
    const author   = sample?.author ?? 'Author Name'
    const date     = sample?.published_at ?? null

    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
        {category && (
          <span style={{ display: 'inline-block', background: '#2563eb18', color: '#2563eb', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
            {category}
          </span>
        )}
        <h1 style={{ margin: '0 0 16px', fontSize: 30, fontWeight: 800, color: '#1a202c', lineHeight: 1.25 }}>{title}</h1>
        <div style={{ display: 'flex', gap: 14, color: '#718096', fontSize: 13, marginBottom: 24 }}>
          {date && <span>{date}</span>}
          <span>{author}</span>
        </div>
        <div style={{ aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#f7f8fa', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {image
            ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: '#a0aec0', fontSize: 13 }}>📷 Featured Image</span>
          }
        </div>
        <div style={{ fontSize: 12, color: '#a0aec0', padding: '16px 0', borderTop: '1px solid #e2e8f0' }}>
          The full post body renders automatically here for a real post
        </div>
      </div>
    )
  },
}
