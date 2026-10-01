'use client'

import React, { useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  ArrowUpDown,
  ExternalLink,
  Eye,
  AlertTriangle,
  Download,
  AlertCircle,
  PackageCheck,
  ShieldAlert,
  Calculator,
} from 'lucide-react'
import { useApp } from '@/lib/context'
import { ItemMasterRecord } from '@/lib/types'
import { EditItemModal } from '../modals/EditItemModal'
import { StockAdjustmentModal } from '../modals/StockAdjustmentModal'
import { ItemDetailModal } from '../modals/ItemDetailModal'

export function InventoryPage() {
  const {
    itemMaster,
    deleteItemMaster,
    deleteMultipleItems,
    exportInventoryToCsv,
    setIsAddItemOpen,
    categories,
  } = useApp()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [sortBy, setSortBy] = useState<
    | 'name'
    | 'currentStock'
    | 'minStock'
    | 'itemCode'
    | 'leadDays'
    | 'safetyStock'
    | 'averageConsumption'
    | 'reorderQuantity'
  >('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Selection
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modals state
  const [activeItemForDetail, setActiveItemForDetail] = useState<ItemMasterRecord | null>(null)
  const [activeItemForEdit, setActiveItemForEdit] = useState<ItemMasterRecord | null>(null)
  const [activeItemForAdjust, setActiveItemForAdjust] = useState<ItemMasterRecord | null>(null)

  // Filter & Sort items: PIN CRITICAL ITEMS AT TOP ALWAYS
  const filteredItems = useMemo(() => {
    return itemMaster
      .filter((item) => {
        const matchQuery =
          `${item.itemCode} ${item.itemName} ${item.category} ${item.uom}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())

        const matchCat = selectedCategory === 'All' || item.category === selectedCategory
        const matchStatus = selectedStatus === 'All' || item.status === selectedStatus

        return matchQuery && matchCat && matchStatus
      })
      .sort((a, b) => {
        // ALWAYS PIN CRITICAL ITEMS AT THE VERY TOP
        const aIsCrit = a.status === 'Critical' ? 1 : 0
        const bIsCrit = b.status === 'Critical' ? 1 : 0
        if (aIsCrit !== bIsCrit) {
          return bIsCrit - aIsCrit
        }

        // Secondary sorting
        if (sortBy === 'itemCode') {
          return sortOrder === 'asc'
            ? String(a.itemCode || '').localeCompare(String(b.itemCode || ''))
            : String(b.itemCode || '').localeCompare(String(a.itemCode || ''))
        } else if (sortBy === 'currentStock') {
          return sortOrder === 'asc' ? (Number(a.currentStock) || 0) - (Number(b.currentStock) || 0) : (Number(b.currentStock) || 0) - (Number(a.currentStock) || 0)
        } else if (sortBy === 'minStock') {
          return sortOrder === 'asc' ? (Number(a.minStock) || 0) - (Number(b.minStock) || 0) : (Number(b.minStock) || 0) - (Number(a.minStock) || 0)
        } else if (sortBy === 'safetyStock') {
          return sortOrder === 'asc' ? (Number(a.safetyStock) || 0) - (Number(b.safetyStock) || 0) : (Number(b.safetyStock) || 0) - (Number(a.safetyStock) || 0)
        } else if (sortBy === 'leadDays') {
          return sortOrder === 'asc' ? (Number(a.leadDays) || 0) - (Number(b.leadDays) || 0) : (Number(b.leadDays) || 0) - (Number(a.leadDays) || 0)
        } else if (sortBy === 'averageConsumption') {
          return sortOrder === 'asc' ? (Number(a.averageConsumption) || 0) - (Number(b.averageConsumption) || 0) : (Number(b.averageConsumption) || 0) - (Number(a.averageConsumption) || 0)
        } else if (sortBy === 'reorderQuantity') {
          return sortOrder === 'asc' ? (Number(a.reorderQuantity) || 0) - (Number(b.reorderQuantity) || 0) : (Number(b.reorderQuantity) || 0) - (Number(a.reorderQuantity) || 0)
        } else {
          return sortOrder === 'asc'
            ? String(a.itemName || '').localeCompare(String(b.itemName || ''))
            : String(b.itemName || '').localeCompare(String(a.itemName || ''))
        }
      })
  }, [itemMaster, searchQuery, selectedCategory, selectedStatus, sortBy, sortOrder])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage))
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  // Metrics across the 4 stock levels
  const criticalCount = itemMaster.filter((i) => i.status === 'Critical').length
  const lowStockCount = itemMaster.filter((i) => i.status === 'Low stock').length
  const inStockCount = itemMaster.filter((i) => i.status === 'In stock').length
  const overStockCount = itemMaster.filter((i) => i.status === 'Over stock').length

  // Selection handlers
  const toggleSelectAll = () => {
    if (paginatedItems.every((i) => selectedCodes.includes(i.itemCode))) {
      setSelectedCodes((prev) => prev.filter((code) => !paginatedItems.some((i) => i.itemCode === code)))
    } else {
      const pageCodes = paginatedItems.map((i) => i.itemCode)
      setSelectedCodes((prev) => Array.from(new Set([...prev, ...pageCodes])))
    }
  }

  const toggleSelect = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedCodes.length} selected items from ItemMaster?`)) {
      deleteMultipleItems(selectedCodes)
      setSelectedCodes([])
    }
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-[#828d9a]">
            <span>Plant 01</span>
            <span>/</span>
            <span className="font-semibold text-[#485563]">Catalog & Stock Control</span>
          </div>
          <h2 className="text-[24px] font-bold tracking-tight text-[#182230]">
            Item Master Inventory
          </h2>
          <p className="mt-0.5 text-[13px] text-[#788492]">
            Central catalog for raw materials, active ingredients, excipients, packaging, and plant consumables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportInventoryToCsv}
            className="flex items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#535f6d] shadow-2xs hover:bg-[#f8fafb]"
          >
            <Download className="size-3.5 text-[#73808e]" />
            Export ItemMaster (CSV)
          </button>

          <button
            onClick={() => setIsAddItemOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#17604f] px-3.5 py-2 text-[12px] font-semibold text-white shadow-2xs transition-all hover:bg-[#124b3e]"
          >
            <Plus className="size-3.5" />
            Add Item Master
          </button>
        </div>
      </div>

      {/* Dynamic Stock Ledger Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#cde2d8] bg-[#f2f8f5] px-4 py-2.5 text-[12px] text-[#17604f]">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-[#17604f] text-white">
            <Calculator className="size-3.5" />
          </span>
          <span className="font-semibold text-[#182230]">
            Dynamic Stock Ledger:
          </span>
          <span className="font-mono text-[#17604f]">
            Current Stock = Opening Balance + SUM(Incoming) - SUM(Outgoing)
          </span>
        </div>
        <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-[#246c58] border border-[#cde2d8]">
          Zero Stock Drift · Real-Time Reconciled
        </span>
      </div>

      {/* 4 Stock Level KPI Cards: Critical, Min/Low Stock, In Stock, Over Stock */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Critical Stock Card */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'Critical' ? 'All' : 'Critical')}
          className={`cursor-pointer rounded-xl border p-4 shadow-2xs transition-all hover:shadow-xs ${
            selectedStatus === 'Critical'
              ? 'border-red-400 bg-red-100/70 ring-2 ring-red-400'
              : 'border-red-200 bg-red-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-700">Critical Stock (Depleted)</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <ShieldAlert className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-[26px] font-bold text-red-700">{criticalCount}</p>
          <p className="mt-1 text-[11px] text-red-600 font-medium">Stock &le; 50% of Min threshold</p>
        </div>

        {/* 2. Min / Low Stock Card */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'Low stock' ? 'All' : 'Low stock')}
          className={`cursor-pointer rounded-xl border p-4 shadow-2xs transition-all hover:shadow-xs ${
            selectedStatus === 'Low stock'
              ? 'border-amber-400 bg-amber-100/70 ring-2 ring-amber-400'
              : 'border-amber-200 bg-amber-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800">Min / Low Stock</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-[26px] font-bold text-amber-900">{lowStockCount}</p>
          <p className="mt-1 text-[11px] text-amber-700 font-medium">Stock at or below Min threshold</p>
        </div>

        {/* 3. In Stock Card */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'In stock' ? 'All' : 'In stock')}
          className={`cursor-pointer rounded-xl border p-4 shadow-2xs transition-all hover:shadow-xs ${
            selectedStatus === 'In stock'
              ? 'border-[#2d806b] bg-[#e7f5ef] ring-2 ring-[#2d806b]'
              : 'border-[#d6e5df] bg-[#f4f9f6]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1f6654]">In Stock (Normal)</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#e2f0ea] text-[#1f6654]">
              <PackageCheck className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-[26px] font-bold text-[#17604f]">{inStockCount}</p>
          <p className="mt-1 text-[11px] text-[#2c7763] font-medium">Within safe Min & Max bounds</p>
        </div>

        {/* 4. Over Stock Card */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'Over stock' ? 'All' : 'Over stock')}
          className={`cursor-pointer rounded-xl border p-4 shadow-2xs transition-all hover:shadow-xs ${
            selectedStatus === 'Over stock'
              ? 'border-blue-400 bg-blue-100/70 ring-2 ring-blue-400'
              : 'border-blue-200 bg-blue-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1e5fa0]">Over Stock Level</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-[#1e5fa0]">
              <Boxes className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-[26px] font-bold text-[#1e5fa0]">{overStockCount}</p>
          <p className="mt-1 text-[11px] text-[#276ba6] font-medium">Current Stock &gt; Max Stock buffer</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-[#e5e8ed] bg-white shadow-2xs">
        {/* Filter Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#eef0f3] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#dfe4e9] bg-[#fafbfc] px-3 py-2 sm:max-w-xs">
            <Search className="size-4 shrink-0 text-[#96a0ab]" />
            <input
              type="text"
              aria-label="Search items"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search code, name, category, UOM..."
              className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#a0a8b2]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-lg border border-[#dfe4e9] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#485462] outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-lg border border-[#dfe4e9] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#485462] outline-none"
            >
              <option value="All">All Stock Statuses ({itemMaster.length})</option>
              <option value="Critical">Critical Stock ({criticalCount})</option>
              <option value="Low stock">Min / Low Stock ({lowStockCount})</option>
              <option value="In stock">In Stock ({inStockCount})</option>
              <option value="Over stock">Over Stock ({overStockCount})</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center rounded-lg border border-[#dfe4e9] bg-white text-[11px] font-medium text-[#485462]">
              <span className="px-2 text-[#8e98a3]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent py-1.5 pr-2 outline-none font-semibold text-[#182230]"
              >
                <option value="name">Item Name</option>
                <option value="itemCode">Item Code</option>
                <option value="currentStock">Current Stock</option>
                <option value="minStock">Min Stock</option>
                <option value="safetyStock">Safety Stock</option>
                <option value="leadDays">Lead Days</option>
                <option value="averageConsumption">Avg Consumption</option>
                <option value="reorderQuantity">Reorder Qty</option>
              </select>
              <button
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                className="px-2 py-1.5 text-[#6f7c8b] hover:text-[#182230] border-l border-[#dfe4e9]"
              >
                <ArrowUpDown className="size-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCodes.length > 0 && (
          <div className="flex items-center justify-between bg-[#edf5f2] px-4 py-2 text-[12px] border-b border-[#cde0d8]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#17604f]">{selectedCodes.length} items selected</span>
              <span className="text-[#849a91]">|</span>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 rounded-md bg-[#fde8e4] px-2.5 py-1 text-[11px] font-bold text-[#b84a37] hover:bg-[#fad8d2]"
              >
                <Trash2 className="size-3" /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* ItemMaster Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left">
            <thead>
              <tr className="border-b border-[#eef0f3] text-[10px] font-bold uppercase tracking-[0.08em] text-[#8e98a3] bg-[#fbfcfd]">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((i) => selectedCodes.includes(i.itemCode))
                    }
                    onChange={toggleSelectAll}
                    aria-label="Select all current items"
                    className="accent-[#17604f]"
                  />
                </th>
                <th className="px-3 py-3">Item Code</th>
                <th className="px-3 py-3 min-w-[200px]">Item Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">UOM</th>
                <th className="px-3 py-3 text-right">Opening Bal</th>
                <th className="px-3 py-3 text-right" title="Dynamically calculated: Opening Balance + Total Incoming - Total Outgoing">
                  Current Stock <span className="font-normal text-[9px] text-[#17604f]">(Dynamic)</span>
                </th>
                <th className="px-3 py-3 text-right" title="Supplier replenishment lead time in days">Lead Days</th>
                <th className="px-3 py-3 text-right" title="Safety stock buffer to prevent stockout">Safety Stock</th>
                <th className="px-3 py-3 text-right" title="Average burn/consumption rate (Average Cunsumtion)">Avg Consumption</th>
                <th className="px-3 py-3 text-right">Min Stock</th>
                <th className="px-3 py-3 text-right">Max Stock</th>
                <th className="px-3 py-3 text-right" title="Standardized batch reorder quantity">Reorder Qty</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="w-20 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f5]">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center">
                    <Boxes className="mx-auto size-9 text-[#b2bac4]" />
                    <p className="mt-2 text-[14px] font-bold text-[#34404e]">No items in ItemMaster</p>
                    <p className="mt-0.5 text-[12px] text-[#7d8894]">
                      Register a new item or reset filters.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isChecked = selectedCodes.includes(item.itemCode)
                  const isCritical = item.status === 'Critical'
                  const isLow = item.status === 'Low stock'
                  const isOver = item.status === 'Over stock'

                  return (
                    <tr
                      key={item.itemCode}
                      className={`transition-colors ${
                        isCritical
                          ? 'bg-[#fff7f5] border-l-4 border-l-[#d54938] hover:bg-[#ffefeb]'
                          : isOver
                          ? 'bg-[#f9fbfe] border-l-4 border-l-[#2160a6] hover:bg-[#f2f7fd]'
                          : isLow
                          ? 'bg-[#fffdf7] border-l-4 border-l-[#d69938] hover:bg-[#fef9ec]'
                          : isChecked
                          ? 'bg-[#f7fbf9]'
                          : 'hover:bg-[#fafbfc]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(item.itemCode)}
                          aria-label={`Select ${item.itemCode}`}
                          className="accent-[#17604f]"
                        />
                      </td>

                      {/* Item Code */}
                      <td className="px-3 py-3">
                        <span
                          onClick={() => setActiveItemForDetail(item)}
                          className="font-mono text-[11px] font-bold text-[#17604f] bg-[#edf5f2] px-2 py-0.5 rounded-md cursor-pointer hover:underline"
                        >
                          {item.itemCode}
                        </span>
                      </td>

                      {/* Item Name */}
                      <td className="px-3 py-3">
                        <span
                          onClick={() => setActiveItemForDetail(item)}
                          className="text-[13px] font-bold text-[#1e2a38] cursor-pointer hover:text-[#17604f]"
                        >
                          {item.itemName}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-[#f1f3f6] px-2 py-0.5 text-[11px] font-medium text-[#4f5c6b]">
                          {item.category}
                        </span>
                      </td>

                      {/* UOM */}
                      <td className="px-3 py-3 font-mono text-[11px] text-[#556372]">
                        {item.uom}
                      </td>

                      {/* Opening Balance */}
                      <td className="px-3 py-3 text-right font-mono text-[12px] text-[#637180]">
                        {item.openingBalance}
                      </td>

                      {/* Current Stock */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono text-[13px] font-bold ${
                              isCritical
                                ? 'text-[#c93c2d]'
                                : isLow
                                ? 'text-[#c2842d]'
                                : isOver
                                ? 'text-[#1d5ca3]'
                                : 'text-[#1e6955]'
                            }`}
                          >
                            {item.currentStock}
                          </span>
                          {((item.totalInbound || 0) > 0 || (item.totalOutbound || 0) > 0) && (
                            <span className="text-[10px] text-[#86929f] font-mono leading-tight">
                              (+{item.totalInbound || 0} / -{item.totalOutbound || 0})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lead Days */}
                      <td className="px-3 py-3 text-right font-mono text-[12px] text-[#526071]">
                        {item.leadDays ?? 0}d
                      </td>

                      {/* Safety Stock */}
                      <td className="px-3 py-3 text-right font-mono text-[12px] font-semibold text-[#b45309]">
                        {item.safetyStock ?? 0}
                      </td>

                      {/* Average Consumption */}
                      <td className="px-3 py-3 text-right font-mono text-[12px] text-[#0284c7]">
                        {item.averageConsumption ?? 0}
                      </td>

                      {/* Min Stock */}
                      <td className="px-3 py-3 text-right font-mono text-[12px] font-medium text-[#7a8694]">
                        {item.minStock}
                      </td>

                      {/* Max Stock */}
                      <td className="px-3 py-3 text-right font-mono text-[12px] text-[#7a8694]">
                        {item.maxStock}
                      </td>

                      {/* Reorder Quantity */}
                      <td className="px-3 py-3 text-right font-mono text-[12px] font-bold text-[#17604f]">
                        {item.reorderQuantity ?? 0}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isCritical
                              ? 'bg-[#fde8e4] text-[#b84a37]'
                              : isLow
                              ? 'bg-[#fef3d6] text-[#9b6d19]'
                              : isOver
                              ? 'bg-[#eaf1fb] text-[#1d5ca3]'
                              : 'bg-[#eaf5f0] text-[#246c58]'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isCritical
                                ? 'bg-[#b84a37]'
                                : isLow
                                ? 'bg-[#9b6d19]'
                                : isOver
                                ? 'bg-[#1d5ca3]'
                                : 'bg-[#246c58]'
                            }`}
                          />
                          {item.status || 'In stock'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActiveItemForAdjust(item)}
                            title="Adjust Stock"
                            className="rounded-lg p-1.5 text-[#5e6b79] hover:bg-[#edf5f2] hover:text-[#17604f]"
                          >
                            <ArrowUpDown className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveItemForEdit(item)}
                            title="Edit Item"
                            className="rounded-lg p-1.5 text-[#5e6b79] hover:bg-[#f1f4f6] hover:text-[#182230]"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${item.itemCode} from ItemMaster?`)) {
                                deleteItemMaster(item.itemCode)
                              }
                            }}
                            title="Delete Item"
                            className="rounded-lg p-1.5 text-[#5e6b79] hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#eef0f3] p-4 sm:flex-row text-[12px] text-[#717e8c]">
          <div>
            Showing <span className="font-semibold text-[#182230]">{paginatedItems.length}</span> of{' '}
            <span className="font-semibold text-[#182230]">{filteredItems.length}</span> items
            {criticalCount > 0 && (
              <span className="ml-2 font-bold text-red-600">({criticalCount} critical pinned on top)</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-[#dfe4e9] p-1 text-[#62707f] hover:bg-[#f5f7f8] disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-[#dfe4e9] p-1 text-[#62707f] hover:bg-[#f5f7f8] disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Item Modals */}
      <ItemDetailModal
        item={activeItemForDetail}
        isOpen={Boolean(activeItemForDetail)}
        onClose={() => setActiveItemForDetail(null)}
        onOpenEdit={(it) => setActiveItemForEdit(it)}
        onOpenAdjust={(it) => setActiveItemForAdjust(it)}
      />

      <EditItemModal
        item={activeItemForEdit}
        isOpen={Boolean(activeItemForEdit)}
        onClose={() => setActiveItemForEdit(null)}
      />

      <StockAdjustmentModal
        item={activeItemForAdjust}
        isOpen={Boolean(activeItemForAdjust)}
        onClose={() => setActiveItemForAdjust(null)}
      />
    </div>
  )
}
