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
export function useTenantBlogPosts(count: number, enabled: boolean = true): UseTenantBlogPostsResult {
  const [state, setState] = useState<UseTenantBlogPostsResult>({ status: 'loading', posts: [] })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setState({ status: 'loading', posts: [] })
    stratumApi.getActiveBlogPosts(count)
      .then(result => {
        if (cancelled) return
        const posts = result.data ?? []
        setState(posts.length === 0 ? { status: 'empty', posts: [] } : { status: 'success', posts })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', posts: [] })
      })
    return () => { cancelled = true }
  }, [count, enabled])

  return state
}
