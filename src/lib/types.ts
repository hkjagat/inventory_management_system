export type UserRole = 'admin' | 'manager' | 'user'

export const APP_PAGES = [
  'Overview',
  'Inventory',
  'Transactions',
  'Settings',
  'Help center',
] as const

export type AppPageName = typeof APP_PAGES[number]

export interface UserRecord {
  loginId: string // "Login Id"
  password: string // "Password"
  name: string // "Name"
  role: UserRole | string // "Role": admin, manager, user
  status: 'Active' | 'Inactive' // "Status"
  pageAccess?: string // "Page Access" (e.g. "Overview, Inventory, Transactions")
}

export function getUserAllowedPages(user: UserRecord | null): AppPageName[] {
  if (!user) return []
  const roleLower = String(user.role || '').trim().toLowerCase()
  if (roleLower === 'admin') {
    return [...APP_PAGES]
  }

  const accessStr = String(user.pageAccess || '').trim()
  if (!accessStr) {
    return roleLower === 'manager'
      ? ['Overview', 'Inventory', 'Transactions']
      : ['Inventory', 'Transactions']
  }

  if (accessStr.toLowerCase() === 'all' || accessStr === '*') {
    return [...APP_PAGES]
  }

  const parts = accessStr.split(',').map((s) => s.trim().toLowerCase())
  const matched = APP_PAGES.filter((page) =>
    parts.some((p) => {
      const target = page.toLowerCase()
      return (
        p === target ||
        (target === 'settings' && p === 'master configuration')
      )
    })
  )

  return matched.length > 0 ? matched : ['Inventory']
}

export function canUserAccessPage(user: UserRecord | null, pageName: string): boolean {
  if (!user) return false
  const roleLower = String(user.role || '').trim().toLowerCase()
  if (roleLower === 'admin') return true
  const allowed = getUserAllowedPages(user)
  const target = pageName.toLowerCase()
  return allowed.some(
    (p) =>
      p.toLowerCase() === target ||
      (target === 'settings' && p.toLowerCase() === 'master configuration')
  )
}

export interface MasterRecord {
  category?: string
  uom?: string
}

export type ItemStatus = 'Critical' | 'Low stock' | 'In stock' | 'Over stock'

export interface ItemMasterRecord {
  itemCode: string // "Item Code"
  itemName: string // "Item Name"
  category: string // "Category"
  uom: string // "UOM"
  openingBalance: number // "Opening Balance"
  currentStock: number // "Current Stock" (Dynamically: openingBalance + totalInbound - totalOutbound)
  leadDays?: number // "Lead Days" (Supplier replenishment lead time in days)
  safetyStock?: number // "Safety Stock" (Emergency buffer stock)
  averageConsumption?: number // "Average Cunsumtion" / "Average Consumption"
  minStock: number // "Min Stock"
  maxStock: number // "Max Stock"
  reorderQuantity?: number // "Reorder Quantity" (Standard replenishment batch size)
  status?: ItemStatus // Computed: Critical if currentStock <= minStock * 0.5, Low if <= minStock, Over if > maxStock
  totalInbound?: number // Sum of all Incoming receipts
  totalOutbound?: number // Sum of all Outgoing issues
  updatedAt?: string
  location?: string
  unitCost?: number
}

export interface IncomingRecord {
  id?: string
  date: string // "Date"
  docNumber: string // "Doc Number"
  itemCode: string // "Item Code"
  itemName: string // "Item Name"
  category: string // "Category"
  quantity: number // "Quantity"
  uom: string // "UOM"
}

export interface OutgoingRecord {
  id?: string
  date: string // "Date"
  docNumber: string // "Doc Number"
  itemCode: string // "Item Code"
  itemName: string // "Item Name"
  category: string // "Category"
  quantity: number // "Quantity"
  uom: string // "UOM"
}

// Backward compatibility alias for views that used InventoryItem
export type InventoryItem = ItemMasterRecord

/**
 * Dynamic Stock Calculation Pure Function:
 * Reconciles current on-hand stock strictly against the incoming/outgoing ledger:
 *   Current Stock = MAX(0, Opening Balance + Total Inbound - Total Outbound)
 * 
 * Evaluates the 4 stock status levels:
 * - Critical: currentStock <= minStock * 0.5 (or <= 0)
 * - Low stock / Min Stock: currentStock <= minStock
 * - Over stock: maxStock > 0 && currentStock > maxStock
 * - In stock: minStock < currentStock <= maxStock
 */
export function computeItemStock(
  item: ItemMasterRecord,
  incomingList: IncomingRecord[],
  outgoingList: OutgoingRecord[]
): ItemMasterRecord {
  const code = String(item.itemCode || '').trim().toUpperCase()

  const totalInbound = incomingList
    .filter((inc) => String(inc.itemCode || '').trim().toUpperCase() === code)
    .reduce((sum, inc) => sum + (Number(inc.quantity) || 0), 0)

  const totalOutbound = outgoingList
    .filter((out) => String(out.itemCode || '').trim().toUpperCase() === code)
    .reduce((sum, out) => sum + (Number(out.quantity) || 0), 0)

  const opening = Number(item.openingBalance) || 0
  const computedStock = Math.max(0, opening + totalInbound - totalOutbound)

  const minStock = Number(item.minStock) || 0
  const maxStock = Number(item.maxStock) || 0
  const leadDays = Number(item.leadDays) || 0
  const safetyStock = Number(item.safetyStock) || 0
  const averageConsumption = Number(
    item.averageConsumption ?? (item as any).averageCunsumtion
  ) || 0
  const reorderQuantity = Number(item.reorderQuantity) || 0

  const criticalThreshold = Math.max(1, Math.floor(minStock * 0.5))

  let status: ItemStatus = 'In stock'
  if (computedStock <= criticalThreshold) {
    status = 'Critical'
  } else if (computedStock <= minStock) {
    status = 'Low stock'
  } else if (maxStock > 0 && computedStock > maxStock) {
    status = 'Over stock'
  } else {
    status = 'In stock'
  }

  return {
    ...item,
    openingBalance: opening,
    currentStock: computedStock,
    leadDays,
    safetyStock,
    averageConsumption,
    minStock,
    maxStock,
    reorderQuantity,
    totalInbound,
    totalOutbound,
    status,
  }
}

// Supporting types for plant operations
export interface SupplierVendor {
  id: string
  name: string
  code: string
  category: string
  contactPerson: string
  email: string
  phone: string
  location: string
  leadTimeDays: number
  rating: number
  reliability: number
  suppliedItems: string[]
  paymentTerms: string
}

export interface PurchaseOrderItem {
  sku: string
  name: string
  qty: number
  unit: string
  unitPrice: number
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  supplierName: string
  createdDate: string
  expectedDelivery: string
  status: 'In Transit' | 'Confirmed' | 'Delivered' | 'Pending Approval' | 'Cancelled'
  items: PurchaseOrderItem[]
  totalAmount: number
  notes?: string
}

export interface PlantAlert {
  id: string
  title: string
  message: string
  type: 'warning' | 'danger' | 'info' | 'success'
  timestamp: string
  read: boolean
  sku?: string
}
