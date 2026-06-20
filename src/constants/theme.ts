/**
 * Design tokens for QualiTea.
 *
 * The palette and visual language are inspired by ElevenLabs ("Apple-like"):
 * a warm off-white "eggshell" canvas in light mode, a near-black navy in dark
 * mode, a vivid blue primary, warm (not neutral) grays, oversized light-weight
 * headings, soft-shadowed cards with large radii, and frosted-glass surfaces.
 *
 * The original template keys (text, background, backgroundElement,
 * backgroundSelected, textSecondary) are preserved so existing components keep
 * working; the new semantic keys (surface, primary, border, glass, ...) are
 * preferred for new code.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Legacy keys (kept for backward compatibility with template components)
    text: '#090F15',
    background: '#F5F3F1', // warm eggshell
    backgroundElement: '#FAFAFA',
    backgroundSelected: '#E8E8E8',
    textSecondary: '#777169',
    // New semantic keys
    surface: '#FFFFFF',
    surfaceMuted: '#FAFAFA',
    primary: '#2B7FFF',
    primaryHover: '#193CB8',
    primarySoft: '#DBE7FF',
    secondaryAccent: '#B743C6',
    textTertiary: '#A59F97',
    border: '#E8E8E8',
    glass: 'rgba(255,255,255,0.70)',
    success: '#10B978',
    danger: '#FA675B',
    warning: '#FBBE45',
  },
  dark: {
    // Legacy keys
    text: '#FFFFFF',
    background: '#090F15', // near-black navy
    backgroundElement: '#111824',
    backgroundSelected: '#1A2230',
    textSecondary: '#A59F97',
    // New semantic keys
    surface: '#111824',
    surfaceMuted: '#0F1620',
    primary: '#2B7FFF',
    primaryHover: '#3679FF',
    primarySoft: 'rgba(43,127,255,0.18)',
    secondaryAccent: '#B743C6',
    textTertiary: '#6B6760',
    border: 'rgba(255,255,255,0.10)',
    glass: 'rgba(20,28,40,0.70)',
    success: '#10B978',
    danger: '#FA675B',
    warning: '#FBBE45',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorScheme = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * Font family names for the loaded Inter font. On native these resolve to the
 * per-weight families registered by `@expo-google-fonts/inter` in
 * `src/app/_layout.tsx`; on web they fall back to the CSS variables in
 * `src/global.css` (which already include Inter). Prefer these over raw
 * `fontWeight` so custom fonts render at the correct weight on every platform.
 */
export const FontFamilies = Platform.select({
  default: {
    light: 'Inter_300Light',
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  web: {
    light: 'var(--font-display)',
    regular: 'var(--font-display)',
    medium: 'var(--font-display)',
    semibold: 'var(--font-display)',
    bold: 'var(--font-display)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Corner radii — large and soft, the ElevenLabs signature. */
export const Radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 24,
  hero: 32,
  pill: 9999,
} as const;

/** Motion durations (ms): fast press feedback, gentle entrances, ambient loops. */
export const Motion = {
  pressMs: 150,
  enterMs: 600,
  slowMs: 1000,
} as const;

/**
 * Soft, low-opacity shadows. On iOS uses shadow* props; on Android uses
 * `elevation`. Pair with a hairline `borderColor: Colors.<scheme>.border` for
 * the resting card look.
 */
export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  lifted: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Soft mesh gradient backdrop: overlapping radial blobs in lavender, periwinkle,
 * coral, peach, and dusty rose — blended organically with a fine noise overlay.
 */
export const Gradients = {
  light: ['#9B8EC0', '#6B83C2', '#E8A87C'],
  dark: ['#1A1525', '#0F1A2E', '#1E1210'],
} as const;

/** Mesh blobs — each position acts like a radial gradient "color splash". */
export const Blooms = {
  light: [
    { color: '#B8A8D4', at: { x: 0.15, y: 0.18 }, radius: 0.45 }, // lavender / upper-left
    { color: '#7791B8', at: { x: 0.35, y: 0.45 }, radius: 0.40 }, // periwinkle / middle-left
    { color: '#C97B6B', at: { x: 0.25, y: 0.75 }, radius: 0.38 }, // coral / bottom-left
    { color: '#F0B585', at: { x: 0.70, y: 0.72 }, radius: 0.42 }, // peach / bottom-center
    { color: '#D9A094', at: { x: 0.80, y: 0.30 }, radius: 0.38 }, // dusty rose / middle-right
  ],
  dark: [
    { color: '#2D1B38', at: { x: 0.15, y: 0.18 }, radius: 0.45 },
    { color: '#1A2A3E', at: { x: 0.35, y: 0.45 }, radius: 0.40 },
    { color: '#3A1A18', at: { x: 0.25, y: 0.75 }, radius: 0.38 },
    { color: '#4A2A18', at: { x: 0.70, y: 0.72 }, radius: 0.42 },
    { color: '#3A2028', at: { x: 0.80, y: 0.30 }, radius: 0.38 },
  ],
} as const;

