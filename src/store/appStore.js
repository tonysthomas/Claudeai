import { create } from 'zustand'

const initialUploadedData = {
  transactions: null,
  budget: null,
  payroll: null,
  vendors: null,
}

export const useAppStore = create((set) => ({
  // Uploaded file data (4 types)
  uploadedData: { ...initialUploadedData },
  uploadedMeta: {
    transactions: null,
    budget: null,
    payroll: null,
    vendors: null,
  },

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
    set({ uploadedData: { ...initialUploadedData } }),

  // Global period selection
  selectedPeriod: 'Q1 2025',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  // Organisation name
  orgName: 'Acme Corporation',
  setOrgName: (name) => set({ orgName: name }),

  // Agent status indicators
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

  // Active navigation section
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
}))
