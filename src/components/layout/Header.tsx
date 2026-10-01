'use client'

import React, { useState } from 'react'
import {
  Bell,
  ChevronDown,
  Factory,
  Menu,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  ExternalLink
} from 'lucide-react'
import { useApp } from '@/lib/context'

interface HeaderProps {
  onMobileMenuToggle: () => void
  onOpenProfile: () => void
}

export function Header({ onMobileMenuToggle, onOpenProfile }: HeaderProps) {
  const {
    currentUser,
    activeNav,
    alerts,
    markAlertRead,
    markAllAlertsRead,
    setIsAddItemOpen,
    setIsNewTxOpen,
    setActiveNav,
  } = useApp()

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const unreadAlerts = alerts.filter((a) => !a.read)

  // Current formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <header className="relative z-20 flex h-[70px] items-center justify-between border-b border-[#e5e8ed] bg-white px-4 sm:px-8">
      {/* Left: Mobile Menu + Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="flex size-9 items-center justify-center rounded-lg border border-[#e5e8ed] text-[#556372] lg:hidden hover:bg-[#f5f7f8]"
          aria-label="Open mobile menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex size-9 items-center justify-center rounded-xl bg-[#123d35] text-white lg:hidden">
          <Factory className="size-4" />
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#88929e]">
            <span>Plant 01</span>
            <span>/</span>
            <span className="font-semibold text-[#323d49]">{activeNav}</span>
            <span className="hidden sm:inline">· {todayFormatted}</span>
          </div>
          <h1 className="text-[18px] font-bold tracking-[-0.03em] text-[#182230]">
            {activeNav === 'Overview' && 'Operational Command & KPIs'}
            {activeNav === 'Inventory' && 'Plant Inventory & Stock Master'}
            {activeNav === 'Transactions' && 'Material Movement & Audit Logs'}
            {activeNav === 'Settings' && 'Plant Configuration & Master Data'}
            {activeNav === 'Help center' && 'Standard Operating Procedures & Help'}
          </h1>
        </div>
      </div>

      {/* Right: Quick Action Buttons & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Actions */}
        <button
          onClick={() => setIsNewTxOpen(true)}
          className="hidden items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3 py-2 text-[12px] font-semibold text-[#485462] shadow-2xs hover:bg-[#f7f9fa] md:flex"
        >
          <ArrowUpDown className="size-3.5 text-[#6c7784]" />
          <span>Record Movement</span>
        </button>

        <button
          onClick={() => setIsAddItemOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#17604f] px-3.5 py-2 text-[12px] font-semibold text-white shadow-2xs transition-all hover:bg-[#124b3e] active:scale-[0.98]"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Add Item</span>
        </button>

        <div className="h-6 w-px bg-[#e5e8ed]" />

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`relative rounded-lg p-2 transition-colors ${
              notificationsOpen ? 'bg-[#edf5f2] text-[#17604f]' : 'text-[#6f7a88] hover:bg-[#f4f6f7]'
            }`}
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
            {unreadAlerts.length > 0 && (
              <span className="absolute right-1 top-1 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d56b52] opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-[#d56b52]"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-11 z-40 w-[340px] sm:w-[380px] rounded-xl border border-[#e2e7ec] bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between border-b border-[#eef0f2] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#182230]">Plant Alerts</span>
                    {unreadAlerts.length > 0 && (
                      <span className="rounded-full bg-[#fde8e4] px-2 py-0.5 text-[10px] font-bold text-[#b84a37]">
                        {unreadAlerts.length} new
                      </span>
                    )}
                  </div>
                  {unreadAlerts.length > 0 && (
                    <button
                      onClick={markAllAlertsRead}
                      className="text-[11px] font-semibold text-[#17604f] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] divide-y divide-[#f2f4f6] overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="py-6 text-center text-[12px] text-[#8e98a3]">No notifications right now.</p>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex gap-3 py-3 transition-colors ${
                          !alert.read ? 'bg-[#fcfdfd]' : 'opacity-70'
                        }`}
                      >
                        <div className="shrink-0 pt-0.5">
                          {alert.type === 'danger' && (
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[#fde8e4] text-[#b84a37]">
                              <AlertTriangle className="size-3.5" />
                            </span>
                          )}
                          {alert.type === 'warning' && (
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[#fef3d6] text-[#9b6d19]">
                              <AlertTriangle className="size-3.5" />
                            </span>
                          )}
                          {alert.type === 'info' && (
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[#eaf0f8] text-[#3d6ca1]">
                              <Info className="size-3.5" />
                            </span>
                          )}
                          {alert.type === 'success' && (
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[#eaf5f0] text-[#256c59]">
                              <CheckCircle className="size-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-[12px] font-semibold text-[#253240]">{alert.title}</p>
                            <span className="text-[10px] text-[#9ca5ae] shrink-0">{alert.timestamp}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-[#68737f]">{alert.message}</p>
                          {alert.sku && (
                            <button
                              onClick={() => {
                                setActiveNav('Inventory')
                                setNotificationsOpen(false)
                              }}
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#17604f] hover:underline"
                            >
                              View in inventory <ExternalLink className="size-2.5" />
                            </button>
                          )}
                        </div>
                        {!alert.read && (
                          <button
                            onClick={() => markAlertRead(alert.id)}
                            className="shrink-0 text-[#a0a8b2] hover:text-[#455260]"
                            title="Mark as read"
                          >
                            <div className="size-2 rounded-full bg-[#17604f]" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 rounded-lg p-1.5 pr-2 transition-colors hover:bg-[#f4f6f7]"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1b6d5a] to-[#0f4438] text-[12px] font-bold text-white shadow-2xs">
            {String(currentUser?.name || currentUser?.loginId || 'AD')
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'AD'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-[12px] font-semibold leading-tight text-[#34404e]">
              {String(currentUser?.name || currentUser?.loginId || 'Admin')}
            </p>
            <p className="text-[10px] font-medium text-[#87929e] uppercase">
              {String(currentUser?.role || 'admin')}
            </p>
          </div>
          <ChevronDown className="hidden size-3.5 text-[#929ba5] sm:block" />
        </button>
      </div>
    </header>
  )
}
