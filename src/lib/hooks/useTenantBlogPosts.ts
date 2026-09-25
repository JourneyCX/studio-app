import { useEffect, useState } from 'react'
import { stratumApi, type StoreBlogPost } from '../api'

// Same shape/rationale as useTenantProducts.ts — fetches the tenant's real
// published posts so the Puck editor's BlogPostList preview shows what the
// live storefront will show, instead of only ever rendering fake cards.
export type UseTenantBlogPostsResult =
  | { status: 'loading'; posts: StoreBlogPost[] }
  | { status: 'error'; posts: StoreBlogPost[] }
  | { status: 'empty'; posts: StoreBlogPost[] }
  | { status: 'success'; posts: StoreBlogPost[] }

// enabled=false skips the fetch entirely — used when "Show Placeholder" is on.
// count=undefined omits the limit param entirely so the backend's own default
// (20, see Store_builder_api::blog_posts()) applies instead of an artificial cap.
// categorySlug=undefined/'' omits the category filter, returning posts from
// every category (see Store_builder_api::blog_posts()'s `category` param).
export function useTenantBlogPosts(count: number | undefined, enabled: boolean = true, categorySlug?: string): UseTenantBlogPostsResult {
  const [state, setState] = useState<UseTenantBlogPostsResult>({ status: 'loading', posts: [] })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setState({ status: 'loading', posts: [] })
    stratumApi.getActiveBlogPosts(count, categorySlug)
      .then(result => {
        if (cancelled) return
        const posts = result.data ?? []
        setState(posts.length === 0 ? { status: 'empty', posts: [] } : { status: 'success', posts })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', posts: [] })
      })
    return () => { cancelled = true }
  }, [count, enabled, categorySlug])

  return state
}
