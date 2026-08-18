import { useState, useEffect, useCallback } from 'react'
import type { Data } from '@measured/puck'
import type { StoreTemplate, TemplateCategory } from '@/types/templates'
import { MASTER_TEMPLATES } from '@/lib/templates/masterTemplates'
import { stratumApi } from '@/lib/api'

// ---------------------------------------------------------------------------
// ID regeneration
// Deep-clones a Puck Data tree and assigns fresh IDs to every component so
// that each subscriber's copy is fully independent from the master template.
// Zone keys (format: "componentId:zoneName") are remapped to match the new IDs.
// ---------------------------------------------------------------------------
export function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

type RawItem = { type: string; props: Record<string, unknown> }

function regenerateIds(data: Data): Data {
  const clone = JSON.parse(JSON.stringify(data)) as Data
  const idMap = new Map<string, string>()

  for (const item of clone.content as RawItem[]) {
    if (typeof item.props.id === 'string') {
      const oldId = item.props.id
      const newId = `${item.type}-${uid()}`
      idMap.set(oldId, newId)
      item.props.id = newId
    }
  }

  const newZones: Record<string, RawItem[]> = {}
  for (const [key, items] of Object.entries(clone.zones ?? {})) {
    // Zone key format: "<componentId>:<zoneName>"
    const colonIdx = key.lastIndexOf(':')
    const oldComponentId = key.slice(0, colonIdx)
    const zoneName = key.slice(colonIdx + 1)
    const newComponentId = idMap.get(oldComponentId) ?? oldComponentId
    newZones[`${newComponentId}:${zoneName}`] = (items as RawItem[]).map(item => ({
      ...item,
      props: { ...item.props, id: `${item.type}-${uid()}` },
    }))
  }

  clone.zones = newZones as Data['zones']
  return clone
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
interface Notification {
  type: 'success' | 'error'
  message: string
}

export function useTemplateManager(
  tenantId: number | null,
  token: string,
  pageSlug: string | null,
) {
  const [isOpen,            setIsOpen]            = useState(false)
  const [applying,          setApplying]          = useState<string | null>(null)
  const [notification,      setNotification]      = useState<Notification | null>(null)
  const [personalTemplates, setPersonalTemplates] = useState<StoreTemplate[]>([])
  const [loadingPersonal,   setLoadingPersonal]   = useState(false)
  const [savingAsTemplate,  setSavingAsTemplate]  = useState(false)

  const notify = useCallback((type: Notification['type'], message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4500)
  }, [])

  // Fetch personal (user-saved) templates each time the modal opens.
  // Falls back silently — master templates always remain available.
  useEffect(() => {
    if (!isOpen || !tenantId) return
    setLoadingPersonal(true)
    stratumApi
      .getPersonalTemplates(tenantId, token)
      .then(res => setPersonalTemplates(res.templates as unknown as StoreTemplate[]))
      .catch(() => setPersonalTemplates([]))
      .finally(() => setLoadingPersonal(false))
  }, [isOpen, tenantId, token])

  // Master templates always come first so they are never displaced by personal ones.
  const allTemplates: StoreTemplate[] = [...MASTER_TEMPLATES, ...personalTemplates]

  // Apply a template: deep-clone + regenerate IDs → persist draft → call back.
  const applyTemplate = useCallback(
    async (template: StoreTemplate, onApplied: (data: Data) => void) => {
      if (!tenantId || !pageSlug) {
        notify(
          'error',
          !tenantId
            ? 'No active tenant session — close and reopen the editor.'
            : 'No page is currently open — open or create a page before applying a template.',
        )
        return
      }
      setApplying(template.id)
      try {
        const freshData = regenerateIds(template.puckState)
        await stratumApi.saveDraft(tenantId, pageSlug, freshData, pageSlug, token)
        onApplied(freshData)
        setIsOpen(false)
        notify('success', `"${template.name}" applied to draft. Customise it, then click Publish to go live.`)
      } catch (err) {
        notify('error', err instanceof Error ? err.message : 'Failed to apply template.')
      } finally {
        setApplying(null)
      }
    },
    [tenantId, pageSlug, token, notify],
  )

  // Save the subscriber's current page layout as a personal template.
  const saveAsTemplate = useCallback(
    async (puckData: Data, name: string, category: TemplateCategory) => {
      if (!tenantId) return
      setSavingAsTemplate(true)
      try {
        await stratumApi.saveAsTemplate(tenantId, puckData, name, category, token)
        notify('success', `"${name}" saved as your personal template.`)
        // Re-fetch personal templates so the new one appears immediately.
        if (isOpen) {
          const res = await stratumApi.getPersonalTemplates(tenantId, token)
          setPersonalTemplates(res.templates as unknown as StoreTemplate[])
        }
      } catch (err) {
        notify('error', err instanceof Error ? err.message : 'Failed to save template.')
      } finally {
        setSavingAsTemplate(false)
      }
    },
    [tenantId, token, isOpen, notify],
  )

  return {
    isOpen,
    openSelector:        () => setIsOpen(true),
    closeSelector:       () => setIsOpen(false),
    applying,
    notification,
    dismissNotification: () => setNotification(null),
    allTemplates,
    loadingPersonal,
    applyTemplate,
    savingAsTemplate,
    saveAsTemplate,
  }
}
