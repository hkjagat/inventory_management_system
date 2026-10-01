'use client'

import React, { useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  ClipboardList,
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  PackageCheck,
  PackageOpen,
} from 'lucide-react'
import { useApp } from '@/lib/context'
import { IncomingRecord, OutgoingRecord } from '@/lib/types'

type TransactionTab = 'incoming' | 'outgoing' | 'all'

export function TransactionsPage() {
  const {
    incoming,
    outgoing,
    categories,
    exportIncomingToCsv,
    exportOutgoingToCsv,
    setIsNewTxOpen,
  } = useApp()

  const [activeTab, setActiveTab] = useState<TransactionTab>('incoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('All')

  // Total calculations
  const totalIncomingUnits = useMemo(
    () => incoming.reduce((acc, row) => acc + (Number(row.quantity) || 0), 0),
    [incoming]
  )
  const totalOutgoingUnits = useMemo(
    () => outgoing.reduce((acc, row) => acc + (Number(row.quantity) || 0), 0),
    [outgoing]
  )

  // Filtered Incoming records
  const filteredIncoming = useMemo(() => {
    return incoming.filter((rec) => {
      const matchSearch =
        `${rec.docNumber} ${rec.itemCode} ${rec.itemName} ${rec.category} ${rec.uom} ${rec.date}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())

      const matchCat = selectedCategory === 'All' || rec.category === selectedCategory
      return matchSearch && matchCat
    })
  }, [incoming, searchQuery, selectedCategory])

  // Filtered Outgoing records
  const filteredOutgoing = useMemo(() => {
    return outgoing.filter((rec) => {
      const matchSearch =
        `${rec.docNumber} ${rec.itemCode} ${rec.itemName} ${rec.category} ${rec.uom} ${rec.date}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())

      const matchCat = selectedCategory === 'All' || rec.category === selectedCategory
      return matchSearch && matchCat
    })
  }, [outgoing, searchQuery, selectedCategory])

  // Combined list for "all" view
  const combinedList = useMemo(() => {
    const inc = filteredIncoming.map((item) => ({ ...item, type: 'Incoming' as const }))
    const out = filteredOutgoing.map((item) => ({ ...item, type: 'Outgoing' as const }))
    return [...inc, ...out].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
  }, [filteredIncoming, filteredOutgoing])

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-[#828d9a]">
            <span>Plant Operations</span>
            <span>/</span>
            <span className="font-semibold text-[#485563]">Movement Log Records</span>
          </div>
          <h2 className="text-[24px] font-bold tracking-tight text-[#182230]">
            Material Movements (Incoming & Outgoing)
          </h2>
          <p className="mt-0.5 text-[13px] text-[#788492]">
            Comprehensive ledger of material inbound receipts and shop floor dispatch transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'incoming' && (
            <button
              onClick={exportIncomingToCsv}
              className="flex items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#535f6d] shadow-2xs hover:bg-[#f8fafb]"
            >
              <Download className="size-3.5 text-[#73808e]" />
              Export Incoming (CSV)
            </button>
          )}

          {activeTab === 'outgoing' && (
            <button
              onClick={exportOutgoingToCsv}
              className="flex items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#535f6d] shadow-2xs hover:bg-[#f8fafb]"
            >
              <Download className="size-3.5 text-[#73808e]" />
              Export Outgoing (CSV)
            </button>
          )}

          {activeTab === 'all' && (
            <>
              <button
                onClick={exportIncomingToCsv}
                className="flex items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3 py-2 text-[11px] font-semibold text-[#535f6d] shadow-2xs hover:bg-[#f8fafb]"
              >
                <Download className="size-3 text-[#73808e]" />
                Export Incoming
              </button>
              <button
                onClick={exportOutgoingToCsv}
                className="flex items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3 py-2 text-[11px] font-semibold text-[#535f6d] shadow-2xs hover:bg-[#f8fafb]"
              >
                <Download className="size-3 text-[#73808e]" />
                Export Outgoing
              </button>
            </>
          )}

          <button
            onClick={() => setIsNewTxOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#17604f] px-3.5 py-2 text-[12px] font-semibold text-white shadow-2xs transition-all hover:bg-[#124b3e]"
          >
            <ArrowUpDown className="size-3.5" />
            Record Movement
          </button>
        </div>
      </div>

      {/* Movement Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Incoming summary card */}
        <div
          onClick={() => setActiveTab('incoming')}
          className={`cursor-pointer rounded-xl border p-4 shadow-2xs transition-all ${
            activeTab === 'incoming'
              ? 'border-[#17604f] bg-[#f7faf9]'
              : 'border-[#e5e8ed] bg-white hover:border-[#17604f]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#838e9c]">Inbound Receipts</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#eaf5f0] text-[#246c58]">
              <ArrowDownToLine className="size-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-[24px] font-bold text-[#182230]">{incoming.length}</p>
            <span className="text-[12px] text-[#717e8c]">receipts</span>
          </div>
          <p className="mt-1 text-[11px] text-[#246c58] font-medium">
            +{totalIncomingUnits.toLocaleString()} total units received into inventory
          </p>
        </div>

        {/* Outgoing summary card */}
        <div
          onClick={() => setActiveTab('outgoing')}
          className={`cursor-pointer rounded-xl border p-4 shadow-2xs transition-all ${
            activeTab === 'outgoing'
              ? 'border-[#b54708] bg-[#fffaf5]'
              : 'border-[#e5e8ed] bg-white hover:border-[#b54708]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#838e9c]">Outbound Issues</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#fef3eb] text-[#b54708]">
              <ArrowUpRight className="size-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-[24px] font-bold text-[#182230]">{outgoing.length}</p>
            <span className="text-[12px] text-[#717e8c]">dispatches</span>
          </div>
          <p className="mt-1 text-[11px] text-[#b54708] font-medium">
            -{totalOutgoingUnits.toLocaleString()} total units issued / consumed
          </p>
        </div>

        {/* Net Status card */}
        <div
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer rounded-xl border p-4 shadow-2xs transition-all ${
            activeTab === 'all'
              ? 'border-indigo-600 bg-indigo-50/20'
              : 'border-[#e5e8ed] bg-white hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#838e9c]">Total Audited Log</span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <ClipboardList className="size-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-[24px] font-bold text-[#182230]">
              {incoming.length + outgoing.length}
            </p>
            <span className="text-[12px] text-[#717e8c]">total movements</span>
          </div>
          <p className="mt-1 text-[11px] text-[#717e8c]">
            Net stock diff: {totalIncomingUnits - totalOutgoingUnits >= 0 ? '+' : ''}
            {(totalIncomingUnits - totalOutgoingUnits).toLocaleString()} units
          </p>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="rounded-xl border border-[#e5e8ed] bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 rounded-lg bg-[#f2f4f7] p-1">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                activeTab === 'incoming'
                  ? 'bg-white text-[#17604f] shadow-xs'
                  : 'text-[#64748b] hover:text-[#182230]'
              }`}
            >
              <ArrowDownToLine className="size-3.5" />
              Incoming Receipts ({filteredIncoming.length})
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                activeTab === 'outgoing'
                  ? 'bg-white text-[#b54708] shadow-xs'
                  : 'text-[#64748b] hover:text-[#182230]'
              }`}
            >
              <ArrowUpRight className="size-3.5" />
              Outgoing Issues ({filteredOutgoing.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-[#64748b] hover:text-[#182230]'
              }`}
            >
              <ClipboardList className="size-3.5" />
              Combined Log ({combinedList.length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9aa4b2]" />
              <input
                type="text"
                placeholder="Search Item Code, Name, Doc #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#dfe4e8] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#182230] placeholder-[#9aa4b2] focus:border-[#17604f] focus:outline-hidden"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-[#dfe4e8] bg-white px-3 py-1.5 text-[12px] font-medium text-[#485563] focus:border-[#17604f] focus:outline-hidden"
            >
              <option value="All">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Summary */}
        <div className="mt-3 flex items-center justify-between border-t border-[#f0f2f5] pt-2.5 text-[11px] text-[#838e9c]">
          <span className="flex items-center gap-1.5 font-medium text-[#485563]">
            <ClipboardList className="size-3.5 text-[#17604f]" />
            Audited Material Ledger Records
          </span>
          <span>Showing {activeTab === 'incoming' ? filteredIncoming.length : activeTab === 'outgoing' ? filteredOutgoing.length : combinedList.length} records</span>
        </div>
      </div>

      {/* Main Table for Incoming Records */}
      {activeTab === 'incoming' && (
        <div className="overflow-hidden rounded-xl border border-[#e5e8ed] bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#e8ecf1] bg-[#f8fafb] text-[11px] font-semibold uppercase tracking-wider text-[#637083]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Doc Number</th>
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">UOM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {filteredIncoming.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#828d9a]">
                      No incoming transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredIncoming.map((row, idx) => (
                    <tr key={row.id || `${row.docNumber}-${idx}`} className="hover:bg-[#fbfcfd] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#475467]">{row.date}</td>
                      <td className="py-3 px-4 font-semibold text-[#17604f]">
                        <span className="rounded bg-[#edf5f2] px-2 py-0.5 font-mono text-[11px]">
                          {row.docNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#182230]">{row.itemCode}</td>
                      <td className="py-3 px-4 font-medium text-[#182230]">{row.itemName}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#17604f]">
                        +{row.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#667085]">{row.uom}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Table for Outgoing Records */}
      {activeTab === 'outgoing' && (
        <div className="overflow-hidden rounded-xl border border-[#e5e8ed] bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#e8ecf1] bg-[#f8fafb] text-[11px] font-semibold uppercase tracking-wider text-[#637083]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Doc Number</th>
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">UOM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {filteredOutgoing.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#828d9a]">
                      No outgoing transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOutgoing.map((row, idx) => (
                    <tr key={row.id || `${row.docNumber}-${idx}`} className="hover:bg-[#fbfcfd] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#475467]">{row.date}</td>
                      <td className="py-3 px-4 font-semibold text-[#b54708]">
                        <span className="rounded bg-[#fff4ed] px-2 py-0.5 font-mono text-[11px] text-[#b54708]">
                          {row.docNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#182230]">{row.itemCode}</td>
                      <td className="py-3 px-4 font-medium text-[#182230]">{row.itemName}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#b54708]">
                        -{row.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#667085]">{row.uom}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Table for Combined View */}
      {activeTab === 'all' && (
        <div className="overflow-hidden rounded-xl border border-[#e5e8ed] bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#e8ecf1] bg-[#f8fafb] text-[11px] font-semibold uppercase tracking-wider text-[#637083]">
                  <th className="py-3 px-4">Flow</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Doc Number</th>
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">UOM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {combinedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#828d9a]">
                      No movement transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  combinedList.map((row, idx) => (
                    <tr key={row.id || `${row.docNumber}-${idx}`} className="hover:bg-[#fbfcfd] transition-colors">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                            row.type === 'Incoming'
                              ? 'bg-[#eaf5f0] text-[#246c58]'
                              : 'bg-[#fef3eb] text-[#b54708]'
                          }`}
                        >
                          {row.type === 'Incoming' ? (
                            <>
                              <ArrowDownToLine className="size-3" />
                              INCOMING
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="size-3" />
                              OUTGOING
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#475467]">{row.date}</td>
                      <td className="py-3 px-4 font-mono font-medium text-[#182230]">{row.docNumber}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#182230]">{row.itemCode}</td>
                      <td className="py-3 px-4 font-medium text-[#182230]">{row.itemName}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {row.category}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          row.type === 'Incoming' ? 'text-[#17604f]' : 'text-[#b54708]'
                        }`}
                      >
                        {row.type === 'Incoming' ? '+' : '-'}
                        {row.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#667085]">{row.uom}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
