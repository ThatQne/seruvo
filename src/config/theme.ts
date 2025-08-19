// Easily configurable grayscale dark theme with pastel accent support
// To change the theme, just update the values below
export const theme = {
  mode: 'dark', // 'dark' or 'light'
  grayscale: {
    background: '#101010', // main background
    surface: '#181818',    // cards, modals, etc
    border: '#232323',
    foreground: '#ededed', // main text
    muted: '#b0b0b0',      // secondary text
    subtle: '#2a2a2a',     // subtle backgrounds
  },
  accent: {
    blue: '#a3bffa',   // pastel blue
    green: '#b9fbc0',  // pastel green
    pink: '#f7c6ff',   // pastel pink
    yellow: '#fff5ba', // pastel yellow
    purple: '#d6bcfa', // pastel purple
    orange: '#ffd6a5', // pastel orange
  },
  font: {
    sans: 'var(--font-outfit), Arial, Helvetica, sans-serif',
  },
};

// Example usage:
// import { theme } from '@/config/theme';
// style={{ background: theme.grayscale.background, color: theme.grayscale.foreground }}
