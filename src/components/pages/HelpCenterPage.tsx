'use client'

import React, { useState } from 'react'
import {
  CircleHelp,
  BookOpen,
  Keyboard,
  ShieldCheck,
  PhoneCall,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Send,
} from 'lucide-react'
import { useApp } from '@/lib/context'

const sops = [
  {
    id: 'SOP-INV-01',
    title: 'Inbound Receiving & Barcode Verification Protocol',
    category: 'Receiving & Dock',
    summary: 'Step-by-step verification for all commercial carrier deliveries and raw mill shipments.',
    steps: [
      'Verify carrier bill of lading against open Purchase Order (PO) in Alpha Pharma Daman.',
      'Check visual packaging integrity for freight impact, punctures, or moisture ingress.',
      'For raw materials and supplies: Verify Heat/Lot Number on bundle matches Certificate of Analysis (COA).',
      'Affix Alpha Pharma Daman QR barcode label to master pallet or lot bin before leaving the unloading dock.',
      'Record "Inbound Receipt" in Alpha Pharma Daman Transactions to update inventory on hand balance.',
    ],
  },
  {
    id: 'SOP-INV-02',
    title: 'Quarantine & Damaged Material Handling Protocol',
    category: 'Quality Assurance',
    summary: 'Mandatory isolation steps for defective, rejected, or non-conforming inventory items.',
    steps: [
      'Immediately apply high-visibility RED quarantine tag with defect description and operator ID.',
      'Physical transfer of quarantined item into Locked Bay Q-1 in main production hall.',
      'Change item status in Alpha Pharma Daman to "Quarantined" so stock is excluded from line scheduling.',
      'Notify Elena Rostova (Quality Lead) and Purchasing for vendor RMA issuance.',
    ],
  },
  {
    id: 'SOP-INV-03',
    title: 'Weekly Cycle Count & Inventory Reconciliation',
    category: 'Auditing',
    summary: 'Perpetual cycle count method replacing full annual shutdown inventory counts.',
    steps: [
      'Print weekly A-B-C inventory audit report on Monday 07:00.',
      'Perform blind physical tally across assigned bins without referencing system balances.',
      'Any discrepancy over ±2% requires a secondary counter verification.',
      'Record audit delta in Alpha Pharma Daman using "Audit Count" mode to log reconciliation.',
    ],
  },
  {
    id: 'SOP-INV-04',
    title: 'Hazardous Materials & Lubricant Drum Storage',
    category: 'Safety & Environmental',
    summary: 'OSHA & EPA compliant storage standards for ISO 68 hydraulic fluids and coolants.',
    steps: [
      'All drums must be stored on EPA-compliant secondary spill containment bunding pallets.',
      'Ensure Safety Data Sheet (SDS) is physically posted within 3 meters of the oil storage cage.',
      'Grounding clamps must be attached during fluid decanting to prevent electrostatic ignition.',
    ],
  },
]

const faqs = [
  {
    q: 'How are ERP Master Data configurations managed?',
    a: 'Alpha Pharma Daman provides dedicated frontend Master Data Management (MDM). Plant administrators can configure Consumable categories, Units of Measure (UOM), transaction Reason Codes, Facility shift parameters, and Safety buffers directly within the Settings interface with instantaneous local authority and validation.',
  },
  {
    q: 'What determines the "Critical" stock status?',
    a: 'An item is flagged as Critical when its on-hand inventory drops to or below 50% of its designated Reorder Point (or below its configured Minimum Safety Buffer). Plant supervisors receive immediate alert banners.',
  },
  {
    q: 'Can we export audit logs for external ISO-9001 compliance auditors?',
    a: 'Yes. In the Transactions page, click "Export Log (CSV)". Every material movement includes permanent timestamp, operator identification, source/destination coordinates, and reference document numbers.',
  },
  {
    q: 'How do I register a new inventory item or category?',
    a: 'Click "Register New Item" to add an item master record with safety stock, reorder point, and lead days. You can also configure master categories and units of measure directly in the Settings page.',
  },
]

export function HelpCenterPage() {
  const { showNotice } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [openSopId, setOpenSopId] = useState<string | null>('SOP-INV-01')
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0)

  // Support ticket form
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketSubject.trim()) return
    showNotice(`Support ticket "${ticketSubject}" dispatched to Plant Engineering`)
    setTicketSubject('')
    setTicketMessage('')
  }

  const filteredSops = sops.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-[#828d9a]">
          <span>Plant 01</span>
          <span>/</span>
          <span className="font-semibold text-[#485563]">Knowledge Base & Operational Guides</span>
        </div>
        <h2 className="text-[24px] font-bold tracking-tight text-[#182230]">
          Help Center & Standard Operating Procedures
        </h2>
        <p className="mt-0.5 text-[13px] text-[#788492]">
          Operational SOPs, inventory management guidelines, keyboard shortcuts, and plant engineering hotline.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2.5 rounded-xl border border-[#dfe4e9] bg-white p-3 shadow-2xs">
        <Search className="size-5 text-[#96a0ab] ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search SOPs, handling protocols, procedures, or keywords..."
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a0a8b2]"
        />
      </div>

      {/* Main Grid: SOPs & Shortcuts */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Left: Standard Operating Procedures */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4.5 text-[#17604f]" />
              <h3 className="text-[16px] font-bold text-[#182230]">
                Standard Operating Procedures ({filteredSops.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {filteredSops.map((sop) => {
              const isOpen = openSopId === sop.id
              return (
                <div
                  key={sop.id}
                  className="rounded-xl border border-[#e2e7ec] bg-white shadow-2xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenSopId(isOpen ? null : sop.id)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-[#fafbfc]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#17604f] bg-[#edf5f2] px-2 py-0.5 rounded-md">
                          {sop.id}
                        </span>
                        <span className="text-[11px] font-medium text-[#798592]">{sop.category}</span>
                      </div>
                      <h4 className="mt-1 text-[14px] font-bold text-[#182230]">{sop.title}</h4>
                      <p className="mt-0.5 text-[12px] text-[#6b7784]">{sop.summary}</p>
                    </div>

                    <div className="ml-4 shrink-0 text-[#8c98a5]">
                      {isOpen ? <ChevronUp className="size-4.5" /> : <ChevronDown className="size-4.5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#f0f2f5] bg-[#fbfcfd] p-4 text-[12px] text-[#485563]">
                      <p className="mb-2 font-bold uppercase tracking-wider text-[10px] text-[#7d8a98]">
                        Mandatory Procedure Steps:
                      </p>
                      <ol className="space-y-2 list-decimal list-inside leading-relaxed text-[#354352]">
                        {sop.steps.map((step, idx) => (
                          <li key={idx} className="pl-1">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Frequently Asked Questions */}
          <div className="pt-4 space-y-3">
            <h3 className="text-[16px] font-bold text-[#182230]">Frequently Asked Questions</h3>
            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIdx === idx
                return (
                  <div key={idx} className="rounded-xl border border-[#e5e9ee] bg-white shadow-2xs">
                    <button
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-3.5 text-left text-[13px] font-bold text-[#202c38] hover:bg-[#fafbfc]"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="size-4 text-[#7e8b98]" /> : <ChevronDown className="size-4 text-[#7e8b98]" />}
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#f1f3f6] p-3.5 text-[12px] leading-relaxed text-[#566371] bg-[#fafbfc]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Keyboard Shortcuts & Support Form */}
        <div className="space-y-5">
          {/* Shortcuts Card */}
          <div className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="size-4.5 text-[#17604f]" />
              <h3 className="text-[15px] font-bold text-[#182230]">Keyboard Quick Shortcuts</h3>
            </div>

            <div className="space-y-2.5 text-[12px]">
              {[
                { label: 'Add New Stock Item', keys: ['Alt', 'A'] },
                { label: 'Log Material Movement', keys: ['Alt', 'M'] },
                { label: 'Export Master CSV', keys: ['Alt', 'E'] },
                { label: 'Master Data Settings', keys: ['Alt', 'S'] },
                { label: 'Switch between Tabs', keys: ['1', '–', '6'] },
                { label: 'Close Active Modal', keys: ['Esc'] },
              ].map((sc, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-[#f1f3f6] last:border-0">
                  <span className="text-[#556372]">{sc.label}</span>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="rounded border border-[#d6dde3] bg-[#f8fafb] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#44515f] shadow-2xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plant Supervisor Hotline */}
          <div className="rounded-xl border border-[#dce6e1] bg-gradient-to-br from-[#f4f9f6] to-[#edf5f2] p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <PhoneCall className="size-4.5 text-[#17604f]" />
              <h3 className="text-[14px] font-bold text-[#1a4f42]">Plant Supervisor Emergency Line</h3>
            </div>
            <p className="text-[11px] text-[#4f7065] leading-relaxed mb-3">
              For immediate spill containment, conveyor blockage, or critical supply line stoppages:
            </p>
            <div className="rounded-xl bg-white p-3 border border-[#d0ded7]">
              <span className="text-[10px] font-bold uppercase text-[#889d93]">Duty Supervisor Hotline</span>
              <p className="text-[16px] font-mono font-bold text-[#17604f] mt-0.5">+1 (555) 792-4400</p>
              <p className="text-[10px] text-[#718c80] mt-0.5">Direct channel: Daman Control Room Radio CH 04</p>
            </div>
          </div>

          {/* Send Help / Feedback Ticket */}
          <div className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs">
            <h3 className="text-[14px] font-bold text-[#182230] mb-1">Submit Plant Engineering Request</h3>
            <p className="text-[11px] text-[#7d8894] mb-3">Questions on calibration, barcode scanners, or master data configuration.</p>

            <form onSubmit={handleSendTicket} className="space-y-3">
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Subject: e.g. Line 2 scanner recalibration"
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3 py-1.5 text-[12px] outline-none focus:border-[#17604f]"
              />
              <textarea
                rows={3}
                required
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your operational inquiry or system issue..."
                className="w-full rounded-lg border border-[#dce1e7] bg-[#fafbfc] px-3 py-1.5 text-[12px] outline-none focus:border-[#17604f]"
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#17604f] py-2 text-[12px] font-semibold text-white shadow-2xs hover:bg-[#124b3e]"
              >
                <Send className="size-3.5" /> Dispatch Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
