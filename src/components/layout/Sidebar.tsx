'use client'

import React from 'react'
import {
  Boxes,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Settings2,
  CircleHelp,
  ArrowUpRight,
  Database,
  Sliders,
} from 'lucide-react'
import { useApp } from '@/lib/context'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Inventory', icon: Boxes, hasCount: true },
  { label: 'Transactions', icon: ClipboardList, hasTxCount: true },
]

export function Sidebar({ className = '' }: { className?: string }) {
  const {
    activeNav,
    setActiveNav,
    inventory,
    incoming,
    outgoing,
    canAccessPage,
    currentUser,
  } = useApp()

  const getCount = (label: string) => {
    switch (label) {
      case 'Inventory':
        return inventory.length
      case 'Transactions':
        return incoming.length + outgoing.length
      default:
        return null
    }
  }

  const visibleNavItems = navItems.filter((item) => canAccessPage(item.label))
  const canSeeSettings = canAccessPage('Settings')
  const canSeeHelp = canAccessPage('Help center')

  return (
    <aside className={`flex w-[260px] shrink-0 flex-col border-r border-[#e5e8ed] bg-white px-4 py-5 select-none ${className}`}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 pb-7">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#123d35] to-[#1e584d] text-white shadow-sm ring-1 ring-black/5">
          <Factory className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold tracking-[-0.02em] text-[#182230]">Alpha Pharma Daman</span>
            <span className="rounded bg-[#edf5f2] px-1.5 py-0.5 text-[9px] font-bold text-[#17604f] uppercase">
              {currentUser?.role || 'user'}
            </span>
          </div>
          <p className="text-[11px] font-medium text-[#89919d]">Plant 01 · Daman Facility</p>
        </div>
      </div>

      {/* Main Navigation */}
      {visibleNavItems.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a5acb5]">
            Plant Workspace
          </p>
          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.label
              const count = getCount(item.label)

              return (
                <button
                  key={item.label}
                  onClick={() => setActiveNav(item.label)}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#edf5f2] text-[#17604f] font-semibold shadow-xs'
                      : 'text-[#5d6878] hover:bg-[#f5f7f8] hover:text-[#182230]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`size-[18px] transition-transform group-hover:scale-105 ${
                        isActive ? 'text-[#17604f]' : 'text-[#89929f]'
                      }`}
                    />
                    {item.label}
                  </span>
                  {count !== null && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-white text-[#17604f] shadow-xs'
                          : 'bg-[#f1f3f5] text-[#717c8a] group-hover:bg-[#e9ecef]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      )}

      {/* System & Support (Only shown if permitted) */}
      {(canSeeSettings || canSeeHelp) && (
        <div className="mt-7 flex flex-col gap-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a5acb5]">
            Plant Administration
          </p>
          {canSeeSettings && (
            <button
              onClick={() => setActiveNav('Settings')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                activeNav === 'Settings'
                  ? 'bg-[#edf5f2] text-[#17604f] font-semibold'
                  : 'text-[#5d6878] hover:bg-[#f5f7f8] hover:text-[#182230]'
              }`}
            >
              <Settings2
                className={`size-[18px] ${activeNav === 'Settings' ? 'text-[#17604f]' : 'text-[#89929f]'}`}
              />
              Master Configuration
            </button>
          )}

          {canSeeHelp && (
            <button
              onClick={() => setActiveNav('Help center')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                activeNav === 'Help center'
                  ? 'bg-[#edf5f2] text-[#17604f] font-semibold'
                  : 'text-[#5d6878] hover:bg-[#f5f7f8] hover:text-[#182230]'
              }`}
            >
              <CircleHelp
                className={`size-[18px] ${activeNav === 'Help center' ? 'text-[#17604f]' : 'text-[#89929f]'}`}
              />
              Help Center & SOPs
            </button>
          )}
        </div>
      )}

      {/* Master Configuration Hub Card (Only for admin or settings-enabled users) */}
      {canSeeSettings && (
        <div className="mt-auto rounded-xl border border-[#dfeae5] bg-gradient-to-b from-[#f4f8f6] to-[#edf5f2] p-3.5 shadow-2xs">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="relative inline-flex size-2 rounded-full bg-[#17604f]"></span>
              </span>
            <span className="text-[11px] font-bold text-[#2a5b4e]">Master Config Active</span>
          </div>
          <span className="rounded bg-[#d5e7df] px-1.5 py-0.5 text-[9px] font-bold text-[#17604f]">
            MDM
          </span>
        </div>

        <p className="text-[11px] font-medium text-[#4f6b62]">
          Categories, UOM, Reasons & Facility Rules
        </p>

        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#789389]">
          <Database className="size-3 text-[#458e72]" />
          <span>Local Master Authority</span>
        </div>

        <button
          onClick={() => setActiveNav('Settings')}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-md bg-white/80 py-1.5 text-[11px] font-semibold text-[#17604f] shadow-2xs transition-colors hover:bg-white"
        >
          Configure Masters <ArrowUpRight className="size-3" />
        </button>
      </div>
      )}
    </aside>
  )
}
