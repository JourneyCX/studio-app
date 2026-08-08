/// <reference types="vite/client" />
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

// Module-level active token — set once after verifyToken succeeds.
// Allows components deep in the Puck config (e.g. ImageBlock custom field)
// to upload images without threading the token through props.
let _activeToken = ''
export function setActiveToken(token: string) { _activeToken = token }
export function getActiveToken() { return _activeToken }

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

export const stratumApi = {
  verifyToken(token: string): Promise<StudioSession> {
    return request('GET', '/admin/store_builder_api/verify_token', token)
  },

  loadPage(tenantId: number, pageSlug: string, token: string): Promise<PageData> {
    return request('GET', `/admin/store_builder_api/page/${tenantId}/${pageSlug}`, token)
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
}
