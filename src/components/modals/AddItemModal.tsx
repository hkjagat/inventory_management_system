'use client'

import React, { useState } from 'react'
import { X, Sparkles, AlertCircle, Database } from 'lucide-react'
import { useApp } from '@/lib/context'

interface AddItemModalProps {
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

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const { addItemMaster, categories, uoms } = useApp()

  const availableCategories = React.useMemo(() => {
    return categories.length > 0 ? categories : defaultCategories
  }, [categories])

  const availableUoms = React.useMemo(() => {
    return uoms.length > 0 ? uoms : standardUoms
  }, [uoms])

  const [itemCode, setItemCode] = useState('')
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState(availableCategories[0] || 'Consumable')
  const [uom, setUom] = useState(availableUoms[0] || 'Nos')

  // Auto-sync selection with Master sheet categories and UOMs when modal opens or lists update
  React.useEffect(() => {
    if (isOpen) {
      if (availableCategories.length > 0 && (!category || !availableCategories.includes(category))) {
        setCategory(availableCategories[0])
      }
      if (availableUoms.length > 0 && (!uom || !availableUoms.includes(uom))) {
        setUom(availableUoms[0])
      }
    }
  }, [isOpen, availableCategories, availableUoms])
  const [openingBalance, setOpeningBalance] = useState<number>(20)
  const [currentStock, setCurrentStock] = useState<number>(20)
  const [leadDays, setLeadDays] = useState<number>(7)
  const [safetyStock, setSafetyStock] = useState<number>(10)
  const [averageConsumption, setAverageConsumption] = useState<number>(5)
  const [minStock, setMinStock] = useState<number>(15)
  const [maxStock, setMaxStock] = useState<number>(60)
  const [reorderQuantity, setReorderQuantity] = useState<number>(50)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleGenerateCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    setItemCode(`CS-${randomNum}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemCode.trim() || !itemName.trim()) {
      setError('Please provide both Item Code and Item Name.')
      return
    }

    const openBal = Number(openingBalance) || 0
    const currStk = Number(currentStock) || openBal
    const minStk = Number(minStock) || 0
    const maxStk = Number(maxStock) || 0

    addItemMaster({
      itemCode: itemCode.trim().toUpperCase(),
      itemName: itemName.trim(),
      category,
      uom,
      openingBalance: openBal,
      currentStock: currStk,
      leadDays: Math.max(0, Number(leadDays) || 0),
      safetyStock: Math.max(0, Number(safetyStock) || 0),
      averageConsumption: Math.max(0, Number(averageConsumption) || 0),
      minStock: minStk,
      maxStock: maxStk,
      reorderQuantity: Math.max(0, Number(reorderQuantity) || 0),
    })

    // Reset and close
    setItemCode('')
    setItemName('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#e2e7ec] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-[#eef1f4] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-[#182230]">Register New Item Master</h2>
              <span className="rounded-md bg-[#edf5f2] px-2 py-0.5 text-[10px] font-bold text-[#17604f]">
                Master Catalog
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[#7b8694]">
              Enter item specifications, unit of measure, opening balance, and stock threshold boundaries.
            </p>
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
            {/* Item Code with Auto-generate */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                  Item Code *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#17604f] hover:underline"
                >
                  <Sparkles className="size-3" /> Auto-generate
                </button>
              </div>
              <input
                type="text"
                required
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="e.g. CS-4491"
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 font-mono text-[13px] font-bold text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>

            {/* Category */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                  Category *
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

          {/* Item Name */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
              Item Name & Technical Description *
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Industrial Lubricant ISO VG 68 (208L Drum)"
              className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* UOM */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                  UOM (Unit of Measure) *
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

            {/* Opening Balance */}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Opening Balance
              </label>
              <input
                type="number"
                min="0"
                value={openingBalance}
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0)
                  setOpeningBalance(val)
                  setCurrentStock(val)
                }}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>
          </div>

          {/* Stock Level Boundaries */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Current Stock */}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Current Stock ({uom})
              </label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-bold text-[#17604f] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>

            {/* Min Stock */}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Min Stock (Threshold)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>

            {/* Max Stock */}
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Max Stock (Capacity)
              </label>
              <input
                type="number"
                min="0"
                value={maxStock}
                onChange={(e) => setMaxStock(Math.max(0, parseFloat(e.target.value) || 0))}
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
              {/* Lead Days */}
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

              {/* Safety Stock */}
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

              {/* Average Consumption */}
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

              {/* Reorder Quantity */}
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

          {/* Buttons */}
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
              Register Item Master
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
