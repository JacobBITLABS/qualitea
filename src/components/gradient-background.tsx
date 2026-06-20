import { LinearGradient, RadialGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Blooms, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Variant = 'light' | 'dark';

// SVG noise pattern as a data URI — fine film-grain texture.
const noiseSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/></filter>
<rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>`;
const noiseUri = `data:image/svg+xml;charset UTF-8,${encodeURIComponent(noiseSvg)}`;

/**
 * The app's colorful backdrop: a diagonal multi-hue gradient with radial color
 * blobs layered on top for an organic mesh feel, topped with a fine noise texture.
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
      {/* Base gradient */}
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Mesh blobs */}
      {blooms.map((b, i) => (
        <RadialGradient
          key={i}
          colors={[b.color, 'transparent']}
          cx={b.at.x}
          cy={b.at.y}
          r={b.radius}
          style={StyleSheet.absoluteFill}
        />
      ))}

      {/* Noise texture overlay — fine film grain */}
      <Image
        source={{ uri: noiseUri }}
        style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
        resizeMode="repeat"
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
