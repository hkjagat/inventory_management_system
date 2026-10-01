'use client'

import React, { useMemo, useState } from 'react'
import {
  Boxes,
  PackageCheck,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Clock,
  Layers,
  Plus,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { useApp } from '@/lib/context'
import { ItemMasterRecord } from '@/lib/types'

type OverviewTab = 'All' | 'Reorder' | 'Critical' | 'LeadRisk' | 'Healthy' | 'OverStock'

export function OverviewPage() {
  const {
    inventory,
    incoming,
    outgoing,
    categories,
    setActiveNav,
    setIsAddItemOpen,
    setIsNewTxOpen,
    exportInventoryToCsv,
  } = useApp()

  const [activeTab, setActiveTab] = useState<OverviewTab>('Reorder')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // --- 1. Operational Runway & Risk Engine ---
  // Calculates real runway (days of stock remaining = currentStock / averageConsumption)
  // Flags critical lead time risk: if runwayDays < leadDays, an order placed today will arrive AFTER stock runs out!
  const getRunway = (item: ItemMasterRecord) => {
    const stock = Number(item.currentStock) || 0
    const rate = Number(item.averageConsumption ?? (item as any).averageCunsumtion) || 0
    const lead = Number(item.leadDays) || 0

    if (rate <= 0) {
      return { days: null, isRisk: false, label: 'No daily rate' }
    }

    const days = Math.round((stock / rate) * 10) / 10
    const isRisk = lead > 0 && days < lead
    return {
      days,
      isRisk,
      label: `${days}d runway`,
    }
  }

  // --- 2. Plant SKU Classification (SKU-level, not summed across different UOMs) ---
  const totalSkusCount = inventory.length

  // A. Critical / Safety Stock Buffer Breached: currentStock <= safetyStock (or <= 0)
  const criticalItems = useMemo(() => {
    return inventory.filter((item) => {
      const stock = Number(item.currentStock) || 0
      const safety = Number(item.safetyStock) || 0
      const min = Number(item.minStock) || 0
      const safetyThreshold = safety > 0 ? safety : Math.max(1, Math.floor(min * 0.5))
      return stock <= safetyThreshold || stock === 0 || item.status === 'Critical'
    })
  }, [inventory])

  // B. Reorder Required: currentStock <= minStock
  const reorderDueItems = useMemo(() => {
    return inventory.filter((item) => {
      const stock = Number(item.currentStock) || 0
      const min = Number(item.minStock) || 0
      return stock <= min
    })
  }, [inventory])

  // C. Lead Time Breach Risk: Days of stock remaining < Supplier Lead Time
  const leadTimeRiskItems = useMemo(() => {
    return inventory.filter((item) => {
      const runway = getRunway(item)
      return runway.isRisk
    })
  }, [inventory])

  // D. Healthy On-Floor Stock: minStock < currentStock <= maxStock
  const healthyItems = useMemo(() => {
    return inventory.filter((item) => {
      const stock = Number(item.currentStock) || 0
      const min = Number(item.minStock) || 0
      const max = Number(item.maxStock) || 0
      return stock > min && (max === 0 || stock <= max)
    })
  }, [inventory])

  // E. Over-Stock Items: currentStock > maxStock (wasting cleanroom / floor space)
  const overStockItems = useMemo(() => {
    return inventory.filter((item) => {
      const stock = Number(item.currentStock) || 0
      const max = Number(item.maxStock) || 0
      return max > 0 && stock > max
    })
  }, [inventory])

  // --- 3. Top Urgent Stockout Radar (Fewest Days of Stock Left) ---
  const topUrgentRunwayItems = useMemo(() => {
    const list = inventory
      .map((item) => ({
        item,
        runway: getRunway(item),
      }))
      .filter((x) => x.runway.days !== null)
      .sort((a, b) => (a.runway.days ?? 999) - (b.runway.days ?? 999))
      .slice(0, 5)

    // Fallback: If no items have average consumption filled in, pick items closest to 0 stock vs minStock
    if (list.length === 0) {
      return inventory
        .map((item) => {
          const ratio = (Number(item.currentStock) || 0) / Math.max(1, Number(item.minStock) || 1)
          return {
            item,
            runway: { days: null, isRisk: ratio <= 0.5, label: `${Math.round(ratio * 100)}% of Min` },
          }
        })
        .sort((a, b) => (Number(a.item.currentStock) || 0) - (Number(b.item.currentStock) || 0))
        .slice(0, 5)
    }

    return list
  }, [inventory])

  // --- 4. Plant Category Operational Health Matrix ---
  const plantCategoryHealth = useMemo(() => {
    const allCategories = categories.length > 0 ? categories : Array.from(new Set(inventory.map((i) => i.category || 'Consumable')))

    return allCategories.map((catName) => {
      const catItems = inventory.filter((i) => i.category?.toLowerCase() === catName.toLowerCase())
      const totalInCat = catItems.length
      const critInCat = catItems.filter((i) => {
        const stock = Number(i.currentStock) || 0
        const safety = Number(i.safetyStock) || Math.max(1, Math.floor(Number(i.minStock) * 0.5))
        return stock <= safety || stock === 0
      }).length
      const reorderInCat = catItems.filter((i) => (Number(i.currentStock) || 0) <= Number(i.minStock)).length
      const overInCat = catItems.filter((i) => Number(i.maxStock) > 0 && (Number(i.currentStock) || 0) > Number(i.maxStock)).length
      const healthyInCat = catItems.filter((i) => {
        const stock = Number(i.currentStock) || 0
        const min = Number(i.minStock) || 0
        const max = Number(i.maxStock) || 0
        return stock > min && (max === 0 || stock <= max)
      }).length

      const healthPercent = totalInCat > 0 ? Math.round((healthyInCat / totalInCat) * 100) : 100

      return {
        category: catName,
        total: totalInCat,
        critical: critInCat,
        reorderDue: reorderInCat,
        overStock: overInCat,
        healthy: healthyInCat,
        healthPercent,
      }
    })
  }, [inventory, categories])

  // --- 5. Actionable Reorder Workbench Filter ---
  const workbenchItems = useMemo(() => {
    let list: ItemMasterRecord[] = []
    if (activeTab === 'All') {
      list = [...inventory]
    } else if (activeTab === 'Reorder') {
      list = [...reorderDueItems]
    } else if (activeTab === 'Critical') {
      list = [...criticalItems]
    } else if (activeTab === 'LeadRisk') {
      list = [...leadTimeRiskItems]
    } else if (activeTab === 'Healthy') {
      list = [...healthyItems]
    } else if (activeTab === 'OverStock') {
      list = [...overStockItems]
    }

    if (selectedCategory !== 'All') {
      list = list.filter((i) => i.category?.toLowerCase() === selectedCategory.toLowerCase())
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase()
      list = list.filter(
        (i) => i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
      )
    }

    // Sort order: Critical first, then lowest stock ratio
    return list.sort((a, b) => {
      const aStock = Number(a.currentStock) || 0
      const bStock = Number(b.currentStock) || 0
      const aMin = Math.max(1, Number(a.minStock) || 1)
      const bMin = Math.max(1, Number(b.minStock) || 1)
      return aStock / aMin - bStock / bMin
    })
  }, [inventory, activeTab, reorderDueItems, criticalItems, leadTimeRiskItems, healthyItems, overStockItems, selectedCategory, searchTerm])

  // --- 6. Top Consumed Shop Floor Materials ---
  const topConsumedItems = useMemo(() => {
    const usage: Record<string, { itemCode: string; itemName: string; qty: number; uom: string; category: string }> = {}
    outgoing.forEach((rec) => {
      const code = String(rec.itemCode || '').trim().toUpperCase()
      if (!code) return
      if (!usage[code]) {
        usage[code] = {
          itemCode: code,
          itemName: String(rec.itemName || code),
          qty: 0,
          uom: String(rec.uom || 'Nos'),
          category: String(rec.category || ''),
        }
      }
      usage[code].qty += Number(rec.quantity) || 0
    })
    return Object.values(usage).sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [outgoing])

  // --- 7. Recent Movements Stream ---
  const recentMovements = useMemo(() => {
    const inc = incoming.map((i) => ({ ...i, flow: 'Incoming' as const }))
    const out = outgoing.map((o) => ({ ...o, flow: 'Outgoing' as const }))
    return [...inc, ...out].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 6)
  }, [incoming, outgoing])

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-[#828d9a]">
            <span>Plant Operations</span>
            <span>/</span>
            <span className="font-semibold text-[#485563]">Manufacturing Inventory Command Center</span>
          </div>
          <h2 className="text-[24px] font-bold tracking-[-0.035em] text-[#182230]">
            Plant Operations & Reorder Status
          </h2>
          <p className="mt-0.5 text-[13px] text-[#788492]">
            Active stockout prevention, reorder runway, safety buffer monitoring, and shop floor material flow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportInventoryToCsv}
            className="flex items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#535f6d] shadow-2xs hover:bg-[#f8fafb]"
          >
            <ArrowDownToLine className="size-3.5 text-[#73808e]" />
            Export ItemMaster CSV
          </button>
          <button
            onClick={() => setIsNewTxOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#535f6d] shadow-2xs hover:bg-[#f8fafb]"
          >
            <Clock className="size-3.5 text-[#73808e]" />
            Record Movement
          </button>
          <button
            onClick={() => setIsAddItemOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#17604f] px-3.5 py-2 text-[12px] font-semibold text-white shadow-2xs transition-all hover:bg-[#124b3e]"
          >
            <Plus className="size-3.5" />
            Register New Item
          </button>
        </div>
      </div>

      {/* 5 Plant Health KPI Cards (SKU Counts, Not Mismatched Units or Fake Valuation) */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* 1. Total Registered SKUs */}
        <div
          onClick={() => setActiveTab('All')}
          className={`group cursor-pointer rounded-xl border p-4 shadow-2xs transition-all ${
            activeTab === 'All' ? 'border-[#17604f] ring-2 ring-[#17604f]/10 bg-white' : 'border-[#e5e8ed] bg-white hover:border-[#17604f]/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#828e9c]">Registered SKUs</p>
              <p className="mt-1.5 text-[26px] font-bold tracking-tight text-[#182230]">
                {totalSkusCount}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e8f3ef] text-[#26715d] transition-transform group-hover:scale-110">
              <Boxes className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#86929f]">
            <span>Across <strong className="text-[#182230]">{categories.length || 7}</strong> Categories</span>
            <span className="font-semibold text-[#17604f] group-hover:underline">Catalog &rarr;</span>
          </div>
        </div>

        {/* 2. Critical Stockout Risk (Buffer Breached) */}
        <div
          onClick={() => setActiveTab('Critical')}
          className={`group cursor-pointer rounded-xl border p-4 shadow-2xs transition-all ${
            criticalItems.length > 0
              ? 'border-red-300 bg-red-50/40 hover:border-red-500'
              : 'border-[#e5e8ed] bg-white hover:border-red-300'
          } ${activeTab === 'Critical' ? 'ring-2 ring-red-400' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">Critical Stockout</p>
                {criticalItems.length > 0 && (
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <p className="mt-1.5 text-[26px] font-bold tracking-tight text-red-700">
                {criticalItems.length}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-100 text-red-700 transition-transform group-hover:scale-110">
              <ShieldAlert className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-red-700 font-medium">Safety Buffer Breached</span>
            <span className="font-semibold text-red-700 group-hover:underline">Action &rarr;</span>
          </div>
        </div>

        {/* 3. Reorder Due (Below Min Stock) */}
        <div
          onClick={() => setActiveTab('Reorder')}
          className={`group cursor-pointer rounded-xl border p-4 shadow-2xs transition-all ${
            reorderDueItems.length > 0
              ? 'border-amber-300 bg-amber-50/40 hover:border-amber-500'
              : 'border-[#e5e8ed] bg-white hover:border-amber-300'
          } ${activeTab === 'Reorder' ? 'ring-2 ring-amber-400' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Reorder Required</p>
              <p className="mt-1.5 text-[26px] font-bold tracking-tight text-amber-800">
                {reorderDueItems.length}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 transition-transform group-hover:scale-110">
              <AlertTriangle className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-medium">At or below Min Stock</span>
            <span className="font-semibold text-amber-800 group-hover:underline">Order List &rarr;</span>
          </div>
        </div>

        {/* 4. Lead Time Breach Risk */}
        <div
          onClick={() => setActiveTab('LeadRisk')}
          className={`group cursor-pointer rounded-xl border p-4 shadow-2xs transition-all ${
            leadTimeRiskItems.length > 0
              ? 'border-orange-300 bg-orange-50/40 hover:border-orange-500'
              : 'border-[#e5e8ed] bg-white hover:border-orange-300'
          } ${activeTab === 'LeadRisk' ? 'ring-2 ring-orange-400' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-800">Lead Time Risk</p>
              <p className="mt-1.5 text-[26px] font-bold tracking-tight text-orange-800">
                {leadTimeRiskItems.length}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-orange-800 transition-transform group-hover:scale-110">
              <Clock className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-orange-800 font-medium">Runway &lt; Lead Days</span>
            <span className="font-semibold text-orange-800 group-hover:underline">Expedite &rarr;</span>
          </div>
        </div>

        {/* 5. Healthy On-Floor Stock */}
        <div
          onClick={() => setActiveTab('Healthy')}
          className={`group cursor-pointer rounded-xl border p-4 shadow-2xs transition-all ${
            activeTab === 'Healthy' ? 'border-[#17604f] ring-2 ring-[#17604f]/20 bg-[#f4f9f6]' : 'border-[#d6e5df] bg-[#f4f9f6] hover:border-[#17604f]/60'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#256c59]">Healthy Stock</p>
              <p className="mt-1.5 text-[26px] font-bold tracking-tight text-[#17604f]">
                {healthyItems.length}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e2f0ea] text-[#1f6654] transition-transform group-hover:scale-110">
              <PackageCheck className="size-4.5" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#2c7763]">
            <span className="font-semibold">
              {totalSkusCount > 0 ? Math.round((healthyItems.length / totalSkusCount) * 100) : 0}%
            </span>{' '}
            within safe Min-Max bounds
          </p>
        </div>
      </div>

      {/* Visual SKU Health Distribution Bar */}
      <section className="rounded-xl border border-[#e5e8ed] bg-white p-4.5 shadow-2xs">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-[13px] font-bold text-[#182230]">Plant Inventory SKU Health Spectrum</h3>
            <p className="text-[11px] text-[#85919e]">
              Proportion of registered materials across operational status thresholds
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-red-700 font-semibold">
              <span className="size-2.5 rounded-full bg-red-600" />
              Critical ({criticalItems.length})
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <span className="size-2.5 rounded-full bg-amber-500" />
              Reorder Due ({reorderDueItems.length})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <span className="size-2.5 rounded-full bg-emerald-600" />
              Healthy ({healthyItems.length})
            </span>
            <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
              <span className="size-2.5 rounded-full bg-blue-500" />
              Over Max ({overStockItems.length})
            </span>
          </div>
        </div>

        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-[#f1f3f6]">
          {totalSkusCount > 0 && (
            <>
              <div
                className="bg-red-600 transition-all duration-500"
                style={{ width: `${(criticalItems.length / totalSkusCount) * 100}%` }}
                title={`Critical: ${criticalItems.length} SKUs`}
              />
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${(Math.max(0, reorderDueItems.length - criticalItems.length) / totalSkusCount) * 100}%` }}
                title={`Reorder Due: ${reorderDueItems.length} SKUs`}
              />
              <div
                className="bg-emerald-600 transition-all duration-500"
                style={{ width: `${(healthyItems.length / totalSkusCount) * 100}%` }}
                title={`Healthy: ${healthyItems.length} SKUs`}
              />
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${(overStockItems.length / totalSkusCount) * 100}%` }}
                title={`Over Stock: ${overStockItems.length} SKUs`}
              />
            </>
          )}
        </div>
      </section>

      {/* Main Actionable Table: Plant Reorder & Procurement Workbench */}
      <section className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-[#182230]">Plant Reorder & Indent Action Board</h3>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                {reorderDueItems.length} SKUs Need Attention
              </span>
            </div>
            <p className="text-[12px] text-[#85919e]">
              Actionable view with On-Hand Stock, Safety Buffer, Stock Runway, Supplier Lead Time, and exact Reorder Quantities.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-[#8c97a4]" />
              <input
                type="text"
                placeholder="Filter code or item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-44 sm:w-56 rounded-lg border border-[#dfe4e8] bg-[#fafbfc] pl-8 pr-3 py-1.5 text-[12px] text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>

            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-[#dfe4e8] bg-[#fafbfc] px-2.5 py-1.5 text-[12px] font-medium text-[#182230] outline-none focus:border-[#17604f]"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-[#eef1f4] pb-2">
          <button
            onClick={() => setActiveTab('Reorder')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'Reorder'
                ? 'bg-amber-100 text-amber-900 shadow-2xs'
                : 'text-[#616e7d] hover:bg-[#f3f5f7] hover:text-[#182230]'
            }`}
          >
            Reorder Required ({reorderDueItems.length})
          </button>
          <button
            onClick={() => setActiveTab('Critical')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'Critical'
                ? 'bg-red-100 text-red-900 shadow-2xs'
                : 'text-[#616e7d] hover:bg-[#f3f5f7] hover:text-[#182230]'
            }`}
          >
            Critical Buffer Breached ({criticalItems.length})
          </button>
          <button
            onClick={() => setActiveTab('LeadRisk')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'LeadRisk'
                ? 'bg-orange-100 text-orange-900 shadow-2xs'
                : 'text-[#616e7d] hover:bg-[#f3f5f7] hover:text-[#182230]'
            }`}
          >
            Lead Time Risk ({leadTimeRiskItems.length})
          </button>
          <button
            onClick={() => setActiveTab('Healthy')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'Healthy'
                ? 'bg-emerald-100 text-emerald-900 shadow-2xs'
                : 'text-[#616e7d] hover:bg-[#f3f5f7] hover:text-[#182230]'
            }`}
          >
            Healthy ({healthyItems.length})
          </button>
          <button
            onClick={() => setActiveTab('OverStock')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'OverStock'
                ? 'bg-blue-100 text-blue-900 shadow-2xs'
                : 'text-[#616e7d] hover:bg-[#f3f5f7] hover:text-[#182230]'
            }`}
          >
            Over Max ({overStockItems.length})
          </button>
          <button
            onClick={() => setActiveTab('All')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
              activeTab === 'All'
                ? 'bg-[#182230] text-white shadow-2xs'
                : 'text-[#616e7d] hover:bg-[#f3f5f7] hover:text-[#182230]'
            }`}
          >
            All Items ({inventory.length})
          </button>
        </div>

        {/* Workbench Table */}
        {workbenchItems.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[#85919e]">
            No items matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-[#eef1f4] bg-[#fafbfc] text-[10px] font-bold uppercase tracking-wider text-[#687585]">
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Item Name & Category</th>
                  <th className="py-2.5 px-3 text-right">On-Hand Stock</th>
                  <th className="py-2.5 px-3 text-right">Safety / Min Stock</th>
                  <th className="py-2.5 px-3 text-right">Daily Consumption</th>
                  <th className="py-2.5 px-3 text-center">Runway (Days Left)</th>
                  <th className="py-2.5 px-3 text-center">Lead Time</th>
                  <th className="py-2.5 px-3 text-right">Reorder Qty</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {workbenchItems.map((item) => {
                  const stock = Number(item.currentStock) || 0
                  const min = Number(item.minStock) || 0
                  const safety = Number(item.safetyStock) || 0
                  const lead = Number(item.leadDays) || 0
                  const rate = Number(item.averageConsumption ?? (item as any).averageCunsumtion) || 0
                  const reorderQty = Number(item.reorderQuantity) || (Number(item.maxStock) > 0 ? Math.max(0, Number(item.maxStock) - stock) : 0)

                  const runway = getRunway(item)
                  const isCritical = stock <= (safety > 0 ? safety : Math.max(1, Math.floor(min * 0.5))) || stock === 0
                  const isBelowMin = stock <= min

                  return (
                    <tr
                      key={item.itemCode}
                      className={`hover:bg-[#fbfcfc] transition-colors ${
                        isCritical ? 'bg-red-50/30' : isBelowMin ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#182230]">
                        {item.itemCode}
                      </td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <p className="font-semibold text-[#182230] truncate" title={item.itemName}>{item.itemName}</p>
                        <span className="inline-block rounded bg-[#f0f2f5] px-1.5 py-0.2 text-[10px] font-medium text-[#5e6b7a]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={
                            isCritical
                              ? 'text-red-700'
                              : isBelowMin
                              ? 'text-amber-800'
                              : 'text-[#17604f]'
                          }
                        >
                          {stock} {item.uom}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-[#546272]">
                        <div>Min: {min} {item.uom}</div>
                        {safety > 0 && <div className="text-[10px] text-red-600">Buffer: {safety} {item.uom}</div>}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-[#546272]">
                        {rate > 0 ? `${rate} ${item.uom}/d` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {runway.days !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              runway.isRisk
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : runway.days <= lead * 1.5
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            <Clock className="size-2.5" />
                            {runway.days} days
                            {runway.isRisk && ' (Deficit)'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8c97a4]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-[#546272]">
                        {lead > 0 ? `${lead} days` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {reorderQty > 0 ? (
                          <span className="rounded-md bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-200 font-bold text-[11px]">
                            +{reorderQty} {item.uom}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8c97a4]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setIsNewTxOpen(true)}
                          className="rounded-lg border border-[#dfe4e8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#17604f] shadow-2xs hover:bg-[#f8fafb]"
                        >
                          Record Tx
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Grid: Stock Runway Radar & Plant Category Matrix */}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.3fr]">
        {/* Left: Production Stock Runway Radar (Urgent Run-Out Countdown) */}
        <section className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-3.5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[14px] font-bold text-[#182230]">Stock Runway Radar</h3>
                  <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-bold">
                    Line Stop Risk
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#85919e]">
                  Materials with lowest run-out runway compared to supplier lead time
                </p>
              </div>
              <button
                onClick={() => setActiveTab('LeadRisk')}
                className="text-[11px] font-semibold text-[#17604f] hover:underline"
              >
                View all &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {topUrgentRunwayItems.map(({ item, runway }, idx) => {
                const lead = Number(item.leadDays) || 0
                const days = runway.days ?? 0
                const isRisk = runway.isRisk
                const percent = lead > 0 ? Math.min(100, Math.round((days / lead) * 100)) : 50

                return (
                  <div
                    key={item.itemCode}
                    className="rounded-xl border border-[#eef1f4] bg-[#fafbfc] p-3 transition-colors hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#182230]">{item.itemCode}</span>
                          <span className="truncate text-[12px] font-semibold text-[#303d4a]">{item.itemName}</span>
                        </div>
                        <p className="text-[10px] text-[#718096] mt-0.5">
                          {item.category} · Stock: <strong className="text-[#182230]">{item.currentStock} {item.uom}</strong>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {runway.days !== null ? (
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              isRisk ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {runway.days}d left
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#718096]">{runway.label}</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar of Runway vs Lead Time */}
                    {lead > 0 && runway.days !== null && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] font-medium text-[#718096] mb-1">
                          <span>Runway: {runway.days} days</span>
                          <span className={isRisk ? 'text-red-700 font-bold' : ''}>Supplier Lead: {lead} days</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#e2e8f0] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isRisk ? 'bg-red-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f0f2f5] text-[11px] text-[#788492] flex items-center justify-between">
            <span>Critical stockout window alert</span>
            <span className="font-semibold text-red-700">Orders must precede lead days</span>
          </div>
        </section>

        {/* Right: Plant Category Operational Health Matrix */}
        <section className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-3.5 flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#182230]">Category Health Matrix</h3>
                <p className="mt-0.5 text-[11px] text-[#85919e]">
                  Operational status breakdown across your plant categories
                </p>
              </div>
              <button
                onClick={() => setActiveNav('Inventory')}
                className="text-[11px] font-semibold text-[#17604f] hover:underline"
              >
                Inventory table &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-[#eef1f4] text-[10px] font-bold uppercase tracking-wider text-[#687585]">
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-center">Total SKUs</th>
                    <th className="pb-2 text-center">Healthy</th>
                    <th className="pb-2 text-center">Below Min</th>
                    <th className="pb-2 text-center">Critical</th>
                    <th className="pb-2 text-right">Health %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f5]">
                  {plantCategoryHealth.map((row) => (
                    <tr
                      key={row.category}
                      onClick={() => {
                        setSelectedCategory(row.category)
                        setActiveTab('All')
                      }}
                      className="cursor-pointer hover:bg-[#fafbfc] transition-colors"
                    >
                      <td className="py-2.5 font-semibold text-[#182230]">
                        {row.category}
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-[#182230]">
                        {row.total}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="rounded-md bg-emerald-50 text-emerald-800 px-1.5 py-0.2 font-mono font-bold text-[10px]">
                          {row.healthy}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        {row.reorderDue > 0 ? (
                          <span className="rounded-md bg-amber-50 text-amber-800 px-1.5 py-0.2 font-mono font-bold text-[10px]">
                            {row.reorderDue}
                          </span>
                        ) : (
                          <span className="text-[#a0aec0] font-mono">0</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">
                        {row.critical > 0 ? (
                          <span className="rounded-md bg-red-100 text-red-800 px-1.5 py-0.2 font-mono font-bold text-[10px]">
                            {row.critical}
                          </span>
                        ) : (
                          <span className="text-[#a0aec0] font-mono">0</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold">
                        <span
                          className={
                            row.healthPercent >= 80
                              ? 'text-emerald-700'
                              : row.healthPercent >= 50
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }
                        >
                          {row.healthPercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f0f2f5] text-[11px] text-[#788492] flex items-center justify-between">
            <span>Click any category row to filter workbench</span>
            <span className="font-semibold text-[#17604f]">{categories.length || 7} Plant Categories</span>
          </div>
        </section>
      </div>

      {/* Bottom Section: Top Consumed Materials & Recent Movement Ledger */}
      <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
        {/* Fastest Moving Consumables */}
        <section className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-3.5 flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#182230]">Top Consumed Materials</h3>
                <p className="mt-0.5 text-[11px] text-[#85919e]">Highest velocity shop floor consumable issues</p>
              </div>
              <button
                onClick={() => setActiveNav('Transactions')}
                className="text-[11px] font-semibold text-[#17604f] hover:underline"
              >
                All issues &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {topConsumedItems.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-[#85919e]">No outgoing issues recorded yet.</p>
              ) : (
                topConsumedItems.map((item, idx) => (
                  <div
                    key={item.itemCode}
                    className="flex items-center justify-between rounded-lg border border-[#f0f2f5] bg-[#fafbfc] px-3 py-2 text-[12px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#17604f]/10 text-[10px] font-bold text-[#17604f]">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#182230]">{item.itemName}</p>
                        <p className="font-mono text-[10px] text-[#7b8795]">{item.itemCode} · {item.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#b54708]">-{item.qty} {item.uom}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f0f2f5] flex items-center justify-between text-[11px] text-[#788492]">
            <span>Receipts logged: <strong className="text-[#256c59]">+{incoming.length}</strong></span>
            <span>Dispatches logged: <strong className="text-[#b54708]">-{outgoing.length}</strong></span>
          </div>
        </section>

        {/* Recent Movements Stream */}
        <section className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#182230]">Recent Plant Material Movements</h3>
              <p className="mt-0.5 text-[11px] text-[#85919e]">
                Latest inbound receipts and shop floor store issues with Doc Numbers
              </p>
            </div>
            <button
              onClick={() => setActiveNav('Transactions')}
              className="text-[11px] font-semibold text-[#17604f] hover:underline"
            >
              Transactions &rarr;
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {recentMovements.length === 0 ? (
              <p className="col-span-2 py-6 text-center text-[12px] text-[#85919e]">No movements recorded yet.</p>
            ) : (
              recentMovements.map((tx, idx) => (
                <div
                  key={tx.id || `${tx.docNumber}-${idx}`}
                  className="flex items-center gap-2.5 rounded-lg border border-[#e8ecf1] bg-[#fafbfc] p-2.5 text-[12px]"
                >
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                      tx.flow === 'Incoming'
                        ? 'bg-[#eaf5f0] text-[#256c59]'
                        : 'bg-[#fff4ed] text-[#b54708]'
                    }`}
                  >
                    {tx.flow === 'Incoming' ? (
                      <ArrowDownToLine className="size-3.5" />
                    ) : (
                      <ArrowUpRight className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-semibold text-[#182230]">{tx.itemName}</p>
                      <span className="text-[10px] text-[#939ca5] shrink-0 font-mono">{tx.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#718096] mt-0.5">
                      <span
                        className={`font-mono font-bold ${
                          tx.flow === 'Incoming' ? 'text-[#256c59]' : 'text-[#b54708]'
                        }`}
                      >
                        {tx.flow === 'Incoming' ? `+${tx.quantity}` : `-${tx.quantity}`} {tx.uom}
                      </span>
                      <span className="font-mono text-[10px] text-[#8c97a4]">
                        {tx.docNumber}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
