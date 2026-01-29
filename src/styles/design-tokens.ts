// Linear-inspired Design Tokens for Jarvis Task Manager

export const colors = {
  // Background layers (dark theme)
  background: {
    primary: '#0D0D0D',      // Main background
    secondary: '#161616',    // Sidebar, panels
    tertiary: '#1C1C1C',     // Cards, elevated surfaces
    hover: '#242424',        // Hover states
    active: '#2A2A2A',       // Active/selected states
  },

  // Text colors
  text: {
    primary: '#ECECEC',      // Primary text
    secondary: '#A0A0A0',    // Secondary text
    muted: '#6B6B6B',        // Muted/disabled text
    inverse: '#0D0D0D',      // Text on light backgrounds
  },

  // Brand/accent
  accent: {
    primary: '#5E6AD2',      // Linear's purple/indigo
    primaryHover: '#6E7AE2',
    primaryActive: '#4E5AC2',
    secondary: '#4EA8DE',    // Blue accent
  },

  // Status colors (matching Linear)
  status: {
    backlog: '#6B6B6B',      // Gray
    todo: '#E2E2E2',         // White/light gray
    inProgress: '#F2C94C',   // Yellow/amber
    inReview: '#BB87FC',     // Purple
    done: '#4CB782',         // Green
    cancelled: '#6B6B6B',    // Gray
  },

  // Priority colors
  priority: {
    urgent: '#EB5757',       // Red
    high: '#F59E0B',         // Orange
    medium: '#5E6AD2',       // Purple (accent)
    low: '#6B6B6B',          // Gray
    none: '#4A4A4A',         // Darker gray
  },

  // Semantic colors
  semantic: {
    success: '#4CB782',
    warning: '#F2C94C',
    error: '#EB5757',
    info: '#4EA8DE',
  },

  // Borders
  border: {
    default: '#2A2A2A',
    subtle: '#1F1F1F',
    focus: '#5E6AD2',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },

  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const radii = {
  none: '0',
  sm: '4px',
  md: '6px',       // Linear's standard
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 2px 4px rgba(0, 0, 0, 0.4)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.5)',
  xl: '0 8px 16px rgba(0, 0, 0, 0.6)',
  inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
} as const;

export const layout = {
  sidebar: {
    width: '240px',
    collapsedWidth: '56px',
  },
  header: {
    height: '48px',
  },
  card: {
    padding: '12px',
    gap: '8px',
  },
  modal: {
    maxWidth: '560px',
    padding: '24px',
  },
} as const;

export const transitions = {
  fast: '100ms ease',
  normal: '150ms ease',
  slow: '300ms ease',
} as const;

// CSS custom properties generator
export const cssVariables = `
  :root {
    /* Background */
    --bg-primary: ${colors.background.primary};
    --bg-secondary: ${colors.background.secondary};
    --bg-tertiary: ${colors.background.tertiary};
    --bg-hover: ${colors.background.hover};
    --bg-active: ${colors.background.active};

    /* Text */
    --text-primary: ${colors.text.primary};
    --text-secondary: ${colors.text.secondary};
    --text-muted: ${colors.text.muted};

    /* Accent */
    --accent-primary: ${colors.accent.primary};
    --accent-primary-hover: ${colors.accent.primaryHover};
    --accent-secondary: ${colors.accent.secondary};

    /* Status */
    --status-backlog: ${colors.status.backlog};
    --status-todo: ${colors.status.todo};
    --status-in-progress: ${colors.status.inProgress};
    --status-in-review: ${colors.status.inReview};
    --status-done: ${colors.status.done};
    --status-cancelled: ${colors.status.cancelled};

    /* Priority */
    --priority-urgent: ${colors.priority.urgent};
    --priority-high: ${colors.priority.high};
    --priority-medium: ${colors.priority.medium};
    --priority-low: ${colors.priority.low};

    /* Semantic */
    --success: ${colors.semantic.success};
    --warning: ${colors.semantic.warning};
    --error: ${colors.semantic.error};
    --info: ${colors.semantic.info};

    /* Border */
    --border-default: ${colors.border.default};
    --border-subtle: ${colors.border.subtle};
    --border-focus: ${colors.border.focus};

    /* Typography */
    --font-sans: ${typography.fontFamily.sans};
    --font-mono: ${typography.fontFamily.mono};

    /* Radius */
    --radius-sm: ${radii.sm};
    --radius-md: ${radii.md};
    --radius-lg: ${radii.lg};

    /* Layout */
    --sidebar-width: ${layout.sidebar.width};
    --sidebar-collapsed: ${layout.sidebar.collapsedWidth};
    --header-height: ${layout.header.height};

    /* Transitions */
    --transition-fast: ${transitions.fast};
    --transition-normal: ${transitions.normal};
  }
`;
