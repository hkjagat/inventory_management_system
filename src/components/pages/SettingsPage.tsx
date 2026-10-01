'use client'

import React, { useState } from 'react'
import {
  Settings2,
  Database,
  Layers,
  Users as UsersIcon,
  Plus,
  Trash2,
  Check,
  X,
  Edit2,
  Save,
  Download,
  RotateCcw,
  Tag,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react'
import { useApp } from '@/lib/context'
import { UserRecord, UserRole, APP_PAGES, AppPageName } from '@/lib/types'

type SettingsTab = 'masters' | 'users'

export function SettingsPage() {
  const {
    // Masters
    categories,
    addCategory,
    deleteCategory,
    uoms,
    addUom,
    deleteUom,

    // Users
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    currentUser,

    // Item master (to count items per category)
    itemMaster,

    refreshData,
    isSyncing,

    showNotice,
  } = useApp()

  const [activeTab, setActiveTab] = useState<SettingsTab>('masters')

  // --- Masters Category form state ---
  const [showAddCatModal, setShowAddCatModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  // --- Masters UOM form state ---
  const [showAddUomModal, setShowAddUomModal] = useState(false)
  const [newUomName, setNewUomName] = useState('')

  // --- Users form state ---
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newLoginId, setNewLoginId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('user')
  const [newStatus, setNewStatus] = useState<'Active' | 'Inactive'>('Active')
  const [selectedPages, setSelectedPages] = useState<string[]>(['Inventory', 'Transactions'])

  const handleRoleChange = (role: UserRole) => {
    setNewRole(role)
    if (role === 'admin') {
      setSelectedPages([...APP_PAGES])
    } else if (role === 'manager') {
      setSelectedPages(['Overview', 'Inventory', 'Transactions'])
    } else {
      setSelectedPages(['Inventory', 'Transactions'])
    }
  }

  const togglePageSelection = (page: string) => {
    if (newRole === 'admin') return
    setSelectedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    )
  }

  // --- Edit User form state ---
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [editPassword, setEditPassword] = useState('')
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('user')
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active')
  const [editSelectedPages, setEditSelectedPages] = useState<string[]>([])

  const openEditUser = (user: UserRecord) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditPassword(user.password || '')
    setEditRole((user.role as UserRole) || 'user')
    setEditStatus(user.status || 'Active')

    const accessStr = String(user.pageAccess || '').trim()
    if (accessStr.toLowerCase() === 'all' || accessStr === '*') {
      setEditSelectedPages([...APP_PAGES])
    } else if (accessStr) {
      const parts = accessStr.split(',').map((s) => s.trim())
      setEditSelectedPages(parts)
    } else {
      setEditSelectedPages(
        user.role === 'admin'
          ? [...APP_PAGES]
          : user.role === 'manager'
          ? ['Overview', 'Inventory', 'Transactions']
          : ['Inventory', 'Transactions']
      )
    }
  }

  const handleEditRoleChange = (role: UserRole) => {
    setEditRole(role)
    if (role === 'admin') {
      setEditSelectedPages([...APP_PAGES])
    } else if (role === 'manager') {
      setEditSelectedPages(['Overview', 'Inventory', 'Transactions'])
    } else {
      setEditSelectedPages(['Inventory', 'Transactions'])
    }
  }

  const toggleEditPageSelection = (page: string) => {
    if (editRole === 'admin') return
    setEditSelectedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    )
  }

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    if (!editName.trim()) {
      showNotice('Please provide a name')
      return
    }

    const pageAccessVal =
      editRole === 'admin'
        ? 'all'
        : editSelectedPages.join(', ')

    updateUser(editingUser.loginId, {
      name: editName.trim(),
      password: editPassword,
      role: editRole,
      status: editStatus,
      pageAccess: pageAccessVal,
    })

    setEditingUser(null)
  }

  // Handle Add Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    addCategory(newCatName.trim())
    setNewCatName('')
    setShowAddCatModal(false)
  }

  // Handle Add UOM
  const handleSaveUom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUomName.trim()) return
    addUom(newUomName.trim())
    setNewUomName('')
    setShowAddUomModal(false)
  }

  // Handle Add User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLoginId.trim() || !newPassword.trim() || !newName.trim()) {
      showNotice('Please fill in Login Id, Password, and Name')
      return
    }

    if (users.some((u) => u.loginId.toLowerCase() === newLoginId.trim().toLowerCase())) {
      showNotice(`User with Login Id "${newLoginId.trim()}" already exists`)
      return
    }

    const assignedAccess =
      newRole === 'admin'
        ? APP_PAGES.join(', ')
        : selectedPages.length > 0
        ? selectedPages.join(', ')
        : 'Inventory'

    const newUser: UserRecord = {
      loginId: newLoginId.trim(),
      password: newPassword,
      name: newName.trim(),
      role: newRole,
      status: newStatus,
      pageAccess: assignedAccess,
    }

    addUser(newUser)
    setNewLoginId('')
    setNewPassword('')
    setNewName('')
    setNewRole('user')
    setNewStatus('Active')
    setSelectedPages(['Inventory', 'Transactions'])
    setShowAddUserModal(false)
  }

  // Calculate items per category and UOM
  const getItemCountByCategory = (cat: string) => {
    return itemMaster.filter((item) => item.category === cat).length
  }

  const getItemCountByUom = (u: string) => {
    return itemMaster.filter((item) => item.uom.toLowerCase() === u.toLowerCase()).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-[#828d9a]">
            <span>System Administration</span>
            <span>/</span>
            <span className="font-semibold text-[#485563]">Master & User Registry</span>
          </div>
          <h2 className="text-[24px] font-bold tracking-tight text-[#182230]">
            Masters & Users Administration
          </h2>
          <p className="mt-0.5 text-[13px] text-[#788492]">
            Configure item master categories, manage plant users and access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'masters' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshData()}
                disabled={isSyncing}
                title="Refresh master categories"
                className="flex items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] shadow-2xs hover:bg-[#f8fafb] transition-all disabled:opacity-60"
              >
                <RefreshCw className={`size-3.5 text-[#17604f] ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => setShowAddCatModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#17604f] px-3.5 py-2 text-[12px] font-semibold text-white shadow-2xs transition-all hover:bg-[#124b3e]"
              >
                <Plus className="size-3.5" />
                Add Category Master
              </button>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshData()}
                disabled={isSyncing}
                title="Refresh users list from cloud"
                className="flex items-center gap-1.5 rounded-lg border border-[#dfe4e8] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] shadow-2xs hover:bg-[#f8fafb] transition-all disabled:opacity-60"
              >
                <RefreshCw className={`size-3.5 text-[#17604f] ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Refreshing...' : 'Refresh Users'}</span>
              </button>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#17604f] px-3.5 py-2 text-[12px] font-semibold text-white shadow-2xs transition-all hover:bg-[#124b3e]"
              >
                <Plus className="size-3.5" />
                Add New User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e5e8ed] pb-px">
        <button
          onClick={() => setActiveTab('masters')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-all ${
            activeTab === 'masters'
              ? 'border-[#17604f] text-[#17604f]'
              : 'border-transparent text-[#64748b] hover:text-[#182230]'
          }`}
        >
          <Layers className="size-4" />
          Master Catalog (Category & UOM)
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
            {categories.length + uoms.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-all ${
            activeTab === 'users'
              ? 'border-[#17604f] text-[#17604f]'
              : 'border-transparent text-[#64748b] hover:text-[#182230]'
          }`}
        >
          <UsersIcon className="size-4" />
          System Users
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
            {users.length}
          </span>
        </button>
      </div>

      {/* TAB 1: MASTERS (Category & UOM) */}
      {activeTab === 'masters' && (
        <div className="space-y-6">
          {/* Category Registry */}
          <div className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f0f2f5]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-[#182230]">Category Registry</h3>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/60">
                    {categories.length} Categories
                  </span>
                </div>
                <p className="text-[12px] text-[#838e9c]">
                  Active master categories for inventory items and transactional classification from Master sheet.
                </p>
              </div>
              <button
                onClick={() => setShowAddCatModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#17604f] px-3 py-1.5 text-[12px] font-semibold text-[#17604f] hover:bg-[#17604f]/5"
              >
                <Plus className="size-3.5" />
                Add Category
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-[#e8ecf1]">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-[#e8ecf1] bg-[#f8fafb] text-[11px] font-semibold uppercase tracking-wider text-[#637083]">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Assigned SKUs in ItemMaster</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f5]">
                  {categories.map((cat, idx) => {
                    const assignedCount = getItemCountByCategory(cat)
                    return (
                      <tr key={cat} className="hover:bg-[#fcfdfd] transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-[#8995a2]">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-[#182230]">
                          <span className="rounded-md bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-200/60 font-medium">
                            {cat}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#5c6877]">
                          {assignedCount} items linked
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete category "${cat}"?`)) {
                                deleteCategory(cat)
                              }
                            }}
                            className="rounded p-1 text-[#8c97a4] hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* UOM Registry */}
          <div className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f0f2f5]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-[#182230]">UOM Registry (Units of Measure)</h3>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200/60">
                    {uoms.length} Units
                  </span>
                </div>
                <p className="text-[12px] text-[#838e9c]">
                  Active measurement units for stock balances, issues, and receipts synchronized from Master sheet.
                </p>
              </div>
              <button
                onClick={() => setShowAddUomModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#17604f] px-3 py-1.5 text-[12px] font-semibold text-[#17604f] hover:bg-[#17604f]/5"
              >
                <Plus className="size-3.5" />
                Add UOM
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-[#e8ecf1]">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-[#e8ecf1] bg-[#f8fafb] text-[11px] font-semibold uppercase tracking-wider text-[#637083]">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Unit of Measure</th>
                    <th className="py-3 px-4">Assigned SKUs in ItemMaster</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f5]">
                  {uoms.map((u, idx) => {
                    const assignedCount = getItemCountByUom(u)
                    return (
                      <tr key={u} className="hover:bg-[#fcfdfd] transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-[#8995a2]">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-[#182230]">
                          <span className="rounded-md bg-blue-50 text-blue-800 px-2 py-0.5 border border-blue-200/60 font-medium">
                            {u}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#5c6877]">
                          {assignedCount} items linked
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete unit "${u}"?`)) {
                                deleteUom(u)
                              }
                            }}
                            className="rounded p-1 text-[#8c97a4] hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete UOM"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#e5e8ed] bg-white p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f0f2f5]">
              <div>
                <h3 className="text-[15px] font-bold text-[#182230]">Plant Users & Role-Based Access</h3>
                <p className="text-[12px] text-[#838e9c]">
                  Manage credentials, assigned roles (<code className="font-mono text-[#182230]">admin</code>, <code className="font-mono text-[#182230]">manager</code>, <code className="font-mono text-[#182230]">user</code>), and granular page permissions.
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#17604f] px-3 py-1.5 text-[12px] font-semibold text-[#17604f] hover:bg-[#17604f]/5"
              >
                <Plus className="size-3.5" />
                Add User
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-[#e8ecf1]">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-[#e8ecf1] bg-[#f8fafb] text-[11px] font-semibold uppercase tracking-wider text-[#637083]">
                    <th className="py-3 px-4">Login Id</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Page Access</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f5]">
                  {users.map((user) => {
                    const isSelf = currentUser?.loginId === user.loginId
                    const roleLower = String(user.role || '').toLowerCase()
                    const isAdmin = roleLower === 'admin'
                    const isManager = roleLower === 'manager'

                    return (
                      <tr key={user.loginId} className="hover:bg-[#fcfdfd] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-[#17604f]">
                            {user.loginId}
                          </span>
                          {isSelf && (
                            <span className="ml-2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#182230]">{user.name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                              isAdmin
                                ? 'bg-emerald-100 text-emerald-800'
                                : isManager
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleUserStatus(user.loginId)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                              user.status === 'Active'
                                ? 'bg-[#eaf5f0] text-[#246c58] hover:bg-[#ddede6]'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            {user.status === 'Active' ? (
                              <>
                                <UserCheck className="size-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="size-3" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {isAdmin ? (
                            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              All Pages (Unrestricted)
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {user.pageAccess ? (
                                String(user.pageAccess)
                                  .split(',')
                                  .map((p) => p.trim())
                                  .filter(Boolean)
                                  .map((p) => (
                                    <span
                                      key={p}
                                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                                    >
                                      {p}
                                    </span>
                                  ))
                              ) : (
                                <span className="text-[11px] text-[#8c97a4] italic">
                                  Default role access
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#717e8c]">
                          ••••••••
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditUser(user)}
                              className="rounded p-1 text-[#8c97a4] hover:bg-[#edf5f2] hover:text-[#17604f] transition-colors"
                              title="Edit user details & permissions"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              disabled={isSelf}
                              onClick={() => {
                                if (confirm(`Remove user "${user.name}" (${user.loginId})?`)) {
                                  deleteUser(user.loginId)
                                }
                              }}
                              className={`rounded p-1 transition-colors ${
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                                  : 'text-[#8c97a4] hover:bg-red-50 hover:text-red-600'
                              }`}
                              title={isSelf ? 'Cannot delete logged in user' : 'Delete user'}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* MODAL: ADD CATEGORY */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2f5]">
              <h3 className="font-bold text-[16px] text-[#182230]">Add Category Master</h3>
              <button
                onClick={() => setShowAddCatModal(false)}
                className="rounded-lg p-1 text-[#838e9c] hover:bg-[#f1f3f5]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic Fluids, Cutting Tools..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[13px] text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                />
                <p className="mt-1 text-[11px] text-[#86929f]">
                  New category will be registered to master records and made available across item creation and transactions.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f0f2f5]">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="rounded-lg border border-[#dfe4e8] px-4 py-2 text-[12px] font-semibold text-[#535f6d] hover:bg-[#f8fafb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#17604f] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#124b3e]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD UOM */}
      {showAddUomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2f5]">
              <h3 className="font-bold text-[16px] text-[#182230]">Add Unit of Measure (UOM)</h3>
              <button
                onClick={() => setShowAddUomModal(false)}
                className="rounded-lg p-1 text-[#838e9c] hover:bg-[#f1f3f5]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUom} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                  Unit Name / Symbol
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. kg, liters, drums, vials, pcs..."
                  value={newUomName}
                  onChange={(e) => setNewUomName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[13px] text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                />
                <p className="mt-1 text-[11px] text-[#86929f]">
                  New UOM will be registered to master records and made available across item creation, stock ledgers, and transactions.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f0f2f5]">
                <button
                  type="button"
                  onClick={() => setShowAddUomModal(false)}
                  className="rounded-lg border border-[#dfe4e8] px-4 py-2 text-[12px] font-semibold text-[#535f6d] hover:bg-[#f8fafb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#17604f] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#124b3e]"
                >
                  Save UOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2f5]">
              <h3 className="font-bold text-[16px] text-[#182230]">Create Plant User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="rounded-lg p-1 text-[#838e9c] hover:bg-[#f1f3f5]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                  Login Id
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. operator2, john_doe"
                  value={newLoginId}
                  onChange={(e) => setNewLoginId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[13px] font-mono text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter login password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[13px] text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[13px] text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                    Role (admin, manager, user)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[12px] font-medium text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                  >
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="user">user</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'Active' | 'Inactive')}
                    className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[12px] font-medium text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Page Access Checkbox Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083] mb-1.5">
                  Page Access Permissions
                </label>
                {newRole === 'admin' ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-800 font-medium">
                    Admin role automatically grants full access across all 7 pages.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#dfe4e8] bg-[#f9fafb] p-3">
                    {APP_PAGES.map((page) => {
                      const isChecked = selectedPages.includes(page)
                      return (
                        <label
                          key={page}
                          className="flex items-center gap-2 text-[12px] font-medium text-[#182230] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePageSelection(page)}
                            className="size-3.5 rounded border-[#c5cdd5] text-[#17604f] focus:ring-[#17604f]"
                          />
                          <span>{page}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
                <p className="mt-1 text-[10px] text-[#86929f]">
                  Stored as comma-separated values in the <code className="font-mono text-emerald-800">Page Access</code> column.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f2f5]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-lg border border-[#dfe4e8] px-4 py-2 text-[12px] font-semibold text-[#535f6d] hover:bg-[#f8fafb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#17604f] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#124b3e]"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2f5]">
              <div>
                <h3 className="font-bold text-[16px] text-[#182230]">Edit User</h3>
                <p className="text-[11px] font-mono text-[#17604f]">Login ID: {editingUser.loginId}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-[#838e9c] hover:bg-[#f1f3f5]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[13px] text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                  Password
                </label>
                <input
                  type="text"
                  placeholder="Update user password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[13px] font-mono text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                    Role (admin, manager, user)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => handleEditRoleChange(e.target.value as UserRole)}
                    className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[12px] font-medium text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                  >
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="user">user</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083]">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                    className="mt-1 w-full rounded-lg border border-[#dfe4e8] px-3 py-2 text-[12px] font-medium text-[#182230] focus:border-[#17604f] focus:outline-hidden"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Page Access Checkbox Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#637083] mb-1.5">
                  Page Access Permissions
                </label>
                {editRole === 'admin' ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-800 font-medium">
                    Admin role automatically grants full access across all 7 pages.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#dfe4e8] bg-[#f9fafb] p-3">
                    {APP_PAGES.map((page) => {
                      const isChecked = editSelectedPages.includes(page)
                      return (
                        <label
                          key={page}
                          className="flex items-center gap-2 text-[12px] font-medium text-[#182230] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleEditPageSelection(page)}
                            className="size-3.5 rounded border-[#c5cdd5] text-[#17604f] focus:ring-[#17604f]"
                          />
                          <span>{page}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f0f2f5]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-[#dfe4e8] px-4 py-2 text-[12px] font-semibold text-[#535f6d] hover:bg-[#f8fafb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#17604f] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#124b3e]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
