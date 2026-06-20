import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { FontFamilies, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PillButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Pill-shaped button. `primary` is the vivid blue CTA (expects white text);
 * `secondary` is a quiet surface button; `ghost` is borderless primary text.
 */
export function PillButton({
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  children,
  ...rest
}: PillButtonProps) {
  const theme = useTheme();

  const palette = {
    primary: { bg: theme.primary, fg: '#FFFFFF' },
    secondary: { bg: theme.surfaceMuted, fg: theme.text },
    ghost: { bg: 'transparent', fg: theme.primary },
  }[variant];

  const padding =
    size === 'lg'
      ? { paddingVertical: Spacing.three, paddingHorizontal: Spacing.five }
      : { paddingVertical: Spacing.two, paddingHorizontal: Spacing.four };

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: palette.bg,
          borderRadius: Radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.one,
          ...padding,
          opacity: disabled ? 0.5 : 1,
        },
        pressed && !disabled && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        style,
      ]}
      {...rest}>
      {children}
    </Pressable>
  );
}

/** Bold button label in the correct color for the variant. */
export function ButtonLabel({
  children,
  variant = 'primary',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const theme = useTheme();
  const color = variant === 'primary' ? '#FFFFFF' : variant === 'ghost' ? theme.primary : theme.text;
  return <Text style={StyleSheet.flatten([styles.label, { color }])}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamilies.bold,
    fontWeight: '700',
    fontSize: 16,
  },
});
