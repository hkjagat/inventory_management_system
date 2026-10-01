'use client'

import React, { useState } from 'react'
import {
  Factory,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Database,
  CheckCircle2,
} from 'lucide-react'
import { useApp } from '@/lib/context'

export function LoginPage() {
  const { login, users } = useApp()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!loginId.trim()) {
      setErrorMessage('Please enter your Login Id.')
      return
    }
    if (!password) {
      setErrorMessage('Please enter your Password.')
      return
    }

    setIsLoading(true)
    const result = await login(loginId, password)
    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials.')
    }
  }

  const handleQuickLogin = (id: string, pass: string) => {
    setLoginId(id)
    setPassword(pass)
    setErrorMessage(null)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0d2a24] p-4 text-[#182230] select-none overflow-hidden">
      {/* Background aesthetic effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(38,124,103,0.35),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(20,72,61,0.4),transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[440px] rounded-3xl border border-white/10 bg-white/95 p-7 sm:p-9 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-400">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#123d35] to-[#1e5c50] text-white shadow-lg ring-4 ring-[#17604f]/20">
            <Factory className="size-7" />
          </div>
          <h1 className="mt-4 text-[22px] font-bold tracking-tight text-[#11231d]">
            Alpha Pharma Daman ERP
          </h1>
          <p className="mt-1 text-[13px] text-[#697973]">
            Plant Inventory & Consumables Control
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#d3e5dc] bg-[#eef7f3] px-3 py-1 text-[11px] font-semibold text-[#1c6453]">
            <ShieldCheck className="size-3" />
            <span>Secure Enterprise Authentication</span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] font-medium text-red-700 animate-in shake duration-300">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#54675f]">
              Login Id
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#869991]">
                <User className="size-4" />
              </div>
              <input
                type="text"
                autoFocus
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. admin or operator1"
                className="w-full rounded-xl border border-[#d6e0db] bg-[#fafcfb] py-2.5 pl-10 pr-3.5 text-[13px] font-medium text-[#182230] outline-none transition-all placeholder:text-[#95a8a0] focus:border-[#17604f] focus:bg-white focus:ring-3 focus:ring-[#17604f]/10"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#54675f]">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#869991]">
                <Lock className="size-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#d6e0db] bg-[#fafcfb] py-2.5 pl-10 pr-10 text-[13px] font-medium text-[#182230] outline-none transition-all placeholder:text-[#95a8a0] focus:border-[#17604f] focus:bg-white focus:ring-3 focus:ring-[#17604f]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#869991] hover:text-[#42554d]"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#17604f] to-[#124b3e] py-3 text-[13px] font-bold text-white shadow-md shadow-[#17604f]/25 transition-all hover:from-[#135243] hover:to-[#0f3f34] active:scale-[0.99] disabled:opacity-70"
          >
            {isLoading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Sign In to Plant Console</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins Chips */}
        <div className="mt-6 border-t border-[#e8efe9] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#798e85]">
              Quick Operator Logins
            </span>
            <Sparkles className="size-3 text-[#17604f]" />
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {users.slice(0, 3).map((u) => (
              <button
                key={u.loginId}
                type="button"
                onClick={() => handleQuickLogin(u.loginId, u.password || 'admin@123')}
                className="flex-1 min-w-[100px] flex flex-col items-center rounded-xl border border-[#d6e3dc] bg-[#f5f9f7] p-2 text-center transition-all hover:border-[#17604f] hover:bg-[#edf5f1]"
              >
                <span className="font-mono text-[11px] font-bold text-[#17604f]">{u.loginId}</span>
                <span className="text-[10px] font-bold text-[#2e4038] mt-0.5">{u.name || u.role}</span>
                <span className="text-[8px] text-[#71847c] capitalize">{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
