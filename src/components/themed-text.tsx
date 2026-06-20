import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamilies, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextType =
  | 'default'
  | 'title'
  | 'subtitle'
  | 'hero'
  | 'display'
  | 'eyebrow'
  | 'small'
  | 'smallBold'
  | 'link'
  | 'linkPrimary'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  // Resolve color in-component so type-specific accents (eyebrow, linkPrimary)
  // stay theme-aware instead of being hardcoded.
  const color = theme[resolveColorKey(type, themeColor)];

  return (
    <Text
      style={[
        { color },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'hero' && styles.hero,
        type === 'display' && styles.display,
        type === 'eyebrow' && styles.eyebrow,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

function resolveColorKey(type: ThemedTextType, themeColor?: ThemeColor): ThemeColor {
  if (themeColor) return themeColor;
  if (type === 'eyebrow') return 'textTertiary';
  if (type === 'linkPrimary') return 'primary';
  return 'text';
}

const styles = StyleSheet.create({
  default: {
    fontFamily: FontFamilies.medium,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  small: {
    fontFamily: FontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallBold: {
    fontFamily: FontFamilies.bold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  title: {
    fontFamily: FontFamilies.semibold,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: FontFamilies.semibold,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  // Oversized, LIGHT-weight headings — the signature ElevenLabs "premium" look.
  hero: {
    fontFamily: FontFamilies.light,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '300',
    letterSpacing: -0.8,
  },
  display: {
    fontFamily: FontFamilies.light,
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '300',
    letterSpacing: -1.2,
  },
  // Uppercase, tracked-out micro label used as a section eyebrow.
  eyebrow: {
    fontFamily: FontFamilies.bold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  link: {
    fontFamily: FontFamilies.medium,
    lineHeight: 24,
    fontSize: 16,
    fontWeight: '500',
  },
  linkPrimary: {
    fontFamily: FontFamilies.semibold,
    lineHeight: 24,
    fontSize: 16,
    fontWeight: '600',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
