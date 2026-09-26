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

// A Pixabay search result, as returned by Store_builder_api::stock_photos_search().
// Deliberately has no download URL field — only previewURL/webformatURL
// (display thumbnails). applyStockPhoto(id) resolves the real download
// server-side; the browser never carries a fetchable Pixabay source URL.
export interface PixabayPhoto {
  id: number
  previewURL: string | null
  webformatURL: string | null
  width: number
  height: number
  tags: string
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
  // The tenant's real WooCommerce store currency symbol (eg. "R", "$") --
  // see Store_builder_api::products(). Always present from the API, but
  // optional here since older cached/mocked callers may not have it.
  currency_symbol?: string
}

// A tenant's manually-curated, cross-category product grouping — see
// Store_builder_api::collections()/collection(). item_count/product_ids are
// mutually exclusive across the two shapes this same JSON key set is used
// for (list vs single-collection detail); both are optional here so one
// interface covers both call sites without a union type.
export interface StoreCollection {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_published: boolean
  page_slug: string | null
  // "Belongs to a theme" protection — non-null theme_id means
  // Store_builder_api::collection_delete() refuses to delete this
  // collection until it's explicitly unlinked first. theme_name is a
  // convenience denormalization for display only, never sent back.
  theme_id: number | null
  theme_name: string | null
  item_count?: number
  product_ids?: number[]
}

// A published theme, as returned by Store_builder_api::collection_themes() —
// the "Belongs to a theme" picker's option list.
export interface StoreThemeOption {
  id: number
  name: string
  slug: string
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

  // Creates a page_link mirror of sourcePageId inside an existing footer
  // column (columnPageId) — the source page's own menu placement is
  // untouched. See Store_builder_model::add_footer_link().
  addFooterLink(tenantId: number, sourcePageId: number, columnPageId: number, token: string): Promise<{ success: boolean; page: StorePage }> {
    return request('POST', `/admin/store_builder_api/add_footer_link/${tenantId}`, token, { sourcePageId, columnPageId })
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

  // ImageUploadField's "Search Pixabay" tab — proxy-browse half. Response
  // carries only Pixabay photo IDs + preview thumbnails, never a fetchable
  // download URL — applyStockPhoto() below resolves that server-side. See
  // Store_builder_api::stock_photos_search() and
  // docs/specs/Stratum_Pixabay_Stock_Photo_Integration_Spec_v1.0.md.
  searchStockPhotos(
    query: string,
    page: number,
    token: string,
  ): Promise<{ photos?: PixabayPhoto[]; page?: number; error?: string }> {
    return request(
      'GET',
      `/admin/store_builder_api/stock_photos_search?q=${encodeURIComponent(query)}&page=${page}`,
      token,
    )
  },

  // Convenience wrapper — uses the module-level active token (set after login).
  searchActiveStockPhotos(query: string, page = 1): Promise<{ photos?: PixabayPhoto[]; page?: number; error?: string }> {
    return stratumApi.searchStockPhotos(query, page, _activeToken)
  },

  // Deferred-pull half — body carries only the Pixabay photo ID, never a URL.
  // See Store_builder_api::stock_photos_apply().
  applyStockPhoto(pixabayId: number, token: string): Promise<{ url?: string; pixabayId?: number; error?: string }> {
    return request('POST', `/admin/store_builder_api/stock_photos_apply`, token, { pixabayId })
  },

  // Convenience wrapper — uses the module-level active token (set after login).
  applyActiveStockPhoto(pixabayId: number): Promise<{ url?: string; pixabayId?: number; error?: string }> {
    return stratumApi.applyStockPhoto(pixabayId, _activeToken)
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
    opts?: { categorySlug?: string; perPage?: number; maxPrice?: number; search?: string; include?: number[] },
  ): Promise<{ products: StoreProduct[] }> {
    const params = new URLSearchParams()
    if (opts?.categorySlug) params.set('category_slug', opts.categorySlug)
    if (opts?.perPage) params.set('per_page', String(opts.perPage))
    if (opts?.maxPrice != null) params.set('max_price', String(opts.maxPrice))
    if (opts?.search) params.set('search', opts.search)
    // Collections widget/detail page: a specific, ordered set of product IDs
    // (see Store_builder_api::products()'s `include`/`orderby=include` handling).
    if (opts?.include && opts.include.length > 0) params.set('include', opts.include.join(','))
    const qs = params.toString()
    return request('GET', `/admin/store_builder_api/products/${tenantId}${qs ? `?${qs}` : ''}`, token)
  },

  // Convenience wrapper — uses the module-level active token/tenant (set after login).
  getActiveProducts(opts?: { categorySlug?: string; perPage?: number; maxPrice?: number; search?: string; include?: number[] }): Promise<{ products: StoreProduct[] }> {
    return stratumApi.getProducts(_activeTenantId, _activeToken, opts)
  },

  // ── Collections manager ────────────────────────────────────────────────
  getCollections(tenantId: number, token: string): Promise<{ collections: StoreCollection[] }> {
    return request('GET', `/admin/store_builder_api/collections/${tenantId}`, token)
  },

  getActiveCollections(): Promise<{ collections: StoreCollection[] }> {
    return stratumApi.getCollections(_activeTenantId, _activeToken)
  },

  getCollection(tenantId: number, token: string, slug: string): Promise<{ collection: StoreCollection }> {
    return request('GET', `/admin/store_builder_api/collection/${tenantId}/${encodeURIComponent(slug)}`, token)
  },

  getActiveCollection(slug: string): Promise<{ collection: StoreCollection }> {
    return stratumApi.getCollection(_activeTenantId, _activeToken, slug)
  },

  saveCollection(
    tenantId: number,
    token: string,
    data: { id?: number; name: string; description?: string | null; image_url?: string | null; product_ids: number[] },
  ): Promise<{ success: boolean; collection: StoreCollection }> {
    return request('POST', `/admin/store_builder_api/collection_save/${tenantId}`, token, data)
  },

  saveActiveCollection(
    data: { id?: number; name: string; description?: string | null; image_url?: string | null; product_ids: number[] },
  ): Promise<{ success: boolean; collection: StoreCollection }> {
    return stratumApi.saveCollection(_activeTenantId, _activeToken, data)
  },

  deleteCollection(tenantId: number, token: string, id: number): Promise<{ success: boolean }> {
    return request('POST', `/admin/store_builder_api/collection_delete/${tenantId}`, token, { id })
  },

  deleteActiveCollection(id: number): Promise<{ success: boolean }> {
    return stratumApi.deleteCollection(_activeTenantId, _activeToken, id)
  },

  setCollectionPublished(tenantId: number, token: string, id: number, published: boolean): Promise<{ success: boolean; page_slug: string | null }> {
    return request('POST', `/admin/store_builder_api/collection_publish/${tenantId}`, token, { id, published })
  },

  setActiveCollectionPublished(id: number, published: boolean): Promise<{ success: boolean; page_slug: string | null }> {
    return stratumApi.setCollectionPublished(_activeTenantId, _activeToken, id, published)
  },

  getCollectionThemes(tenantId: number, token: string): Promise<{ themes: StoreThemeOption[] }> {
    return request('GET', `/admin/store_builder_api/collection_themes/${tenantId}`, token)
  },

  getActiveCollectionThemes(): Promise<{ themes: StoreThemeOption[] }> {
    return stratumApi.getCollectionThemes(_activeTenantId, _activeToken)
  },

  linkCollectionTheme(tenantId: number, token: string, id: number, themeId: number): Promise<{ success: boolean; theme_id: number; theme_name: string }> {
    return request('POST', `/admin/store_builder_api/collection_link_theme/${tenantId}`, token, { id, theme_id: themeId })
  },

  linkActiveCollectionTheme(id: number, themeId: number): Promise<{ success: boolean; theme_id: number; theme_name: string }> {
    return stratumApi.linkCollectionTheme(_activeTenantId, _activeToken, id, themeId)
  },

  unlinkCollectionTheme(tenantId: number, token: string, id: number): Promise<{ success: boolean }> {
    return request('POST', `/admin/store_builder_api/collection_unlink_theme/${tenantId}`, token, { id })
  },

  unlinkActiveCollectionTheme(id: number): Promise<{ success: boolean }> {
    return stratumApi.unlinkCollectionTheme(_activeTenantId, _activeToken, id)
  },

  // Real published posts for BlogPostList's "Auto" mode live-preview render
  // inside the Puck editor — see Store_builder_api::blog_posts(). categorySlug
  // restricts to one Store Blog category (see blog_categories() below) —
  // singular, unlike ProductGrid's comma-separated categorySlug, since the
  // backend filter only supports one category per request.
  getBlogPosts(tenantId: number, token: string, limit?: number, categorySlug?: string): Promise<{ data: StoreBlogPost[] }> {
    const params = new URLSearchParams({ tenantId: String(tenantId) })
    if (limit) params.set('limit', String(limit))
    if (categorySlug) params.set('category', categorySlug)
    return request('GET', `/admin/store_builder_api/blog_posts?${params.toString()}`, token)
  },

  // Convenience wrapper — uses the module-level active token/tenant (set after login).
  getActiveBlogPosts(limit?: number, categorySlug?: string): Promise<{ data: StoreBlogPost[] }> {
    return stratumApi.getBlogPosts(_activeTenantId, _activeToken, limit, categorySlug)
  },

  // Blog category dropdown for BlogPostList's "Filter by Category" field —
  // same {name, slug} shape as getCategories() above, but reads the tenant's
  // own Store Blog categories rather than WooCommerce. See
  // Store_builder_api::blog_categories().
  getBlogCategories(tenantId: number, token: string): Promise<{ categories: Array<{ name: string; slug: string }> }> {
    return request('GET', `/admin/store_builder_api/blog_categories?tenantId=${tenantId}`, token)
  },

  // Convenience wrapper — uses the module-level active token/tenant (set after login).
  getActiveBlogCategories(): Promise<{ categories: Array<{ name: string; slug: string }> }> {
    return stratumApi.getBlogCategories(_activeTenantId, _activeToken)
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

  // GET /admin/store_builder_api/theme_categories/{tenantId}
  // Same admin-managed category list Store Theme Manager uses for Themes and
  // Master Templates (store_theme_categories) — fetched live so Studio's own
  // category picker can't drift into a separate, hardcoded taxonomy.
  getThemeCategories(
    tenantId: number,
    token: string,
  ): Promise<{ categories: Array<{ slug: string; name: string }> }> {
    return request('GET', `/admin/store_builder_api/theme_categories/${tenantId}`, token)
  },

  // GET /admin/store_builder_api/item_custom_fields/{tenantId}
  // Real Warehouse item Custom Fields (Setup > Custom Fields, "belongs to" =
  // Items) — backs ProductTabs' field picker so a theme designer selects a
  // real, already-defined field instead of typing its slug by hand.
  getItemCustomFields(
    tenantId: number,
    token: string,
  ): Promise<{ fields: Array<{ id: number; name: string; slug: string }> }> {
    return request('GET', `/admin/store_builder_api/item_custom_fields/${tenantId}`, token)
  },

  // Convenience wrapper — uses the module-level active token/tenant (set after login).
  getActiveItemCustomFields(): Promise<{ fields: Array<{ id: number; name: string; slug: string }> }> {
    return stratumApi.getItemCustomFields(_activeTenantId, _activeToken)
  },

}
