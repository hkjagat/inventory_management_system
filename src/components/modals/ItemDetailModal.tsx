'use client'

import React from 'react'
import {
  X,
  Package,
  Layers,
  MapPin,
  TrendingDown,
  Clock,
  Edit,
  ArrowUpDown,
  Barcode,
  ShieldAlert,
  Boxes,
  Calculator,
  ArrowDownLeft,
  ArrowUpRight,
  Equal,
} from 'lucide-react'
import { useApp } from '@/lib/context'
import { ItemMasterRecord } from '@/lib/types'

interface ItemDetailModalProps {
  item: ItemMasterRecord | null
  isOpen: boolean
  onClose: () => void
  onOpenEdit: (item: ItemMasterRecord) => void
  onOpenAdjust: (item: ItemMasterRecord) => void
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onOpenEdit,
  onOpenAdjust,
}: ItemDetailModalProps) {
  const { incoming, outgoing } = useApp()

  if (!isOpen || !item) return null

  const itemIncoming = incoming.filter((t) => t.itemCode.toUpperCase() === item.itemCode.toUpperCase())
  const itemOutgoing = outgoing.filter((t) => t.itemCode.toUpperCase() === item.itemCode.toUpperCase())

  const totalInbound = itemIncoming.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
  const totalOutbound = itemOutgoing.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
  const dynamicStock = Math.max(0, (Number(item.openingBalance) || 0) + totalInbound - totalOutbound)

  const statusStyles: Record<string, string> = {
    'In stock': 'bg-[#eaf5f0] text-[#26715d] border-[#cce8dc]',
    'Low stock': 'bg-[#fff3df] text-[#a16c29] border-[#fae2b8]',
    Critical: 'bg-[#fce9e6] text-[#b55246] border-[#f8cac4]',
    'Over stock': 'bg-[#eaf1fb] text-[#1d5ca3] border-[#bdd5f5]',
  }

  const stockRatio =
    item.minStock > 0 ? Math.min(100, Math.round((item.currentStock / item.minStock) * 100)) : 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#e2e7ec] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between border-b border-[#eef1f4] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#edf5f2] text-[#17604f] shadow-xs">
              <Package className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-bold text-[#627181]">{item.itemCode}</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    statusStyles[item.status || 'In stock'] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.status || 'In stock'}
                </span>
                <span className="rounded-md bg-[#f1f3f6] px-2 py-0.5 text-[11px] font-medium text-[#5c6877]">
                  {item.category}
                </span>
              </div>
              <h2 className="mt-1 text-[18px] font-bold text-[#182230]">{item.itemName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#86919e] hover:bg-[#f3f5f7] hover:text-[#182230]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Dynamic Stock Ledger Reconciliation Card */}
        <div className="mb-5 rounded-xl border border-[#d2e4dc] bg-[#f4f9f7] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#17604f]">
              <Calculator className="size-4 text-[#17604f]" />
              Dynamic Stock Ledger Calculation
            </span>
            <span className="rounded-full bg-[#17604f]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#17604f]">
              Formula: Op.Bal + In - Out
            </span>
          </div>

          <div className="grid grid-cols-4 items-center gap-2 text-center text-[12px]">
            <div className="rounded-lg border border-[#e2ece7] bg-white p-2.5 shadow-2xs">
              <span className="block text-[10px] uppercase font-bold text-[#6a7c74]">Opening Bal</span>
              <span className="mt-0.5 block font-mono text-[16px] font-bold text-[#23352e]">
                {item.openingBalance} <span className="text-[10px] font-normal text-[#7f9189]">{item.uom}</span>
              </span>
            </div>

            <div className="rounded-lg border border-[#d3ebd9] bg-[#eef8f2] p-2.5 shadow-2xs">
              <span className="block text-[10px] uppercase font-bold text-[#216c56]">+ Inbound Receipts</span>
              <span className="mt-0.5 block font-mono text-[16px] font-bold text-[#1a5f4b]">
                +{totalInbound} <span className="text-[10px] font-normal text-[#598375]">{item.uom}</span>
              </span>
            </div>

            <div className="rounded-lg border border-[#fbd8d3] bg-[#fdf2f0] p-2.5 shadow-2xs">
              <span className="block text-[10px] uppercase font-bold text-[#ad4332]">- Outbound Issues</span>
              <span className="mt-0.5 block font-mono text-[16px] font-bold text-[#9d3625]">
                -{totalOutbound} <span className="text-[10px] font-normal text-[#a66a61]">{item.uom}</span>
              </span>
            </div>

            <div className="rounded-lg border border-[#17604f] bg-[#17604f] p-2.5 text-white shadow-2xs">
              <span className="block text-[10px] uppercase font-bold text-[#a6d9cb]">= Current Stock</span>
              <span className="mt-0.5 block font-mono text-[18px] font-extrabold text-white">
                {dynamicStock} <span className="text-[10px] font-medium text-[#c5ebe0]">{item.uom}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#e8ecf1] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#7a8694]">Current Stock</span>
            <p className="mt-0.5 text-[18px] font-bold text-[#182230]">
              {item.currentStock.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-[#818d9b]">{item.uom}</span>
            </p>
          </div>

          <div className="rounded-xl border border-[#e8ecf1] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#7a8694]">Opening Balance</span>
            <p className="mt-0.5 text-[18px] font-bold text-[#32404f]">
              {item.openingBalance.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-[#818d9b]">{item.uom}</span>
            </p>
          </div>

          <div className="rounded-xl border border-[#e8ecf1] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#7a8694]">Min Stock Threshold</span>
            <p className="mt-0.5 text-[18px] font-bold text-[#b55246]">
              {item.minStock.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-[#818d9b]">{item.uom}</span>
            </p>
          </div>

          <div className="rounded-xl border border-[#e8ecf1] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#7a8694]">Max Stock Ceiling</span>
            <p className="mt-0.5 text-[18px] font-bold text-[#17604f]">
              {item.maxStock.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-[#818d9b]">{item.uom}</span>
            </p>
          </div>
        </div>

        {/* Planning & Replenishment Parameters Card */}
        <div className="mb-4 rounded-xl border border-[#e5ebee] bg-[#f8fafc] p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#17604f]">
              Planning & Replenishment Controls
            </span>
            {(item.averageConsumption || 0) > 0 && (
              <span className="rounded-full bg-[#17604f]/10 px-2 py-0.5 text-[10px] font-bold text-[#17604f]">
                ~{Math.round(item.currentStock / (item.averageConsumption || 1))} days runway
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-lg border border-[#e8ecf1] bg-white p-2.5">
              <span className="block text-[10px] font-bold uppercase text-[#738290]">Lead Days</span>
              <p className="mt-0.5 font-mono text-[14px] font-bold text-[#1e293b]">
                {item.leadDays ?? 0} <span className="text-[10px] font-normal text-[#64748b]">Days</span>
              </p>
            </div>

            <div className="rounded-lg border border-[#e8ecf1] bg-white p-2.5">
              <span className="block text-[10px] font-bold uppercase text-[#738290]">Safety Stock</span>
              <p className="mt-0.5 font-mono text-[14px] font-bold text-[#d97706]">
                {(item.safetyStock ?? 0).toLocaleString()}{' '}
                <span className="text-[10px] font-normal text-[#64748b]">{item.uom}</span>
              </p>
            </div>

            <div className="rounded-lg border border-[#e8ecf1] bg-white p-2.5">
              <span className="block text-[10px] font-bold uppercase text-[#738290]" title="Average Cunsumtion">
                Avg Consumption
              </span>
              <p className="mt-0.5 font-mono text-[14px] font-bold text-[#0284c7]">
                {(item.averageConsumption ?? 0).toLocaleString()}{' '}
                <span className="text-[10px] font-normal text-[#64748b]">{item.uom}/day</span>
              </p>
            </div>

            <div className="rounded-lg border border-[#e8ecf1] bg-white p-2.5">
              <span className="block text-[10px] font-bold uppercase text-[#738290]">Reorder Qty</span>
              <p className="mt-0.5 font-mono text-[14px] font-bold text-[#17604f]">
                {(item.reorderQuantity ?? 0).toLocaleString()}{' '}
                <span className="text-[10px] font-normal text-[#64748b]">{item.uom}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stock Level Progress */}
        <div className="mb-5 rounded-xl border border-[#e8ecf1] bg-[#fafbfc] p-3.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#455260]">Operating Buffer (Min: {item.minStock} · Max: {item.maxStock})</span>
            <span className="font-bold text-[#17604f]">
              {item.currentStock} {item.uom} ({stockRatio}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#e3e7ec]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                item.status === 'Critical'
                  ? 'bg-[#d54938]'
                  : item.status === 'Low stock'
                  ? 'bg-[#d28b34]'
                  : item.status === 'Over stock'
                  ? 'bg-[#2563eb]'
                  : 'bg-[#2d806b]'
              }`}
              style={{ width: `${Math.min(100, (item.currentStock / Math.max(1, item.maxStock)) * 100)}%` }}
            />
          </div>
          {item.status === 'Critical' && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#b5493b]">
              <ShieldAlert className="size-3.5" />
              Stock has breached minimum safety threshold (below 50% min stock).
            </p>
          )}
          {item.status === 'Over stock' && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#1d5ca3]">
              <Package className="size-3.5" />
              Stock exceeds maximum ceiling buffer ({item.maxStock} {item.uom}).
            </p>
          )}
        </div>

        {/* Recent Transactions Snippet */}
        <div className="mb-5">
          <h3 className="mb-2 text-[12px] font-bold text-[#182230]">Recent Movement Audit Logs</h3>
          {itemIncoming.length === 0 && itemOutgoing.length === 0 ? (
            <p className="rounded-lg border border-[#eef1f4] bg-[#fcfdfe] p-3 text-center text-[12px] text-[#86929e]">
              No incoming or outgoing ledger entries recorded yet for {item.itemCode}.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {itemIncoming.map((inc, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-[#f0f7f4] px-3 py-1.5 text-[11px]">
                  <span className="flex items-center gap-1 font-medium text-[#246c58]">
                    <ArrowDownLeft className="size-3 text-[#246c58]" />
                    + {inc.quantity} {inc.uom} (Incoming: {inc.docNumber})
                  </span>
                  <span className="text-[#84928e]">{inc.date}</span>
                </div>
              ))}
              {itemOutgoing.map((out, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-[#fdf2f0] px-3 py-1.5 text-[11px]">
                  <span className="flex items-center gap-1 font-medium text-[#b84a37]">
                    <ArrowUpRight className="size-3 text-[#b84a37]" />
                    - {out.quantity} {out.uom} (Outgoing: {out.docNumber})
                  </span>
                  <span className="text-[#84928e]">{out.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#eef1f4] pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose()
                onOpenAdjust(item)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#dce1e7] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#485462] hover:bg-[#f7f9fa]"
            >
              <ArrowUpDown className="size-3.5 text-[#6c7784]" /> Adjust Stock
            </button>
            <button
              onClick={() => {
                onClose()
                onOpenEdit(item)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#dce1e7] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#485462] hover:bg-[#f7f9fa]"
            >
              <Edit className="size-3.5 text-[#6c7784]" /> Edit Item
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-[#17604f] px-5 py-2 text-[12px] font-semibold text-white hover:bg-[#124b3e]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
