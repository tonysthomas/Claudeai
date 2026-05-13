// Shared config for all 5 FROZEN categories.
// Imported by CategoryCards, EmployeeTable, and Analytics.

export const CATEGORY_CONFIG = {
  STAR: {
    label: 'Star',
    emoji: '⭐',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.28)',
  },
  LEARNER: {
    label: 'Learner',
    emoji: '📗',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.28)',
  },
  PERFORMER: {
    label: 'Performer',
    emoji: '💪',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.28)',
  },
  NEEDS_SUPPORT: {
    label: 'Needs Support',
    emoji: '🔴',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.28)',
  },
  MISSING_DATA: {
    label: 'Missing Data',
    emoji: '⚫',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.28)',
  },
}

// Display order for cards and dropdowns
export const CATEGORY_ORDER = ['STAR', 'LEARNER', 'PERFORMER', 'NEEDS_SUPPORT', 'MISSING_DATA']
