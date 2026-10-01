'use client'

import React, { useState } from 'react'
import { X, ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react'
import { useApp } from '@/lib/context'
import { ItemMasterRecord } from '@/lib/types'

interface StockAdjustmentModalProps {
  item: ItemMasterRecord | null
  isOpen: boolean
  onClose: () => void
}

export function StockAdjustmentModal({ item, isOpen, onClose }: StockAdjustmentModalProps) {
  const { adjustStock } = useApp()

  const [adjType, setAdjType] = useState<'add' | 'remove' | 'reconcile'>('add')
  const [delta, setDelta] = useState<number>(10)
  const [docNumber, setDocNumber] = useState(`ADJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`)

  if (!isOpen || !item) return null

  const currentStock = item.currentStock
  let netDelta = delta
  if (adjType === 'remove') {
    netDelta = -Math.abs(delta)
  } else if (adjType === 'reconcile') {
    netDelta = delta - currentStock
  }

  const projectedStock = Math.max(0, currentStock + netDelta)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    adjustStock(item.itemCode, netDelta, docNumber)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#e2e7ec] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-[#eef1f4] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-[#182230]">Adjust Stock: {item.itemCode}</h2>
              <span className="rounded-md bg-[#edf5f2] px-2 py-0.5 text-[11px] font-bold text-[#17604f]">
                {item.category}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[#7b8694]">{item.itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#86919e] hover:bg-[#f3f5f7] hover:text-[#182230]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Current Stock Preview Card */}
        <div className="mb-5 flex items-center justify-between rounded-xl bg-[#f7f9fa] p-4 border border-[#e8ecf0]">
          <div>
            <span className="text-[11px] font-semibold text-[#7c8896]">Current Stock</span>
            <p className="text-[20px] font-bold text-[#182230]">
              {item.currentStock.toLocaleString()}{' '}
              <span className="text-[13px] font-normal text-[#7c8896]">{item.uom}</span>
            </p>
          </div>
          <div className="text-center font-bold text-[#b5bfc9] text-xl">&rarr;</div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-[#7c8896]">Projected Stock</span>
            <p className="text-[20px] font-bold text-[#17604f]">
              {projectedStock.toLocaleString()}{' '}
              <span className="text-[13px] font-normal text-[#7c8896]">{item.uom}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Adjustment Mode Selector */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
              Adjustment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjType('add')}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all ${
                  adjType === 'add'
                    ? 'border-[#2d806b] bg-[#edf5f2] text-[#17604f] font-bold shadow-xs'
                    : 'border-[#dfe3e7] bg-white text-[#667280] hover:bg-[#f9fafb]'
                }`}
              >
                <ArrowDownRight className="size-4 text-[#2d806b]" />
                <span className="text-[11px]">Add to Stock (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjType('remove')}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all ${
                  adjType === 'remove'
                    ? 'border-[#3b6ea5] bg-[#edf3fa] text-[#2c5b8f] font-bold shadow-xs'
                    : 'border-[#dfe3e7] bg-white text-[#667280] hover:bg-[#f9fafb]'
                }`}
              >
                <ArrowUpRight className="size-4 text-[#3b6ea5]" />
                <span className="text-[11px]">Deduct Stock (−)</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjType('reconcile')}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all ${
                  adjType === 'reconcile'
                    ? 'border-[#c2842d] bg-[#fdf7ee] text-[#9c6317] font-bold shadow-xs'
                    : 'border-[#dfe3e7] bg-white text-[#667280] hover:bg-[#f9fafb]'
                }`}
              >
                <Scale className="size-4 text-[#c2842d]" />
                <span className="text-[11px]">Audit Count (=)</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
              {adjType === 'reconcile' ? 'New Verified Physical Count' : 'Quantity Delta'} ({item.uom}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={delta}
              onChange={(e) => setDelta(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[14px] font-bold text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
            />
          </div>

          {/* Doc Number */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
              Doc Number / Audit Reference
            </label>
            <input
              type="text"
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 font-mono text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eef1f4]">
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
              Confirm Stock Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
