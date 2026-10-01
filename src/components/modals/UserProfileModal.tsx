'use client'

import React from 'react'
import { X, User, Factory, Shield, Clock, CheckCircle } from 'lucide-react'
import { useApp } from '@/lib/context'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { currentUser, logout, showNotice, allowedPages } = useApp()

  if (!isOpen) return null

  const handleLogout = () => {
    onClose()
    logout()
  }

  const initials = String(currentUser?.name || currentUser?.loginId || 'AD')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#e2e7ec] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-[#eef1f4] pb-4">
          <h2 className="text-[17px] font-bold text-[#182230]">Operator Profile & Session</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#86919e] hover:bg-[#f3f5f7] hover:text-[#182230]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="mb-5 flex items-center gap-3.5 rounded-xl border border-[#e5e9ee] bg-[#f8fafb] p-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1b6d5a] to-[#0f4438] text-[20px] font-bold text-white shadow-xs">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-[16px] font-bold text-[#182230]">{currentUser?.name || 'Alex Morgan'}</h3>
              <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[10px] font-bold text-[#17604f]">
                {currentUser?.role || 'Admin'}
              </span>
            </div>
            <p className="text-[12px] font-mono text-[#6b7886]">Login Id: {currentUser?.loginId || 'admin'}</p>
            <p className="text-[11px] text-[#246c58] font-semibold mt-0.5">● Status: {currentUser?.status || 'Active'}</p>
          </div>
        </div>

        {/* Facility Selection */}
        <div className="space-y-3 mb-6">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637080]">
            Current Facility Assignment
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border-2 border-[#17604f] bg-[#edf5f2] p-3 text-[12px]">
              <div className="flex items-center gap-2.5">
                <Factory className="size-4 text-[#17604f]" />
                <div>
                  <p className="font-bold text-[#17604f]">Plant 01 — Alpha Pharma Daman</p>
                  <p className="text-[11px] text-[#5b7a70]">Active Shift: First Shift (06:00 - 14:30)</p>
                </div>
              </div>
              <CheckCircle className="size-4 text-[#17604f]" />
            </div>

            <button
              onClick={() => {
                showNotice('Switched facility to Plant 02 (Columbus)')
                onClose()
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[#e2e7ec] bg-white p-3 text-left text-[12px] transition-colors hover:bg-[#f8fafb]"
            >
              <div className="flex items-center gap-2.5">
                <Factory className="size-4 text-[#73808f]" />
                <div>
                  <p className="font-semibold text-[#323f4d]">Plant 02 — Columbus Precision Mill</p>
                  <p className="text-[11px] text-[#8b95a1]">Remote telemetry connection ready</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#17604f]">Switch</span>
            </button>
          </div>
        </div>

        {/* Page Access Permissions */}
        <div className="mb-5 rounded-xl border border-[#e8ecf1] bg-[#f8fafb] p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#637080]">
              Assigned Page Access
            </span>
            <span className="text-[10px] font-bold text-[#17604f] uppercase">
              Role: {currentUser?.role || 'user'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allowedPages.map((page) => (
              <span
                key={page}
                className="rounded-md bg-white border border-[#dfe4e8] px-2 py-0.5 text-[11px] font-medium text-[#182230]"
              >
                {page}
              </span>
            ))}
          </div>
          {currentUser?.role?.toLowerCase() === 'admin' && (
            <p className="mt-2 text-[10px] text-[#246c58] font-medium">
              Administrator has unrestricted access across all plant systems.
            </p>
          )}
        </div>

        {/* Security & Access */}
        <div className="mb-6 rounded-xl border border-[#eef2f5] p-3 text-[11px] text-[#697684] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Shield className="size-3.5 text-[#17604f]" /> Security Clearance:
            </span>
            <span className="font-bold text-[#182230] uppercase">
              {currentUser?.role === 'admin'
                ? 'Level 3 (Full Master & Admin)'
                : currentUser?.role === 'manager'
                ? 'Level 2 (Supervisor & Procurement)'
                : 'Level 1 (Shop Floor Operations)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="size-3.5 text-[#17604f]" /> Active Session:
            </span>
            <span className="font-mono text-[#44505c]">Live Plant Auth</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#edf1f4]">
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-200 px-4 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#17604f] px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#124b3e]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
