import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { useTenantBlogPosts } from '../../lib/hooks/useTenantBlogPosts'
import type { StoreBlogPost } from '../../lib/api'

type BlogPost = { title: string; excerpt: string; thumbnail: string; date: string; author: string; category: string; url: string }

// e.g. "2026-08-10 14:32:42" -> "10 Aug 2026", matching the manual field's own
// example format ("e.g. 15 Jan 2025") so Auto and Manual cards read the same.
function formatPostDate(published_at: string | null): string {
  if (!published_at) return ''
  const d = new Date(published_at.replace(' ', 'T'))
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toCardPost(p: StoreBlogPost): BlogPost {
  return {
    title: p.title,
    excerpt: p.excerpt ?? '',
    thumbnail: p.featured_image ?? '',
    date: formatPostDate(p.published_at),
    author: p.author,
    category: p.categories[0]?.name ?? '',
    url: p.url,
  }
}

export type BlogPostListProps = {
  headline: string
  subheadline: string
  layout: 'grid' | 'list' | 'featured'
  columns: 2 | 3
  showAuthor: boolean
  showDate: boolean
  showCategory: boolean
  showExcerpt: boolean
  readMoreText: string
  // ctaText/ctaUrl add an optional section-level "view all" link; postCount caps how
  // many stored posts are rendered. Both were part of an earlier schema some live themes
  // were authored against; restored as additive optional fields.
  ctaText?: string
  ctaUrl?: string
  postCount?: number
  // Additive field — absent on any page saved before this existed, which must keep
  // rendering its hand-typed `posts` array exactly as before (see ?? 'manual' below).
  postsSource?: 'manual' | 'auto'
  accentColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  borderRadius: number
  posts: BlogPost[]
}

const PLACEHOLDER_COLORS = ['#bfdbfe', '#fde68a', '#bbf7d0', '#fecdd3', '#ddd6fe']

function CalendarIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> }
function UserIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> }

function PostCard({ title, excerpt, thumbnail, date, author, category, url, i, layout, showAuthor, showDate, showCategory, showExcerpt, readMoreText, accentColor, cardColor, textColor, borderRadius }: BlogPost & { i: number; layout: string; showAuthor: boolean; showDate: boolean; showCategory: boolean; showExcerpt: boolean; readMoreText: string; accentColor: string; cardColor: string; textColor: string; borderRadius: number }) {
  const isList = layout === 'list'
  return (
    <article style={{ backgroundColor: cardColor, borderRadius, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: isList ? 'flex' : 'block', border: '1px solid #f1f5f9' }}>
      {/* min(200px, 30vw) keeps this list-view thumbnail from forcing horizontal
          overflow in the flex row on a narrow phone */}
      <div style={isList ? { width: 'min(200px, 30vw)', flexShrink: 0 } : { aspectRatio: '16/9', position: 'relative' }}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: isList ? '100%' : undefined, aspectRatio: isList ? undefined : '16/9', backgroundColor: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, opacity: 0.6 }}>
            📝
          </div>
        )}
      </div>
      <div style={{ padding: isList ? '20px 24px' : '20px 22px 24px' }}>
        {showCategory && category && (
          <span style={{ display: 'inline-block', backgroundColor: accentColor + '18', color: accentColor, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
            {category}
          </span>
        )}
        <h3 style={{ color: textColor, fontSize: isList ? 20 : 18, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.35 }}>
          <a href={url} style={{ color: 'inherit', textDecoration: 'none' }}>{title || `Blog Post ${i + 1}`}</a>
        </h3>
        {showExcerpt && excerpt && (
          <p style={{ color: textColor, opacity: 0.65, fontSize: 14, lineHeight: 1.65, margin: '0 0 16px' }}>{excerpt}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {showDate && date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: textColor, opacity: 0.5, fontSize: 12 }}><CalendarIcon />{date}</span>
            )}
            {showAuthor && author && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: textColor, opacity: 0.5, fontSize: 12 }}><UserIcon />{author}</span>
            )}
          </div>
          {readMoreText && (
            <a href={url} style={{ color: accentColor, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {readMoreText} →
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export const BlogPostList: ComponentConfig<BlogPostListProps> = {
  label: 'Blog Post List',
  fields: {
    headline:     { type: 'text',    label: 'Section Headline' },
    subheadline:  { type: 'textarea', label: 'Section Subheadline' },
    layout:       { type: 'select',  label: 'Layout', options: [{ label: 'Grid', value: 'grid' }, { label: 'List (horizontal cards)', value: 'list' }, { label: 'Featured (first post large)', value: 'featured' }] },
    columns:      { type: 'select',  label: 'Grid Columns', options: [{ label: '2', value: 2 }, { label: '3', value: 3 }] },
    showAuthor:   { type: 'radio',   label: 'Show Author',   options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showDate:     { type: 'radio',   label: 'Show Date',     options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showCategory: { type: 'radio',   label: 'Show Category', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showExcerpt:  { type: 'radio',   label: 'Show Excerpt',  options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    readMoreText: { type: 'text',    label: '"Read More" Text' },
    ctaText:      { type: 'text',    label: '"View All" Link Text (leave blank to hide)' },
    ctaUrl:       { type: 'text',    label: '"View All" Link URL' },
    postsSource: {
      type: 'radio', label: 'Posts',
      options: [
        { label: 'Auto — latest published posts', value: 'auto' },
        { label: 'Manual — pick posts below', value: 'manual' },
      ],
    },
    postCount:    { type: 'number',  label: 'Max Posts to Show (leave blank for all in Manual, 3 in Auto)' },
    accentColor:  { type: 'custom',  label: 'Accent Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    backgroundColor: { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    cardColor:    { type: 'custom',  label: 'Card Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:    { type: 'custom',  label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    borderRadius: { type: 'number',  label: 'Card Border Radius (px)' },
    posts: {
      type: 'array', label: 'Blog Posts',
      arrayFields: {
        title:     { type: 'text',    label: 'Title' },
        excerpt:   { type: 'textarea', label: 'Excerpt' },
        thumbnail: { type: 'text',    label: 'Thumbnail URL' },
        date:      { type: 'text',    label: 'Date (e.g. 15 Jan 2025)' },
        author:    { type: 'text',    label: 'Author Name' },
        category:  { type: 'text',    label: 'Category' },
        url:       { type: 'text',    label: 'Post URL' },
      },
      defaultItemProps: { title: 'Blog Post Title', excerpt: 'A short excerpt or summary of the blog post goes here.', thumbnail: '', date: '1 Jun 2025', author: 'The Team', category: 'News', url: '/blog/post' },
      getItemSummary: (p: BlogPost) => p.title || 'Post',
    },
  },
  defaultProps: {
    headline:     'From the Blog',
    subheadline:  'Tips, stories, and news from our team.',
    layout:       'grid',
    columns:      3,
    showAuthor:   true,
    showDate:     true,
    showCategory: true,
    showExcerpt:  true,
    readMoreText: 'Read more',
    ctaText:      '',
    ctaUrl:       '',
    postsSource:  'auto',
    accentColor:  '#2563eb',
    backgroundColor: '#f8fafc',
    cardColor:    '#ffffff',
    textColor:    '#1e293b',
    borderRadius: 12,
    posts: [
      { title: '5 Ways to Style Your Home This Season', excerpt: 'Discover the trending home décor styles and how to incorporate them into your space without breaking the budget.', thumbnail: '', date: '20 May 2025', author: 'Sarah K.', category: 'Lifestyle', url: '/blog/home-styling' },
      { title: 'Behind the Brand: Our Story', excerpt: 'We sat down with our founders to talk about how the business started, and where it\'s headed next.', thumbnail: '', date: '10 May 2025', author: 'The Team', category: 'Brand', url: '/blog/our-story' },
      { title: 'Sustainable Packaging: Why It Matters', excerpt: 'How we\'re rethinking our packaging to reduce waste without compromising on quality or presentation.', thumbnail: '', date: '2 May 2025', author: 'Jordan L.', category: 'Sustainability', url: '/blog/packaging' },
    ],
  },
  render({ headline, subheadline, layout, columns, showAuthor, showDate, showCategory, showExcerpt, readMoreText, ctaText, ctaUrl, postCount, postsSource, accentColor, backgroundColor, cardColor, textColor, borderRadius, posts: manualPosts }) {
    const cardProps = { layout, showAuthor, showDate, showCategory, showExcerpt, readMoreText, accentColor, cardColor, textColor, borderRadius }
    // ?? 'manual' (not 'auto'): a page saved before this field existed has no
    // postsSource key at all and must keep rendering its hand-typed posts
    // array exactly as before — only NEW blocks default to 'auto'.
    const isAuto = (postsSource ?? 'manual') === 'auto'
    const autoCount = typeof postCount === 'number' ? postCount : 3
    const { status, posts: livePosts } = useTenantBlogPosts(autoCount, isAuto)

    let posts: BlogPost[]
    let loadError = false
    if (isAuto) {
      if (status === 'success') posts = livePosts.map(toCardPost)
      else { posts = []; loadError = status === 'error' }
    } else {
      posts = typeof postCount === 'number' ? manualPosts.slice(0, postCount) : manualPosts
    }

    let grid: React.ReactNode
    if (isAuto && status === 'loading') {
      grid = <div style={{ color: textColor, opacity: 0.5, fontSize: 14, padding: 32, textAlign: 'center' }}>Loading posts…</div>
    } else if (isAuto && loadError) {
      grid = <div style={{ color: '#dd6b20', fontSize: 13, padding: 32, textAlign: 'center' }}>⚠ Couldn't load live posts.</div>
    } else if (isAuto && posts.length === 0) {
      grid = <div style={{ color: textColor, opacity: 0.5, fontSize: 14, padding: 32, textAlign: 'center' }}>No published posts yet — publish one in Store Blog, or switch to Manual to preview the layout.</div>
    } else if (layout === 'featured' && posts.length > 0) {
      const [first, ...rest] = posts
      grid = (
        <div style={{ display: 'grid', gridTemplateColumns: rest.length ? '1.6fr 1fr' : '1fr', gap: 24 }}>
          <PostCard {...first} i={0} {...cardProps} />
          {rest.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {rest.slice(0, 3).map((p, i) => <PostCard key={i + 1} {...p} i={i + 1} {...cardProps} />)}
            </div>
          )}
        </div>
      )
    } else {
      grid = (
        // sb-grid (styles/responsive.css) collapses this to 1 column on mobile
        // and 2 on tablet regardless of the merchant's chosen column count —
        // harmless in list mode too since display:flex ignores grid-template-columns.
        <div className="sb-grid" style={{ display: 'flex', flexDirection: layout === 'list' ? 'column' : 'grid' as React.CSSProperties['flexDirection'], ...(layout !== 'list' ? { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)` } : {}), gap: 20 }}>
          {posts.map((p, i) => <PostCard key={i} {...p} i={i} {...cardProps} />)}
        </div>
      )
    }

    return (
      <section style={{ backgroundColor, padding: '64px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {(headline || subheadline || ctaText) && (
            <div style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                {/* sb-text-fluid-md (styles/responsive.css) scales this headline between
                    mobile and desktop instead of staying fixed at 32px */}
                {headline    && <h2 className="sb-text-fluid-md" style={{ color: textColor, fontWeight: 800, margin: '0 0 12px' }}>{headline}</h2>}
                {subheadline && <p  style={{ color: textColor, opacity: 0.65, fontSize: 17, margin: 0 }}>{subheadline}</p>}
              </div>
              {ctaText && (
                <a href={ctaUrl || '#'} style={{ color: accentColor, fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  {ctaText} →
                </a>
              )}
            </div>
          )}
          {grid}
        </div>
      </section>
    )
  },
}
