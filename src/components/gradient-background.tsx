import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Blooms, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Variant = 'light' | 'dark';

/**
 * The app's colorful backdrop: a diagonal multi-hue gradient with two soft
 * "bloom" gradients layered on top for a mesh-like, vibrant feel. Content
 * (frosted-glass panels) renders above it.
 */
export function GradientBackground({
  children,
  variant,
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  const scheme = useColorScheme();
  const key: Variant = variant ?? (scheme === 'dark' ? 'dark' : 'light');
  const colors = Gradients[key];
  const blooms = Blooms[key];

  return (
    <View style={styles.fill}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {blooms.map((b, i) => (
        <LinearGradient
          key={i}
          colors={[b.color, 'transparent']}
          start={{ x: b.at.x > 0.5 ? 1 : 0, y: b.at.y > 0.5 ? 1 : 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
        />
      ))}
      <View style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
