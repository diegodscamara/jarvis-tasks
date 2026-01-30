export type ThemeVariant =
  | 'default'
  | 'dark'
  | 'light'
  | 'midnight'
  | 'linear-purple'
  | 'linear-blue'

export interface Theme {
  name: string
  variant: ThemeVariant
  cssClass: string
  colors: {
    // Linear-style color system
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    border: string
    input: string
    ring: string
    // Linear-specific
    highlight: string
    highlightForeground: string
    selection: string
    selectionForeground: string
    brand: string
    brandForeground: string
  }
}

// Linear-style purple theme
export const linearPurpleTheme: Theme = {
  name: 'Linear Purple',
  variant: 'linear-purple',
  cssClass: 'linear-purple',
  colors: {
    background: '249 52% 6%',
    foreground: '237 23% 93%',
    card: '249 52% 8%',
    cardForeground: '237 23% 93%',
    popover: '249 52% 10%',
    popoverForeground: '237 23% 93%',
    primary: '252 87% 57%', // Linear purple
    primaryForeground: '0 0% 100%',
    secondary: '247 47% 15%',
    secondaryForeground: '237 23% 93%',
    muted: '247 47% 15%',
    mutedForeground: '237 13% 63%',
    accent: '252 87% 57%',
    accentForeground: '0 0% 100%',
    destructive: '0 62% 30%',
    destructiveForeground: '0 0% 98%',
    border: '247 47% 12%',
    input: '247 47% 15%',
    ring: '252 87% 57%',
    highlight: '252 87% 57%',
    highlightForeground: '0 0% 100%',
    selection: '252 87% 20%',
    selectionForeground: '252 87% 80%',
    brand: '252 87% 57%',
    brandForeground: '0 0% 100%',
  },
}

// Linear-style blue theme
export const linearBlueTheme: Theme = {
  name: 'Linear Blue',
  variant: 'linear-blue',
  cssClass: 'linear-blue',
  colors: {
    background: '216 50% 6%',
    foreground: '213 27% 93%',
    card: '216 50% 8%',
    cardForeground: '213 27% 93%',
    popover: '216 50% 10%',
    popoverForeground: '213 27% 93%',
    primary: '206 100% 50%', // Linear blue
    primaryForeground: '0 0% 100%',
    secondary: '215 48% 15%',
    secondaryForeground: '213 27% 93%',
    muted: '215 48% 15%',
    mutedForeground: '215 13% 63%',
    accent: '206 100% 50%',
    accentForeground: '0 0% 100%',
    destructive: '0 62% 30%',
    destructiveForeground: '0 0% 98%',
    border: '215 48% 12%',
    input: '215 48% 15%',
    ring: '206 100% 50%',
    highlight: '206 100% 50%',
    highlightForeground: '0 0% 100%',
    selection: '206 100% 20%',
    selectionForeground: '206 100% 80%',
    brand: '206 100% 50%',
    brandForeground: '0 0% 100%',
  },
}

// Midnight theme (ultra dark)
export const midnightTheme: Theme = {
  name: 'Midnight',
  variant: 'midnight',
  cssClass: 'midnight',
  colors: {
    background: '240 10% 3%',
    foreground: '0 0% 95%',
    card: '240 10% 5%',
    cardForeground: '0 0% 95%',
    popover: '240 10% 7%',
    popoverForeground: '0 0% 95%',
    primary: '0 0% 95%',
    primaryForeground: '240 10% 3%',
    secondary: '240 5% 12%',
    secondaryForeground: '0 0% 95%',
    muted: '240 5% 12%',
    mutedForeground: '240 5% 60%',
    accent: '240 5% 15%',
    accentForeground: '0 0% 95%',
    destructive: '0 62% 30%',
    destructiveForeground: '0 0% 98%',
    border: '240 5% 10%',
    input: '240 5% 12%',
    ring: '240 5% 60%',
    highlight: '240 5% 20%',
    highlightForeground: '0 0% 95%',
    selection: '240 20% 15%',
    selectionForeground: '0 0% 95%',
    brand: '0 0% 95%',
    brandForeground: '240 10% 3%',
  },
}

export const themes: Theme[] = [linearPurpleTheme, linearBlueTheme, midnightTheme]

export function getThemeByVariant(variant: ThemeVariant): Theme | undefined {
  return themes.find((theme) => theme.variant === variant)
}
