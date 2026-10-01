'use client'

import React, { useState } from 'react'
import { X, ArrowDownToLine, ArrowUpRight, AlertCircle, Calendar, Hash } from 'lucide-react'
import { useApp } from '@/lib/context'

interface NewTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewTransactionModal({ isOpen, onClose }: NewTransactionModalProps) {
  const { itemMaster, recordIncoming, recordOutgoing } = useApp()

  const [mode, setMode] = useState<'Incoming' | 'Outgoing'>('Incoming')
  const [selectedItemCode, setSelectedItemCode] = useState(itemMaster[0]?.itemCode || '')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [docNumber, setDocNumber] = useState(`PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`)
  const [quantity, setQuantity] = useState<number>(10)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const selectedItem = itemMaster.find((i) => i.itemCode === selectedItemCode) || itemMaster[0]

  const handleModeChange = (newMode: 'Incoming' | 'Outgoing') => {
    setMode(newMode)
    if (newMode === 'Incoming') {
      setDocNumber(`PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`)
    } else {
      setDocNumber(`WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) {
      setError('Please select an item.')
      return
    }

    const qty = Number(quantity) || 0
    if (qty <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }

    if (mode === 'Outgoing' && selectedItem.currentStock < qty) {
      setError(`Cannot issue ${qty} ${selectedItem.uom}. Available stock is only ${selectedItem.currentStock} ${selectedItem.uom}.`)
      return
    }

    const payload = {
      date,
      docNumber: docNumber.trim(),
      itemCode: selectedItem.itemCode,
      itemName: selectedItem.itemName,
      category: selectedItem.category,
      quantity: qty,
      uom: selectedItem.uom,
    }

    if (mode === 'Incoming') {
      recordIncoming(payload)
    } else {
      recordOutgoing(payload)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#e2e7ec] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-[#eef1f4] pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-9 items-center justify-center rounded-xl ${
                mode === 'Incoming' ? 'bg-[#eaf5f0] text-[#17604f]' : 'bg-[#edf3fa] text-[#2c5b8f]'
              }`}
            >
              {mode === 'Incoming' ? <ArrowDownToLine className="size-5" /> : <ArrowUpRight className="size-5" />}
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#182230]">
                Record {mode === 'Incoming' ? 'Inbound Receipt' : 'Outbound Issue'}
              </h2>
              <p className="mt-0.5 text-[12px] text-[#7b8694]">
                Logs movement in audited material ledger and updates on-hand stock.
              </p>
            </div>
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
          {/* Movement Mode Toggle */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
              Movement Classification
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModeChange('Incoming')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold transition-all ${
                  mode === 'Incoming'
                    ? 'bg-[#17604f] text-white shadow-xs'
                    : 'border border-[#dce1e7] bg-[#fafbfc] text-[#556372] hover:bg-[#f3f5f7]'
                }`}
              >
                <ArrowDownToLine className="size-4" />
                Inbound Receipt (+)
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('Outgoing')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold transition-all ${
                  mode === 'Outgoing'
                    ? 'bg-[#2c5b8f] text-white shadow-xs'
                    : 'border border-[#dce1e7] bg-[#fafbfc] text-[#556372] hover:bg-[#f3f5f7]'
                }`}
              >
                <ArrowUpRight className="size-4" />
                Outbound Issue (−)
              </button>
            </div>
          </div>

          {/* Select Item */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
              Item Code & Specification *
            </label>
            <select
              value={selectedItemCode}
              onChange={(e) => setSelectedItemCode(e.target.value)}
              className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
            >
              {itemMaster.map((item) => (
                <option key={item.itemCode} value={item.itemCode}>
                  {item.itemCode} — {item.itemName} (Stock: {item.currentStock} {item.uom})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Doc Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3 py-2 text-[13px] font-medium text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Doc Number *
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. PO-2026-085 or WO-8831"
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3 py-2 font-mono text-[13px] font-semibold text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>
          </div>

          {/* Quantity & Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
                Quantity Moving ({selectedItem?.uom || 'units'}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3.5 py-2 text-[14px] font-bold text-[#182230] outline-none focus:border-[#17604f] focus:bg-white"
              />
            </div>

            <div className="rounded-xl border border-[#e5e9ee] bg-[#fafbfc] p-3 text-[12px] flex flex-col justify-center">
              <span className="text-[10px] text-[#788592] uppercase font-bold">Projected Current Stock</span>
              <p className="mt-0.5 text-[15px] font-bold text-[#182230]">
                {mode === 'Incoming'
                  ? (selectedItem?.currentStock || 0) + (Number(quantity) || 0)
                  : Math.max(0, (selectedItem?.currentStock || 0) - (Number(quantity) || 0))}{' '}
                <span className="text-[12px] font-normal text-[#788592]">{selectedItem?.uom}</span>
              </p>
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
              className={`rounded-lg px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all ${
                mode === 'Incoming'
                  ? 'bg-[#17604f] hover:bg-[#124b3e]'
                  : 'bg-[#2c5b8f] hover:bg-[#20446d]'
              }`}
            >
              Post Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
