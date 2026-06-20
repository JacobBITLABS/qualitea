import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export type MapPinProps = {
  label: string;
  hint?: string;
  onPress?: () => void;
  variant?: 'filled' | 'plain';
};

/** Small pill showing a place name / coordinates with a pin glyph. */
export function MapPin({ label, hint, onPress, variant = 'filled' }: MapPinProps) {
  const theme = useTheme();

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: variant === 'filled' ? theme.surfaceMuted : 'transparent',
          borderColor: theme.border,
        },
      ]}>
      <SymbolView
        name={{ ios: 'mappin.and.ellipse', android: 'place', web: 'place' }}
        size={14}
        tintColor={theme.primary}
        weight="semibold"
      />
      <View style={styles.textCol}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 0.5,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  textCol: {
    flexShrink: 1,
  },
});
