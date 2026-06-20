import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type GlassHeaderProps = {
  children: ReactNode;
  /** Render behind the status-bar safe-area inset (default true). */
  withSafeArea?: boolean;
};

/**
 * A sticky header with real backdrop blur (iOS) / translucent fallback (Android),
 * so content scrolls behind a true frosted bar.
 */
export function GlassHeader({ children, withSafeArea = true }: GlassHeaderProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const tint = scheme === 'dark' ? 'dark' : 'light';
  const border = scheme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.4)';

  return (
    <View
      style={[
        styles.bar,
        {
          borderBottomWidth: 0.5,
          borderBottomColor: border,
          paddingTop: withSafeArea ? insets.top + Spacing.two : Spacing.two,
        },
      ]}>
      <BlurView intensity={60} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    overflow: 'hidden',
  },
  inner: {
    position: 'relative',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
