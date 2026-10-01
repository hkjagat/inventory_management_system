import {
  UserRecord,
  ItemMasterRecord,
  IncomingRecord,
  OutgoingRecord,
  PlantAlert,
} from './types'

// Default system administrators
export const initialUsers: UserRecord[] = [
  {
    loginId: 'adm',
    password: 'admin@123',
    name: 'Admin',
    role: 'admin',
    status: 'Active',
    pageAccess: 'all',
  },
]

// Master categories and units of measure
export const initialCategories: string[] = [
  'Consumable',
  'Lubricants and Oil',
  'Welding and Cutting',
  'Tooling and Abrasives',
  'PPE and Plant Safety',
  'Chemicals and Solvents',
  'Tapes and Cleanroom',
]

export const initialUoms: string[] = [
  'Nos',
  'Boxes',
  'Kgs',
  'Mtrs',
  'Rolls',
  'Pcs',
  'Ltrs',
  'Packes',
]

// Item master registry
export const initialItemMaster: ItemMasterRecord[] = []

// Inbound receipts ledger
export const initialIncoming: IncomingRecord[] = []

// Outbound issues ledger
export const initialOutgoing: OutgoingRecord[] = []

export const initialAlerts: PlantAlert[] = []
