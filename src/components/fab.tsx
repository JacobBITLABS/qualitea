import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import { FontFamilies, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export type FabProps = Omit<PressableProps, 'children' | 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** SF Symbol name. Provide { ios, android, web } or a plain string. */
  icon?: { ios: string; android?: string; web?: string } | string;
  label?: string;
  children?: ReactNode;
};

/**
 * Floating action button. With a `label` it becomes an extended pill; without
 * one it is a circular icon button. Native-only surface (capture affordance).
 */
export function Fab({ icon, label, children, style, ...rest }: FabProps) {
  const theme = useTheme();
  const extended = Boolean(label);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: theme.primary },
        extended ? styles.extended : styles.circular,
        pressed && { transform: [{ scale: 0.96 }], opacity: 0.92 },
        style,
      ]}
      {...rest}>
      {children ?? (
        <View style={styles.content}>
          {icon && (
            <SymbolView
              name={icon as never}
              size={24}
              tintColor="#FFFFFF"
              weight="semibold"
            />
          )}
          {label && <ThemedText style={styles.label}>{label}</ThemedText>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    ...Shadows.lifted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circular: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
  },
  extended: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.pill,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: FontFamilies.bold,
    fontSize: 16,
    fontWeight: '700',
  },
});
