import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { Radius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type GlassPanelProps = ViewProps & {
  /** Blur strength 1–100 (iOS). */
  intensity?: number;
  /** Corner radius. */
  radius?: number;
  /** Override the frost tint; defaults from the color scheme. */
  tint?: 'light' | 'dark';
  /** Style for the content wrapper (e.g. to center an icon in a fixed-size panel). */
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Frosted-glass surface: a real backdrop `BlurView` over whatever is behind it,
 * layered with a translucent veil (so it still reads as "frosted" on Android,
 * where backdrop blur isn't available) and a hairline highlight border.
 */
export function GlassPanel({
  intensity = 45,
  radius = Radius.card,
  tint,
  style,
  contentStyle,
  children,
  ...rest
}: GlassPanelProps) {
  const scheme = useColorScheme();
  const resolvedTint = tint ?? (scheme === 'dark' ? 'dark' : 'light');
  const veil = resolvedTint === 'dark' ? 'rgba(12,16,26,0.32)' : 'rgba(255,255,255,0.30)';
  const border = resolvedTint === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.50)';

  return (
    <View
      style={[{ borderRadius: radius, borderWidth: 0.5, borderColor: border, overflow: 'hidden', ...Shadows.card }, style]}
      {...rest}>
      <BlurView intensity={intensity} tint={resolvedTint} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: veil }]} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    position: 'relative',
  },
});
