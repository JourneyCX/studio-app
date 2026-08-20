/// <reference types="vite/client" />
import type { StorePage, PageTypeConfig, MenuLocation } from './pages'
// Stratum API client for the Studio app.
// All calls include the JWT as X-Stratum-Token header.

// STRATUM_ORIGIN is read from the ?api= URL param injected by studio.php.
// This makes the Studio work from both master admin and any perfex_saas
// tenant admin (each has a different URL prefix). Falls back to the build-time
// env var for local development.
function resolveStratumOrigin(): string {
    try {
        const params = new URLSearchParams(window.location.search)
        const api = params.get('api')
        if (api) return api.replace(/\/$/, '')
    } catch { /* SSR / test env — ignore */ }
    return (import.meta.env.VITE_STRATUM_URL || 'https://stage.journeycx.net').replace(/\/$/, '')
}
const STRATUM_ORIGIN = resolveStratumOrigin()
// Exported so PagesPanel/App.tsx can build a full admin URL (`${STRATUM_ORIGIN}/admin/...`)
// for the "Edit" action's full-page navigation — the same origin every other
// call in this file already targets.
export { STRATUM_ORIGIN }

// Module-level active token — set once after verifyToken succeeds.
// Allows components deep in the Puck config (e.g. ImageBlock custom field)
// to upload images without threading the token through props.
let _activeToken = ''
export function setActiveToken(token: string) { _activeToken = token }
export function getActiveToken() { return _activeToken }

// Module-level active tenant ID — same rationale as _activeToken above, needed
// by the Product Category custom field (ProductGrid/Carousel/Showcase), which
// is a static ComponentConfig import with no tenant context threaded through props.
let _activeTenantId = 0
export function setActiveTenantId(tenantId: number) { _activeTenantId = tenantId }
export function getActiveTenantId() { return _activeTenantId }

// Thrown specifically for a 401 from the JWT-gated Store Builder API — the
// token's 1-hour expiry (see store_builder_helper.php) is the only thing that
// produces this status. Callers use it to show a "reload to continue" prompt
// instead of a generic failure message, since a plain retry can never succeed.
export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionExpiredError'
  }
}

async function request<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<T> {
  // Apache + PHP-FPM (proxy:unix socket) strips the Authorization header.
  // X-Stratum-Token is passed through reliably and read by store_builder_bearer_token().
  const res = await fetch(`${STRATUM_ORIGIN}${path}`, {
    method,
    headers: {
      'X-Stratum-Token': token,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    if (res.status === 401) {
      throw new SessionExpiredError(err.error || 'Session expired.')
    }
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface StudioSession {
  tenantId: number
  pageSlug: string
  tier: 'basic' | 'pro' | 'enterprise'
  exp: number
}

export interface PageData {
  puckJson: Record<string, unknown>
  name: string
}

// A whole-site theme from admin Theme Manager (tblstore_themes), as returned by
// Store_builder_api::themes(). Distinct from StoreTemplate (types/templates.ts),
// which is a single-page Puck layout — a theme is header/footer chrome plus one
// template per page-type slot (home/product/collection/...).
export interface ThemeSlot {
  theme_id: string
  page_type: string
  template_id: string
  is_required: string
  template_name: string | null
}

export interface StoreTheme {
  id: string
  name: string
  slug: string
  category: string
  description: string
  preview_image: string
  tags: string[]
  status: string
  is_active: boolean
  slots: ThemeSlot[]
}

export interface ReorderChange {
  id: number
  menuLocation: MenuLocation
  menuOrder: number
  menuParentId: number | null
}

export interface PageSettingsPatch {
  pageType?: string
  pageTypeConfig?: PageTypeConfig | null
  seoTitle?: string | null
  seoDescription?: string | null
  ogImageUrl?: string | null
  pageName?: string
}

// Real synced product, as returned by Store_builder_api::products(). image_url
// is already rewritten through the wc_image proxy (or null) — never a raw
// tenant-internal WC host URL, which the browser couldn't reach anyway.
export interface StoreProduct {
  id: number
  name: string
  slug: string
  price: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  image_url: string | null
  permalink: string
  stock_status: string
  sku: string
}

// Real published post, as returned by Store_builder_api::blog_posts(). url is
// already the relative /blog/{slug} path the storefront route expects.
export interface StoreBlogPost {
  id: number
  title: string
  slug: string
  url: string
  excerpt: string | null
  featured_image: string | null
  published_at: string | null
  author: string
  categories: { name: string; slug: string }[]
}

export const stratumApi = {
  verifyToken(token: string): Promise<StudioSession> {
    return request('GET', '/admin/store_builder_api/verify_token', token)
  },

  loadPage(tenantId: number, pageSlug: string, token: string): Promise<PageData> {
    return request('GET', `/admin/store_builder_api/page/${tenantId}/${pageSlug}`, token)
  },

  // Resolves to the tenant's verified custom domain if set, else their
  // platform preview subdomain — always returns a URL, even pre-provisioning.
  getLiveUrl(tenantId: number, token: string): Promise<{ liveUrl: string }> {
    return request('GET', `/admin/store_builder_api/live_url/${tenantId}`, token)
  },

  // Single source of truth for Header/Footer chrome + site-wide branding — no auth
  // required server-side (same precedent as branding()/published_page()), but the
  // token is sent anyway since request() always attaches it.
  getSiteSettings(tenantId: number, token: string): Promise<{ settings: import('./siteSettings').SiteSettings | null }> {
    return request('GET', `/admin/store_builder_api/site_settings?tenantId=${tenantId}`, token)
  },

  // Studio's write path for the Site Settings panel (Branding/Colors/Store Settings).
  // `data` is any subset of the SiteSettings shape — only keys actually present are
  // saved server-side, so a Branding-only save doesn't touch Colors/Store Settings.
  // Named update_site_settings (not site_settings) on the backend to avoid colliding
  // with the GET route above — see the controller for why.
  saveSiteSettings(
    tenantId: number,
    data: Partial<import('./siteSettings').SiteSettings>,
    token: string,
  ): Promise<{ success: boolean }> {
    return request('PUT', `/admin/store_builder_api/update_site_settings/${tenantId}`, token, data)
  },

  // ── Pages panel ────────────────────────────────────────────────────────
  // pages() above already returns the full StorePage shape once
  // Store_builder_model::get_pages() carries the new columns — no separate
  // fetch needed; getPages() here is just a typed alias for readability at
  // PagesPanel's call site.
  getPages(tenantId: number, token: string): Promise<{ pages: StorePage[] }> {
    return request('GET', `/admin/store_builder_api/pages/${tenantId}`, token)
  },

  createPage(tenantId: number, pageName: string, token: string): Promise<{ success: boolean; page: StorePage }> {
    return request('POST', `/admin/store_builder_api/create_page/${tenantId}`, token, { pageName })
  },

  deletePage(tenantId: number, pageId: number, token: string): Promise<{ success: boolean }> {
    return request('DELETE', `/admin/store_builder_api/page_delete/${tenantId}/${pageId}`, token)
  },

  updatePageSettings(tenantId: number, pageId: number, data: PageSettingsPatch, token: string): Promise<{ success: boolean }> {
    return request('PUT', `/admin/store_builder_api/page_settings/${tenantId}/${pageId}`, token, data)
  },

  reorderPages(tenantId: number, changes: ReorderChange[], token: string): Promise<{ success: boolean }> {
    return request('PUT', `/admin/store_builder_api/reorder_pages/${tenantId}`, token, { changes })
  },

  saveDraft(tenantId: number, pageSlug: string, puckJson: unknown, pageName: string, token: string): Promise<{ success: boolean }> {
    return request('PUT', `/admin/store_builder_api/save_draft/${tenantId}/${pageSlug}`, token, { puckJson, name: pageName })
  },

  publishPage(tenantId: number, pageSlug: string, puckJson: unknown, token: string): Promise<{ success: boolean; publishedUrl?: string }> {
    return request('POST', `/admin/store_builder_api/publish/${tenantId}/${pageSlug}`, token, { puckJson })
  },

  uploadImage(file: File, token: string): Promise<{ url: string }> {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${STRATUM_ORIGIN}/admin/store_builder_api/upload_image`, {
      method: 'POST',
      headers: {
        'X-Stratum-Token': token,
        'Accept': 'application/json',
      },
      body: form,
    }).then(r => r.json())
  },

  // Convenience wrapper — uses the module-level active token (set after login).
  uploadActiveImage(file: File): Promise<{ url: string; error?: string }> {
    return stratumApi.uploadImage(file, _activeToken)
  },

  uploadVideo(file: File, token: string): Promise<{ url: string; error?: string }> {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${STRATUM_ORIGIN}/admin/store_builder_api/upload_video`, {
      method: 'POST',
      headers: {
        'X-Stratum-Token': token,
        'Accept': 'application/json',
      },
      body: form,
    }).then(r => r.json())
  },

  // Convenience wrapper — uses the module-level active token (set after login).
  uploadActiveVideo(file: File): Promise<{ url: string; error?: string }> {
    return stratumApi.uploadVideo(file, _activeToken)
  },

  // Product Category dropdown fields (ProductGrid/Carousel/Showcase). Reads the
  // tenant's real, live WooCommerce categories so a merchant picks a category by
  // name instead of typing a slug — see Store_builder_api::categories() for why
  // this hits WC directly rather than sb_category_pages/items_groups.
  getCategories(tenantId: number, token: string): Promise<{ categories: Array<{ name: string; slug: string }> }> {
    return request('GET', `/admin/store_builder_api/categories/${tenantId}`, token)
  },

  // Convenience wrapper — uses the module-level active token/tenant (set after login).
  getActiveCategories(): Promise<{ categories: Array<{ name: string; slug: string }> }> {
    return stratumApi.getCategories(_activeTenantId, _activeToken)
  },

  // Real synced products for ProductGrid/Carousel/Showcase's live-preview render
  // inside the Puck editor — see Store_builder_api::products() for the WC-backed
  // implementation and the wc_image proxy image_url is already rewritten through.
  // categorySlug accepts a comma-separated list (ProductFilter's multi-select).
  getProducts(
    tenantId: number,
    token: string,
    opts?: { categorySlug?: string; perPage?: number; maxPrice?: number; search?: string },
  ): Promise<{ products: StoreProduct[] }> {
    const params = new URLSearchParams()
    if (opts?.categorySlug) params.set('category_slug', opts.categorySlug)
    if (opts?.perPage) params.set('per_page', String(opts.perPage))
    if (opts?.maxPrice != null) params.set('max_price', String(opts.maxPrice))
    if (opts?.search) params.set('search', opts.search)
    const qs = params.toString()
    return request('GET', `/admin/store_builder_api/products/${tenantId}${qs ? `?${qs}` : ''}`, token)
  },

  // Convenience wrapper — uses the module-level active token/tenant (set after login).
  getActiveProducts(opts?: { categorySlug?: string; perPage?: number; maxPrice?: number; search?: string }): Promise<{ products: StoreProduct[] }> {
    return stratumApi.getProducts(_activeTenantId, _activeToken, opts)
  },

  // Real published posts for BlogPostList's "Auto" mode live-preview render
  // inside the Puck editor — see Store_builder_api::blog_posts().
  getBlogPosts(tenantId: number, token: string, limit?: number): Promise<{ data: StoreBlogPost[] }> {
    const qs = limit ? `&limit=${limit}` : ''
    return request('GET', `/admin/store_builder_api/blog_posts?tenantId=${tenantId}${qs}`, token)
  },

  // Convenience wrapper — uses the module-level active token/tenant (set after login).
  getActiveBlogPosts(limit?: number): Promise<{ data: StoreBlogPost[] }> {
    return stratumApi.getBlogPosts(_activeTenantId, _activeToken, limit)
  },

  // AITool block's resolveData() — this tenant's Storefront AI Block proxy
  // endpoint + API key, generated server-side on first call. See
  // Store_builder_api::ai_storefront_key() for why this never needs the
  // cross-context lookups the calls above use.
  getAiStorefrontKey(tenantId: number, token: string): Promise<{ key: string; endpoint: string }> {
    return request('GET', `/admin/store_builder_api/ai_storefront_key/${tenantId}`, token)
  },

  // Convenience wrapper — uses the module-level active token/tenant (set after login).
  getActiveAiStorefrontKey(): Promise<{ key: string; endpoint: string }> {
    return stratumApi.getAiStorefrontKey(_activeTenantId, _activeToken)
  },

  // ShippingOptions/PickupSelector/ShippingSummary ("Any Provider") blocks'
  // resolveData() — this tenant's public Stratum API base URL + WooCommerce
  // store numeric ID (Shipping_checkout.php's woo_store_id, not tenantId).
  // See Store_builder_api::shipping_widget_config() — same rationale as
  // getAiStorefrontKey() above, mirrored for the shipping widgets.
  getShippingWidgetConfig(tenantId: number, token: string): Promise<{ apiUrl: string; storeId: string; tenantId: string }> {
    return request('GET', `/admin/store_builder_api/shipping_widget_config/${tenantId}`, token)
  },

  // Convenience wrapper — uses the module-level active token/tenant (set after login).
  getActiveShippingWidgetConfig(): Promise<{ apiUrl: string; storeId: string; tenantId: string }> {
    return stratumApi.getShippingWidgetConfig(_activeTenantId, _activeToken)
  },

  // ── Template management ────────────────────────────────────────────────
  // Backend routes to implement in store_builder_api controller:
  //   GET    /admin/store_builder_api/templates/{tenantId}
  //          → { templates: StoreTemplate[] }
  //   POST   /admin/store_builder_api/templates/{tenantId}
  //          body: { puckJson, name, category }
  //          → { success: true, id: string }
  //   DELETE /admin/store_builder_api/templates/{tenantId}/{templateId}
  //          → { success: true }

  getPersonalTemplates(
    tenantId: number,
    token: string,
  ): Promise<{ templates: Array<Record<string, unknown>> }> {
    return request('GET', `/admin/store_builder_api/templates/${tenantId}`, token)
  },

  saveAsTemplate(
    tenantId: number,
    puckJson: unknown,
    name: string,
    category: string,
    token: string,
  ): Promise<{ success: boolean; id: string }> {
    return request('POST', `/admin/store_builder_api/templates/${tenantId}`, token, {
      puckJson,
      name,
      category,
    })
  },

  deletePersonalTemplate(
    tenantId: number,
    templateId: string,
    token: string,
  ): Promise<{ success: boolean }> {
    return request('DELETE', `/admin/store_builder_api/templates/${tenantId}/${templateId}`, token)
  },

  // ── Theme management (whole-site, admin Theme Manager) ─────────────────
  getThemes(tenantId: number, token: string): Promise<{ themes: StoreTheme[] }> {
    return request<{ success: boolean; message: string; data: { themes: StoreTheme[] } }>(
      'GET', `/admin/store_builder_api/themes/${tenantId}`, token,
    ).then((res) => res.data)
  },

  // Does not throw on a rejected apply (e.g. incomplete theme) — the backend's
  // message is meant to be shown to the merchant either way, same as the PHP
  // wizard's own theme picker does with this same message.
  async applyTheme(tenantId: number, themeId: string, token: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${STRATUM_ORIGIN}/admin/store_builder_api/themes/${tenantId}/apply`, {
      method: 'POST',
      headers: {
        'X-Stratum-Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ theme_id: themeId }),
    })
    const body = await res.json().catch(() => null)
    if (!body) return { success: false, message: `HTTP ${res.status}` }
    return { success: !!body.success, message: body.message || (res.ok ? '' : `HTTP ${res.status}`) }
  },
}
