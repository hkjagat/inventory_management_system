'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { X, AlertCircle, Database } from 'lucide-react'
import { useApp } from '@/lib/context'
import { ItemMasterRecord } from '@/lib/types'

interface EditItemModalProps {
  item: ItemMasterRecord | null
  isOpen: boolean
  onClose: () => void
}

const standardUoms = ['Nos', 'Boxes', 'Kgs', 'Mtrs', 'Rolls', 'Pcs', 'Ltrs', 'Packes']
const defaultCategories = [
  'Consumable',
  'Lubricants and Oil',
  'Welding and Cutting',
  'Tooling and Abrasives',
  'PPE and Plant Safety',
  'Chemicals and Solvents',
  'Tapes and Cleanroom',
]

export function EditItemModal({ item, isOpen, onClose }: EditItemModalProps) {
  const { updateItemMaster, categories, uoms } = useApp()

  const availableCategories = useMemo(() => {
    const list = [...categories]
    if (item?.category && !list.includes(item.category)) {
      list.push(item.category)
    }
    return list.length > 0 ? list : defaultCategories
  }, [categories, item?.category])

  const availableUoms = useMemo(() => {
    const list = [...uoms]
    if (item?.uom && !list.includes(item.uom)) {
      list.push(item.uom)
    }
    return list.length > 0 ? list : standardUoms
  }, [uoms, item?.uom])

  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState('')
  const [uom, setUom] = useState('Nos')
  const [openingBalance, setOpeningBalance] = useState<number>(0)
  const [currentStock, setCurrentStock] = useState<number>(0)
  const [leadDays, setLeadDays] = useState<number>(0)
  const [safetyStock, setSafetyStock] = useState<number>(0)
  const [averageConsumption, setAverageConsumption] = useState<number>(0)
  const [minStock, setMinStock] = useState<number>(0)
  const [maxStock, setMaxStock] = useState<number>(0)
  const [reorderQuantity, setReorderQuantity] = useState<number>(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setItemName(item.itemName)
      setCategory(item.category)
      setUom(item.uom)
      setOpeningBalance(item.openingBalance)
      setCurrentStock(item.currentStock)
      setLeadDays(item.leadDays ?? 0)
      setSafetyStock(item.safetyStock ?? 0)
      setAverageConsumption(item.averageConsumption ?? (item as any).averageCunsumtion ?? 0)
      setMinStock(item.minStock)
      setMaxStock(item.maxStock)
      setReorderQuantity(item.reorderQuantity ?? 0)
    }
  }, [item])

  if (!isOpen || !item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim()) {
      setError('Please provide item name.')
      return
    }

    updateItemMaster(item.itemCode, {
      itemName: itemName.trim(),
      category,
      uom,
      openingBalance: Number(openingBalance) || 0,
      currentStock: Number(currentStock) || 0,
      leadDays: Math.max(0, Number(leadDays) || 0),
      safetyStock: Math.max(0, Number(safetyStock) || 0),
      averageConsumption: Math.max(0, Number(averageConsumption) || 0),
      minStock: Number(minStock) || 0,
      maxStock: Number(maxStock) || 0,
      reorderQuantity: Math.max(0, Number(reorderQuantity) || 0),
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#e2e7ec] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-[#eef1f4] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-[#182230]">Edit Item: {item.itemName}</h2>
              <span className="rounded-md bg-[#edf5f2] px-2 py-0.5 text-[11px] font-bold text-[#17604f]">
                {item.itemCode}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[#7b8694]">Update item catalog specifications and threshold parameters.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#86919e] hover:bg-[#f3f5f7] hover:text-[#182230]"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-[12px] font-medium text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Item Code (Locked)
              </label>
              <input
                type="text"
                disabled
                value={item.itemCode}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#f0f2f5] px-3.5 py-2 font-mono text-[13px] font-bold text-[#627080] outline-none"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                  Category
                </label>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#17604f]">
                  <Database className="size-2.5" />
                  {categories.length > 0 ? `Master Sheet (${availableCategories.length})` : `Default (${availableCategories.length})`}
                </span>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                  UOM (Unit of Measure)
                </label>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#17604f]">
                  <Database className="size-2.5" />
                  {uoms.length > 0 ? `Master Sheet (${availableUoms.length})` : `Standard (${availableUoms.length})`}
                </span>
              </div>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              >
                {availableUoms.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Opening Balance
              </label>
              <input
                type="number"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Current Stock ({uom})
              </label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-bold text-[#17604f] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Min Stock
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Max Stock
              </label>
              <input
                type="number"
                min="0"
                value={maxStock}
                onChange={(e) => setMaxStock(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>
          </div>

          {/* Planning & Replenishment Parameters */}
          <div className="rounded-xl border border-[#e2e7ec] bg-[#f9fafb] p-3.5">
            <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#17604f]">
              Planning & Replenishment Parameters
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#637080]">
                  Lead Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={leadDays}
                  onChange={(e) => setLeadDays(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="e.g. 7"
                  className="w-full rounded-lg border border-[#dce1e7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#182230] outline-none focus:border-[#17604f]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#637080]">
                  Safety Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-[#dce1e7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#182230] outline-none focus:border-[#17604f]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#637080]" title="Average Cunsumtion">
                  Avg Consumption
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={averageConsumption}
                  onChange={(e) => setAverageConsumption(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-[#dce1e7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#182230] outline-none focus:border-[#17604f]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#637080]">
                  Reorder Qty
                </label>
                <input
                  type="number"
                  min="0"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="e.g. 50"
                  className="w-full rounded-lg border border-[#dce1e7] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#17604f] outline-none focus:border-[#17604f]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eef1f4]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#dce1e7] px-4 py-2 text-[13px] font-medium text-[#5a6675] hover:bg-[#f6f8fa]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#17604f] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#124b3e]"
            >
              Save Item Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
