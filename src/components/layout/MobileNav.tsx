'use client'

import React from 'react'
import {
  X,
  Factory,
  LayoutDashboard,
  Boxes,
  ClipboardList,
  Settings2,
  CircleHelp,
} from 'lucide-react'
import { useApp } from '@/lib/context'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Inventory', icon: Boxes },
  { label: 'Transactions', icon: ClipboardList },
  { label: 'Settings', icon: Settings2 },
  { label: 'Help center', icon: CircleHelp },
]

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { activeNav, setActiveNav, inventory, canAccessPage } = useApp()

  if (!isOpen) return null

  const handleNavigate = (page: string) => {
    setActiveNav(page)
    onClose()
  }

  const visibleNavItems = navItems.filter((item) => canAccessPage(item.label))
  const canSeeSettings = canAccessPage('Settings')

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 z-10 w-[280px] bg-white p-5 shadow-2xl flex flex-col justify-between">
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#eef1f4]">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#123d35] text-white">
                <Factory className="size-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#182230]">Alpha Pharma Daman</p>
                <p className="text-[11px] text-[#85909c]">Plant 01 · Daman Facility</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#86919e] hover:bg-[#f3f5f7]"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="mt-6 flex flex-col gap-1.5">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.label
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.label)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-[14px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#edf5f2] text-[#17604f] font-semibold'
                      : 'text-[#5d6878] hover:bg-[#f5f7f8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-[18px]" />
                    {item.label}
                  </span>
                  {item.label === 'Inventory' && (
                    <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-[#17604f] shadow-2xs">
                      {inventory.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Master Configuration link */}
        {canSeeSettings && (
          <div className="pt-4 border-t border-[#eef1f4]">
            <button
              onClick={() => handleNavigate('Settings')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#edf5f2] py-2.5 text-[12px] font-bold text-[#17604f]"
            >
              <Settings2 className="size-4" />
              Master Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
