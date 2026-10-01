import React, { useState, useEffect } from 'react'
import { AppProvider, useApp } from '@/lib/context'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { OverviewPage } from '@/components/pages/OverviewPage'
import { InventoryPage } from '@/components/pages/InventoryPage'
import { TransactionsPage } from '@/components/pages/TransactionsPage'
import { SettingsPage } from '@/components/pages/SettingsPage'
import { HelpCenterPage } from '@/components/pages/HelpCenterPage'
import { LoginPage } from '@/components/pages/LoginPage'
import { AddItemModal } from '@/components/modals/AddItemModal'
import { NewTransactionModal } from '@/components/modals/NewTransactionModal'
import { UserProfileModal } from '@/components/modals/UserProfileModal'
import { CheckCircle2, X } from 'lucide-react'

function MainContent() {
  const {
    currentUser,
    activeNav,
    notice,
    dismissNotice,
    isAddItemOpen,
    setIsAddItemOpen,
    isNewTxOpen,
    setIsNewTxOpen,
    exportInventoryToCsv,
    setActiveNav,
    canAccessPage,
    allowedPages,
  } = useApp()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userProfileOpen, setUserProfileOpen] = useState(false)

  // Keyboard shortcut handler (placed before conditional return to obey React Rules of Hooks)
  useEffect(() => {
    if (!currentUser) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        setIsAddItemOpen(true)
      } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault()
        setIsNewTxOpen(true)
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault()
        exportInventoryToCsv()
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        if (canAccessPage('Settings')) setActiveNav('Settings')
      } else if (e.key === '1') {
        if (canAccessPage('Overview')) setActiveNav('Overview')
      } else if (e.key === '2') {
        if (canAccessPage('Inventory')) setActiveNav('Inventory')
      } else if (e.key === '3') {
        if (canAccessPage('Transactions')) setActiveNav('Transactions')
      } else if (e.key === '4') {
        if (canAccessPage('Settings')) setActiveNav('Settings')
      } else if (e.key === '5') {
        if (canAccessPage('Help center')) setActiveNav('Help center')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentUser, setIsAddItemOpen, setIsNewTxOpen, exportInventoryToCsv, setActiveNav, canAccessPage])

  // If not logged in, render the Login Page
  if (!currentUser) {
    return <LoginPage />
  }

  const hasAccessToCurrent = canAccessPage(activeNav)

  return (
    <div className="flex min-h-screen bg-[#f7f8fa] text-[#182230]">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Drawer */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <Header
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          onOpenProfile={() => setUserProfileOpen(true)}
        />

        {/* Dynamic Page Router with Access Enforcement */}
        <main className="flex-1 p-4 sm:p-7 max-w-[1440px] w-full mx-auto">
          {!hasAccessToCurrent ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-amber-200 bg-amber-50/50 p-8 my-6">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
                <CheckCircle2 className="size-7" />
              </div>
              <h2 className="text-[20px] font-bold text-[#182230]">Page Access Restricted</h2>
              <p className="mt-1 text-[13px] text-[#6b7785] max-w-md">
                Your user role <span className="font-bold text-amber-800 uppercase">({currentUser.role})</span> is not granted access to the <strong>"{activeNav}"</strong> page in your user permissions profile.
              </p>
              {allowedPages.length > 0 && (
                <button
                  onClick={() => setActiveNav(allowedPages[0])}
                  className="mt-5 rounded-lg bg-[#17604f] px-5 py-2.5 text-[12px] font-semibold text-white shadow-xs hover:bg-[#124b3e]"
                >
                  Return to Allowed Page ({allowedPages[0]})
                </button>
              )}
            </div>
          ) : (
            <>
              {activeNav === 'Overview' && <OverviewPage />}
              {activeNav === 'Inventory' && <InventoryPage />}
              {activeNav === 'Transactions' && <TransactionsPage />}
              {activeNav === 'Settings' && <SettingsPage />}
              {activeNav === 'Help center' && <HelpCenterPage />}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AddItemModal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} />
      <NewTransactionModal isOpen={isNewTxOpen} onClose={() => setIsNewTxOpen(false)} />
      <UserProfileModal isOpen={userProfileOpen} onClose={() => setUserProfileOpen(false)} />

      {/* Global Floating Toast Notice */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-[#2b5e52] bg-[#123d35] px-4 py-3 text-[12px] font-medium text-white shadow-xl animate-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="size-4 text-[#5fa889] shrink-0" />
          <span>{notice}</span>
          <button
            onClick={dismissNotice}
            className="ml-2 rounded-md p-1 text-[#8bb4a7] hover:bg-white/10 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  )
}
