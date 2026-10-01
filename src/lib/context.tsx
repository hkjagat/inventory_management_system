'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import {
  UserRecord,
  ItemMasterRecord,
  IncomingRecord,
  OutgoingRecord,
  PlantAlert,
  canUserAccessPage,
  getUserAllowedPages,
  AppPageName,
  computeItemStock,
} from './types'
import {
  initialUsers,
  initialCategories,
  initialUoms,
  initialItemMaster,
  initialIncoming,
  initialOutgoing,
  initialAlerts,
} from './data'
import { fetchAllFromAppsScript, callAppsScriptApi } from './googleAppsScript'

interface AppContextType {
  // Authentication & RBAC
  currentUser: UserRecord | null
  login: (loginId: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  allowedPages: AppPageName[]
  canAccessPage: (pageName: string) => boolean

  // Navigation & Toast
  activeNav: string
  setActiveNav: (page: string) => void
  notice: string | null
  showNotice: (msg: string) => void
  dismissNotice: () => void

  // Users
  users: UserRecord[]
  addUser: (user: UserRecord) => void
  updateUser: (loginId: string, updates: Partial<UserRecord>) => void
  deleteUser: (loginId: string) => void
  toggleUserStatus: (loginId: string) => void

  // Masters
  categories: string[]
  addCategory: (category: string) => void
  deleteCategory: (category: string) => void
  uoms: string[]
  addUom: (uom: string) => void
  deleteUom: (uom: string) => void

  // ItemMaster
  // Dynamically reconciled: Current Stock = MAX(0, Opening Balance + SUM(Incoming) - SUM(Outgoing))
  itemMaster: ItemMasterRecord[]
  inventory: ItemMasterRecord[] // alias for pages
  addItemMaster: (item: ItemMasterRecord) => void
  updateItemMaster: (itemCode: string, updates: Partial<ItemMasterRecord>) => void
  deleteItemMaster: (itemCode: string) => void
  deleteMultipleItems: (itemCodes: string[]) => void
  adjustStock: (itemCode: string, delta: number, docNumber?: string) => void

  // Incoming
  incoming: IncomingRecord[]
  recordIncoming: (rec: Omit<IncomingRecord, 'id'>) => void

  // Outgoing
  outgoing: OutgoingRecord[]
  recordOutgoing: (rec: Omit<OutgoingRecord, 'id'>) => void

  // Cloud Live Sync & Refresh
  appScriptUrl: string
  setAppScriptUrl: (url: string) => void
  isSyncing: boolean
  lastSyncTime: string | null
  syncWithGoogleSheet: (silent?: boolean) => Promise<boolean>
  refreshData: (silent?: boolean) => Promise<boolean>

  // CSV Exporters
  exportInventoryToCsv: () => void
  exportIncomingToCsv: () => void
  exportOutgoingToCsv: () => void

  // Supporting records
  alerts: PlantAlert[]
  markAlertRead: (id: string) => void
  markAllAlertsRead: () => void

  // Quick modals
  isAddItemOpen: boolean
  setIsAddItemOpen: (open: boolean) => void
  isNewTxOpen: boolean
  setIsNewTxOpen: (open: boolean) => void
}

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxR1cTolhYrAEEwx1dOJpNFa9UEF0VKMDdUCp_FAkcL4MX-Y8TnmOnBOPzewnwWrgZugg/exec'

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Current logged in user (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(() => {
    try {
      const savedUser =
        localStorage.getItem('alphapharma_logged_in_user') ||
        localStorage.getItem('forgeflow_logged_in_user')
      if (!savedUser) return null
      const parsed = JSON.parse(savedUser)
      if (parsed.name === 'Alex Morgan' || parsed.loginId === 'manager1') {
        localStorage.removeItem('alphapharma_logged_in_user')
        localStorage.removeItem('forgeflow_logged_in_user')
        return null
      }
      return parsed
    } catch {
      return null
    }
  })

  const [activeNav, setActiveNav] = useState('Overview')
  const [notice, setNotice] = useState<string | null>(null)

  // 1. Users sheet
  const [users, setUsers] = useState<UserRecord[]>(initialUsers)
  // 2. Masters sheet [Category, UOM]
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [uoms, setUoms] = useState<string[]>(initialUoms)
  // 3. Raw ItemMaster definitions (itemCode, itemName, category, uom, openingBalance, minStock, maxStock)
  const [rawItemMaster, setRawItemMaster] = useState<ItemMasterRecord[]>(initialItemMaster)
  // 4. Incoming sheet
  const [incoming, setIncoming] = useState<IncomingRecord[]>(initialIncoming)
  // 5. Outgoing sheet
  const [outgoing, setOutgoing] = useState<OutgoingRecord[]>(initialOutgoing)

  // Google Apps Script Web App URL from localStorage, .env, or verified default
  const [appScriptUrl, setAppScriptUrl] = useState<string>(() => {
    const envUrl =
      import.meta.env.VITE_APPS_SCRIPT_URL ||
      import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
      ''
    const saved =
      localStorage.getItem('alphapharma_apps_script_url') ||
      localStorage.getItem('forgeflow_apps_script_url')
    return (saved !== null && saved !== '') ? saved : (envUrl || DEFAULT_APPS_SCRIPT_URL)
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Supporting entities
  const [alerts, setAlerts] = useState<PlantAlert[]>(initialAlerts)

  // Global modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isNewTxOpen, setIsNewTxOpen] = useState(false)

  // =========================================================================
  // DYNAMIC STOCK RECONCILIATION ENGINE
  // Current Stock = MAX(0, Opening Balance + SUM(Incoming) - SUM(Outgoing))
  // Re-evaluates automatically whenever raw items, incoming receipts, or outgoing issues change.
  // =========================================================================
  const itemMaster: ItemMasterRecord[] = useMemo(() => {
    return rawItemMaster.map((item) => computeItemStock(item, incoming, outgoing))
  }, [rawItemMaster, incoming, outgoing])

  // Load from localStorage on mount
  // Load from localStorage on mount & purge stale demo data
  useEffect(() => {
    try {
      const savedUsers =
        localStorage.getItem('alphapharma_sheet_users') ||
        localStorage.getItem('forgeflow_sheet_users')
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers)
        const isDemo = Array.isArray(parsed) && parsed.some((u: any) => u.name === 'Alex Morgan' || u.loginId === 'manager1')
        if (!isDemo) {
          setUsers(parsed)
        } else {
          setUsers(initialUsers)
          localStorage.removeItem('alphapharma_sheet_users')
          localStorage.removeItem('forgeflow_sheet_users')
        }
      }

      const savedCats =
        localStorage.getItem('alphapharma_sheet_masters') ||
        localStorage.getItem('forgeflow_sheet_masters')
      if (savedCats) {
        const parsed = JSON.parse(savedCats)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed)
        }
      }

      const savedUoms =
        localStorage.getItem('alphapharma_sheet_masters_uoms') ||
        localStorage.getItem('forgeflow_sheet_masters_uoms')
      if (savedUoms) {
        const parsed = JSON.parse(savedUoms)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUoms(parsed)
        }
      }

      const savedItems =
        localStorage.getItem('alphapharma_sheet_item_master') ||
        localStorage.getItem('forgeflow_sheet_item_master')
      if (savedItems) {
        const parsed = JSON.parse(savedItems)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRawItemMaster(parsed)
        }
      }

      const savedInc =
        localStorage.getItem('alphapharma_sheet_incoming') ||
        localStorage.getItem('forgeflow_sheet_incoming')
      if (savedInc) {
        const parsed = JSON.parse(savedInc)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIncoming(parsed)
        }
      }

      const savedOut =
        localStorage.getItem('alphapharma_sheet_outgoing') ||
        localStorage.getItem('forgeflow_sheet_outgoing')
      if (savedOut) {
        const parsed = JSON.parse(savedOut)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOutgoing(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Automatic silent background synchronization on startup
  useEffect(() => {
    if (appScriptUrl && appScriptUrl.startsWith('http')) {
      syncWithGoogleSheet(true)
    }
  }, [appScriptUrl])

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alphapharma_sheet_users', JSON.stringify(users))
    } catch {}
  }, [users])

  useEffect(() => {
    try {
      localStorage.setItem('alphapharma_sheet_masters', JSON.stringify(categories))
    } catch {}
  }, [categories])

  useEffect(() => {
    try {
      localStorage.setItem('alphapharma_sheet_masters_uoms', JSON.stringify(uoms))
    } catch {}
  }, [uoms])

  useEffect(() => {
    try {
      localStorage.setItem('alphapharma_sheet_item_master', JSON.stringify(rawItemMaster))
    } catch {}
  }, [rawItemMaster])

  useEffect(() => {
    try {
      localStorage.setItem('alphapharma_sheet_incoming', JSON.stringify(incoming))
    } catch {}
  }, [incoming])

  useEffect(() => {
    try {
      localStorage.setItem('alphapharma_sheet_outgoing', JSON.stringify(outgoing))
    } catch {}
  }, [outgoing])

  useEffect(() => {
    try {
      if (appScriptUrl) {
        localStorage.setItem('alphapharma_apps_script_url', appScriptUrl)
      }
    } catch {}
  }, [appScriptUrl])

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => {
      setNotice((curr) => (curr === msg ? null : curr))
    }, 4500)
  }

  const dismissNotice = () => setNotice(null)

  // --- Authentication Handlers (Optimized for instant login & zero lag) ---
  const login = async (loginId: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedId = loginId.trim().toLowerCase()

    // 1. Fast Path: Check locally cached Users sheet first (Instant <5ms login!)
    const localMatch = users.find((u) => String(u.loginId || '').trim().toLowerCase() === trimmedId)
    if (localMatch) {
      if (localMatch.password !== password) {
        return { success: false, error: 'Incorrect password.' }
      }
      if (String(localMatch.status || '').toLowerCase() !== 'active') {
        return { success: false, error: 'Account is deactivated. Contact plant administrator.' }
      }

      const userObj: UserRecord = {
        loginId: localMatch.loginId,
        password: '',
        name: String(localMatch.name || localMatch.loginId || 'Admin'),
        role: String(localMatch.role || 'user').toLowerCase(),
        status: 'Active',
        pageAccess: String(localMatch.pageAccess || ''),
      }
      setCurrentUser(userObj)
      localStorage.setItem('alphapharma_logged_in_user', JSON.stringify(userObj))

      const allowed = getUserAllowedPages(userObj)
      if (allowed.length > 0 && !canUserAccessPage(userObj, activeNav)) {
        setActiveNav(allowed[0])
      }

      showNotice(`Welcome back, ${userObj.name} (${userObj.role})`)
      return { success: true }
    }

    // 2. Slow Path: If user was newly added to Google Sheet directly, query Apps Script with 8s timeout
    if (appScriptUrl && appScriptUrl.startsWith('http')) {
      try {
        const res = await callAppsScriptApi(appScriptUrl, {
          action: 'login',
          loginId: trimmedId,
          password,
        }, 8000)

        if (res && res.success && res.user) {
          const userObj: UserRecord = {
            loginId: String(res.user.loginId || trimmedId),
            password: '',
            name: String(res.user.name || res.user.loginId || 'Admin'),
            role: String(res.user.role || 'user').toLowerCase(),
            status: 'Active',
            pageAccess: String(res.user.pageAccess || res.user['Page Access'] || ''),
          }
          // Save to local users so next login is instant
          setUsers((prev) => {
            const exists = prev.some((u) => u.loginId.toLowerCase() === userObj.loginId.toLowerCase())
            return exists ? prev : [...prev, { ...userObj, password }]
          })

          setCurrentUser(userObj)
          localStorage.setItem('alphapharma_logged_in_user', JSON.stringify(userObj))

          const allowed = getUserAllowedPages(userObj)
          if (allowed.length > 0 && !canUserAccessPage(userObj, activeNav)) {
            setActiveNav(allowed[0])
          }

          showNotice(`Welcome back, ${userObj.name} (${userObj.role})`)
          return { success: true }
        } else if (res && res.error) {
          return { success: false, error: res.error }
        }
      } catch (e: any) {
        console.warn('Apps Script login timed out or failed:', e.message)
      }
    }

    return { success: false, error: 'Login ID not found.' }
  }

  // Allowed pages for currently logged in user
  const allowedPages = useMemo(() => {
    return getUserAllowedPages(currentUser)
  }, [currentUser])

  const canAccessPage = (pageName: string): boolean => {
    return canUserAccessPage(currentUser, pageName)
  }

  // Ensure activeNav is always permitted for the active user
  useEffect(() => {
    if (currentUser) {
      const allowed = getUserAllowedPages(currentUser)
      if (allowed.length > 0 && !canUserAccessPage(currentUser, activeNav)) {
        setActiveNav(allowed[0])
      }
    }
  }, [currentUser, activeNav])

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('alphapharma_logged_in_user')
    localStorage.removeItem('forgeflow_logged_in_user')
    showNotice('Successfully logged out')
  }

  // --- 1. Users sheet Handlers ---
  const addUser = (newUser: UserRecord) => {
    setUsers((prev) => [...prev, newUser])
    showNotice(`User "${newUser.loginId}" added`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'addUser', ...newUser }).catch(console.error)
    }
  }

  const updateUser = (loginId: string, updates: Partial<UserRecord>) => {
    setUsers((prev) =>
      prev.map((u) => (u.loginId.toLowerCase() === loginId.toLowerCase() ? { ...u, ...updates } : u))
    )
    showNotice(`User "${loginId}" updated`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'updateUser', loginId, ...updates }).catch(console.error)
    }
  }

  const deleteUser = (loginId: string) => {
    setUsers((prev) => prev.filter((u) => u.loginId.toLowerCase() !== loginId.toLowerCase()))
    showNotice(`User "${loginId}" removed`)
  }

  const toggleUserStatus = (loginId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.loginId.toLowerCase() === loginId.toLowerCase()
          ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' }
          : u
      )
    )
    showNotice(`Status updated for "${loginId}"`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'toggleUserStatus', loginId }).catch(console.error)
    }
  }

  // --- 2. Masters sheet Handlers [Category, UOM] ---
  const addCategory = (category: string) => {
    const trimmed = category.trim()
    if (!trimmed || categories.includes(trimmed)) return
    setCategories((prev) => [...prev, trimmed])
    showNotice(`Category "${trimmed}" added to Masters`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'addCategory', category: trimmed }).catch(console.error)
    }
  }

  const deleteCategory = (category: string) => {
    setCategories((prev) => prev.filter((c) => c !== category))
    showNotice(`Category "${category}" deleted from Masters`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'deleteCategory', category }).catch(console.error)
    }
  }

  const addUom = (newUom: string) => {
    const trimmed = newUom.trim().toLowerCase()
    if (!trimmed || uoms.includes(trimmed)) return
    setUoms((prev) => [...prev, trimmed])
    showNotice(`UOM "${trimmed}" added to Masters`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'addUom', uom: trimmed }).catch(console.error)
    }
  }

  const deleteUom = (uomToDelete: string) => {
    setUoms((prev) => prev.filter((u) => u !== uomToDelete))
    showNotice(`UOM "${uomToDelete}" deleted from Masters`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'deleteUom', uom: uomToDelete }).catch(console.error)
    }
  }

  // --- 3. ItemMaster sheet Handlers ---
  const addItemMaster = (item: ItemMasterRecord) => {
    const raw = {
      ...item,
      updatedAt: 'Just now',
    }
    setRawItemMaster((prev) => [raw, ...prev])
    showNotice(`Registered ${item.itemCode} in ItemMaster`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'addItem', ...raw }).catch(console.error)
    }
  }

  const updateItemMaster = (itemCode: string, updates: Partial<ItemMasterRecord>) => {
    setRawItemMaster((prev) =>
      prev.map((it) => {
        if (it.itemCode.toUpperCase() === itemCode.toUpperCase()) {
          return { ...it, ...updates, updatedAt: 'Just now' }
        }
        return it
      })
    )
    showNotice(`Item ${itemCode} updated`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'updateItem', itemCode, ...updates }).catch(console.error)
    }
  }

  const deleteItemMaster = (itemCode: string) => {
    setRawItemMaster((prev) => prev.filter((it) => it.itemCode.toUpperCase() !== itemCode.toUpperCase()))
    showNotice(`Item ${itemCode} removed from ItemMaster`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'deleteItem', itemCode }).catch(console.error)
    }
  }

  const deleteMultipleItems = (itemCodes: string[]) => {
    const set = new Set(itemCodes.map((c) => c.toUpperCase()))
    setRawItemMaster((prev) => prev.filter((it) => !set.has(it.itemCode.toUpperCase())))
    showNotice(`Deleted ${itemCodes.length} items from ItemMaster`)
  }

  // Double-entry adjustment: records directly into Incoming or Outgoing ledger
  const adjustStock = (itemCode: string, delta: number, docNumber?: string) => {
    const item = itemMaster.find((i) => i.itemCode.toUpperCase() === itemCode.toUpperCase())
    if (!item || delta === 0) return

    const today = new Date().toISOString().slice(0, 10)
    const docNo = docNumber || (delta >= 0 ? `ADJ-IN-${Date.now().toString().slice(-6)}` : `ADJ-OUT-${Date.now().toString().slice(-6)}`)

    if (delta > 0) {
      recordIncoming({
        date: today,
        docNumber: docNo,
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category,
        quantity: Math.abs(delta),
        uom: item.uom,
      })
    } else {
      recordOutgoing({
        date: today,
        docNumber: docNo,
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category,
        quantity: Math.abs(delta),
        uom: item.uom,
      })
    }
  }

  // --- 4. Incoming sheet Handlers [Date, Doc Number, Item Code, Item Name, Category, Quantity, UOM] ---
  const recordIncoming = (rec: Omit<IncomingRecord, 'id'>) => {
    const newRecord: IncomingRecord = {
      ...rec,
      id: `INC-${Date.now()}`,
    }
    // Updating incoming triggers automatic dynamic recalculation of ItemMaster currentStock
    setIncoming((prev) => [newRecord, ...prev])
    showNotice(`Recorded incoming receipt: +${rec.quantity} ${rec.uom} of ${rec.itemCode}`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'recordIncoming', ...rec }).catch(console.error)
    }
  }

  // --- 5. Outgoing sheet Handlers [Date, Doc Number, Item Code, Item Name, Category, Quantity, UOM] ---
  const recordOutgoing = (rec: Omit<OutgoingRecord, 'id'>) => {
    const newRecord: OutgoingRecord = {
      ...rec,
      id: `OUT-${Date.now()}`,
    }
    // Updating outgoing triggers automatic dynamic recalculation of ItemMaster currentStock
    setOutgoing((prev) => [newRecord, ...prev])
    showNotice(`Recorded outgoing issue: -${rec.quantity} ${rec.uom} of ${rec.itemCode}`)

    if (appScriptUrl) {
      callAppsScriptApi(appScriptUrl, { action: 'recordOutgoing', ...rec }).catch(console.error)
    }
  }

  // --- Live Cloud Sync ---
  const syncWithGoogleSheet = async (silent: boolean = false): Promise<boolean> => {
    if (!appScriptUrl || !appScriptUrl.startsWith('http')) {
      if (!silent) showNotice('Cloud database URL is not configured')
      return false
    }

    setIsSyncing(true)
    try {
      const data = await fetchAllFromAppsScript(appScriptUrl)
      if (data && data.success) {
        if (Array.isArray(data.users) && data.users.length > 0) {
          setUsers(
            data.users.map((u: any) => ({
              loginId: String(u.loginId || u['Login Id'] || '').trim(),
              password: String(u.password || u.Password || '').trim(),
              name: String(u.name || u.Name || u.loginId || '').trim(),
              role: String(u.role || u.Role || 'user').toLowerCase().trim(),
              status:
                String(u.status || u.Status || 'Active').trim().toLowerCase() === 'active'
                  ? 'Active'
                  : 'Inactive',
              pageAccess: String(u.pageAccess || u['Page Access'] || 'all').trim(),
            }))
          )
        }

        // Parse Categories and UOMs from Masters
        const fetchedCats: string[] = []
        const fetchedUoms: string[] = []

        if (Array.isArray(data.categories)) {
          data.categories.forEach((c: any) => {
            const str = String(c || '').trim()
            if (str && !fetchedCats.includes(str)) fetchedCats.push(str)
          })
        }

        if (Array.isArray(data.uoms)) {
          data.uoms.forEach((u: any) => {
            const str = String(u || '').trim()
            if (str && !fetchedUoms.includes(str)) fetchedUoms.push(str)
          })
        }

        if (Array.isArray(data.masters) && data.masters.length > 0) {
          data.masters.forEach((m: any) => {
            const cat = String(m.category || m.Category || (typeof m === 'string' ? m : '')).trim()
            const u = String(m.uom || m.UOM || m.Uom || m.units || m.Units || '').trim()
            if (cat && !fetchedCats.includes(cat)) fetchedCats.push(cat)
            if (u && !fetchedUoms.includes(u)) fetchedUoms.push(u)
          })
        }

        // Also harvest any distinct category and UOM values from ItemMaster as fallback
        if (Array.isArray(data.itemMaster)) {
          data.itemMaster.forEach((it: any) => {
            const cat = String(it.category || it.Category || '').trim()
            const u = String(it.uom || it.UOM || '').trim()
            if (cat && !fetchedCats.includes(cat)) fetchedCats.push(cat)
            if (u && !fetchedUoms.includes(u)) fetchedUoms.push(u)
          })
        }

        if (fetchedCats.length > 0) {
          setCategories(fetchedCats)
          try {
            localStorage.setItem('alphapharma_sheet_masters', JSON.stringify(fetchedCats))
          } catch {}
        }
        if (fetchedUoms.length > 0) {
          setUoms(fetchedUoms)
          try {
            localStorage.setItem('alphapharma_sheet_masters_uoms', JSON.stringify(fetchedUoms))
          } catch {}
        }

        if (Array.isArray(data.itemMaster) && data.itemMaster.length > 0) {
          const mappedItems: ItemMasterRecord[] = data.itemMaster.map((it: any) => ({
            ...it,
            itemCode: String(it.itemCode || it['Item Code'] || '').trim().toUpperCase(),
            itemName: String(it.itemName || it['Item Name'] || '').trim(),
            category: String(it.category || it.Category || 'Consumable').trim(),
            uom: String(it.uom || it.UOM || 'pcs').trim(),
            openingBalance: Number(it.openingBalance ?? it['Opening Balance']) || 0,
            currentStock: Number(it.currentStock ?? it['Current Stock']) || 0,
            leadDays: Number(it.leadDays ?? it['Lead Days']) || 0,
            safetyStock: Number(it.safetyStock ?? it['Safety Stock']) || 0,
            averageConsumption: Number(
              it.averageConsumption ?? it['Average Consumption'] ?? it.averageCunsumtion ?? it['Average Cunsumtion']
            ) || 0,
            minStock: Number(it.minStock ?? it['Min Stock']) || 0,
            maxStock: Number(it.maxStock ?? it['Max Stock']) || 0,
            reorderQuantity: Number(it.reorderQuantity ?? it['Reorder Quantity']) || 0,
          }))
          setRawItemMaster(mappedItems)
        }
        if (Array.isArray(data.incoming)) setIncoming(data.incoming)
        if (Array.isArray(data.outgoing)) setOutgoing(data.outgoing)

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setLastSyncTime(`Today, ${nowStr}`)
        if (!silent) showNotice('Successfully synchronized latest plant data!')
        setIsSyncing(false)
        return true
      } else {
        throw new Error(data?.error || 'Invalid API response')
      }
    } catch (err: any) {
      console.error('Data sync error:', err)
      if (!silent) showNotice(`Sync failed: ${err.message}`)
      setIsSyncing(false)
      return false
    }
  }

  const refreshData = (silent: boolean = false) => syncWithGoogleSheet(silent)

  // --- CSV Exporters ---
  const exportInventoryToCsv = () => {
    const headers = [
      'Item Code',
      'Item Name',
      'Category',
      'UOM',
      'Opening Balance',
      'Current Stock',
      'Lead Days',
      'Safety Stock',
      'Average Cunsumtion',
      'Min Stock',
      'Max Stock',
      'Reorder Quantity',
    ]
    const rows = itemMaster.map((i) => [
      i.itemCode,
      `"${i.itemName.replace(/"/g, '""')}"`,
      i.category,
      i.uom,
      i.openingBalance,
      i.currentStock,
      i.leadDays ?? 0,
      i.safetyStock ?? 0,
      i.averageConsumption ?? 0,
      i.minStock,
      i.maxStock,
      i.reorderQuantity ?? 0,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ItemMaster_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotice('ItemMaster CSV exported')
  }

  const exportIncomingToCsv = () => {
    const headers = ['Date', 'Doc Number', 'Item Code', 'Item Name', 'Category', 'Quantity', 'UOM']
    const rows = incoming.map((inc) => [
      inc.date,
      inc.docNumber,
      inc.itemCode,
      `"${inc.itemName.replace(/"/g, '""')}"`,
      inc.category,
      inc.quantity,
      inc.uom,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Incoming_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotice('Incoming sheet CSV exported')
  }

  const exportOutgoingToCsv = () => {
    const headers = ['Date', 'Doc Number', 'Item Code', 'Item Name', 'Category', 'Quantity', 'UOM']
    const rows = outgoing.map((out) => [
      out.date,
      out.docNumber,
      out.itemCode,
      `"${out.itemName.replace(/"/g, '""')}"`,
      out.category,
      out.quantity,
      out.uom,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Outgoing_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotice('Outgoing sheet CSV exported')
  }

  const markAlertRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
  }

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    showNotice('All alerts marked as read')
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        allowedPages,
        canAccessPage,

        activeNav,
        setActiveNav,
        notice,
        showNotice,
        dismissNotice,

        users,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,

        categories,
        addCategory,
        deleteCategory,
        uoms,
        addUom,
        deleteUom,

        itemMaster,
        inventory: itemMaster,
        addItemMaster,
        updateItemMaster,
        deleteItemMaster,
        deleteMultipleItems,
        adjustStock,

        incoming,
        recordIncoming,

        outgoing,
        recordOutgoing,

        appScriptUrl,
        setAppScriptUrl,
        isSyncing,
        lastSyncTime,
        syncWithGoogleSheet,
        refreshData,

        exportInventoryToCsv,
        exportIncomingToCsv,
        exportOutgoingToCsv,

        alerts,
        markAlertRead,
        markAllAlertsRead,

        isAddItemOpen,
        setIsAddItemOpen,
        isNewTxOpen,
        setIsNewTxOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
