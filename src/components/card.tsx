import { Pressable, type ViewProps } from 'react-native';

import { GlassPanel } from '@/components/glass-panel';
import { Radius } from '@/constants/theme';

export type CardProps = ViewProps & {
  onPress?: () => void;
  /** Blur intensity; 'muted' cards use a touch more frost. */
  variant?: 'surface' | 'muted';
  intensity?: number;
  radius?: number;
};

/**
 * Frosted-glass card. Pass `onPress` to make it tappable (subtle press scale).
 */
export function Card({
  onPress,
  variant = 'surface',
  intensity,
  radius = Radius.card,
  style,
  children,
  ...rest
}: CardProps) {
  const resolvedIntensity = intensity ?? (variant === 'muted' ? 60 : 40);

  const panel = (
    <GlassPanel intensity={resolvedIntensity} radius={radius} style={style}>
      {children}
    </GlassPanel>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => (pressed ? { transform: [{ scale: 0.985 }], opacity: 0.96 } : undefined)}
        {...rest}>
        {panel}
      </Pressable>
    );
  }

  return panel;
}
