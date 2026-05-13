import { create } from 'zustand'

const DATA_KEYS = ['staff', 'sales', 'training', 'knowledge']

const emptyUploads = () =>
  Object.fromEntries(DATA_KEYS.map((k) => [k, null]))

export const useAppStore = create((set, get) => ({
  // ── Uploaded file data ──────────────────────────────────────────────────────
  // Keys: staff | sales | training | knowledge
  // Each value is the parsed row array, or null if not yet uploaded
  uploadedData: emptyUploads(),

  // Metadata per file type: { fileName, rowCount, period, uploadedAt, columns }
  uploadedMeta: emptyUploads(),

  setUploadedData: (type, data, meta = null) =>
    set((state) => ({
      uploadedData: { ...state.uploadedData, [type]: data },
      uploadedMeta: { ...state.uploadedMeta, [type]: meta },
    })),

  clearUploadedData: (type) =>
    set((state) => ({
      uploadedData: { ...state.uploadedData, [type]: null },
      uploadedMeta: { ...state.uploadedMeta, [type]: null },
    })),

  clearAllData: () =>
    set({ uploadedData: emptyUploads(), uploadedMeta: emptyUploads() }),

  // Derived: how many of the 4 types are loaded
  uploadedCount: () => DATA_KEYS.filter((k) => get().uploadedData[k] !== null).length,
  allUploaded: () => DATA_KEYS.every((k) => get().uploadedData[k] !== null),

  // ── Global period selection ─────────────────────────────────────────────────
  selectedPeriod: 'Q1 2025',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  // ── Organisation name ───────────────────────────────────────────────────────
  orgName: 'Acme Corporation',
  setOrgName: (name) => set({ orgName: name }),

  // ── Agent status indicators ─────────────────────────────────────────────────
  agentStatus: {
    dataAgent: 'idle',
    analyticsAgent: 'idle',
    alertAgent: 'idle',
    reportAgent: 'idle',
  },
  setAgentStatus: (agentKey, status) =>
    set((state) => ({
      agentStatus: { ...state.agentStatus, [agentKey]: status },
    })),

  // ── Active navigation page ──────────────────────────────────────────────────
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
}))
