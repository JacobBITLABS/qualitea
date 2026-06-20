import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/utils/format';

/** Inline audio playback row with a progress bar. */
export function AudioPlayer({ uri, durationMs }: { uri: string; durationMs?: number | null }) {
  const theme = useTheme();
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  // AudioStatus reports time in seconds; convert to ms for formatDuration.
  const durMs = status.duration ? status.duration * 1000 : durationMs ?? 0;
  const posMs = (status.currentTime || 0) * 1000;
  const progress = durMs > 0 ? Math.min(1, posMs / durMs) : 0;

  return (
    <View style={[styles.row, { backgroundColor: theme.surfaceMuted }]}>
      <Pressable
        onPress={() => (status.playing ? player.pause() : player.play())}
        style={[styles.playBtn, { backgroundColor: theme.primary }]}>
        <SymbolView
          name={
            status.playing
              ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
              : ({ ios: 'play.fill', android: 'play_arrow', web: 'play' } as never)
          }
          size={18}
          tintColor="#FFFFFF"
        />
      </Pressable>
      <View style={styles.info}>
        <View style={[styles.track, { backgroundColor: theme.border }]}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontVariant: ['tabular-nums'] }}>
          {formatDuration(posMs)} / {formatDuration(durMs)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
