import { RecordingPresets, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ButtonLabel, PillButton } from '@/components/pill-button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { uuid } from '@/data/id';
import { useTheme } from '@/hooks/use-theme';
import type { PendingMedia } from './types';

type Phase = 'idle' | 'recording' | 'review';

export function VoiceRecorder({
  visible,
  onClose,
  onCapture,
}: {
  visible: boolean;
  onClose: () => void;
  onCapture: (item: PendingMedia) => void;
}) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const [phase, setPhase] = useState<Phase>('idle');
  const [denied, setDenied] = useState(false);

  // `uri` lives on the recorder instance (RecorderState from the hook does not
  // expose it).
  const clipUri = phase === 'review' && recorder.uri ? recorder.uri : undefined;
  const player = useAudioPlayer(clipUri);
  const playStatus = useAudioPlayerStatus(player);

  const start = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setDenied(true);
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase('recording');
  };

  const stop = async () => {
    await recorder.stop();
    setPhase('review');
  };

  const keep = () => {
    if (recorder.uri) {
      onCapture({
        id: uuid(),
        kind: 'audio',
        tempUri: recorder.uri,
        durationMs: recState.durationMillis,
        mime: 'audio/m4a',
      });
    }
    setPhase('idle');
    onClose();
  };

  const redo = async () => {
    player.pause?.();
    setPhase('idle');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
        <View style={styles.handle} />

        {denied ? (
          <PermissionBlocked
            onRetry={() => setDenied(false)}
          />
        ) : phase === 'review' ? (
          <ReviewControls
            durationMs={recState.durationMillis}
            playing={playStatus.playing}
            onTogglePlay={() => (playStatus.playing ? player.pause() : player.play())}
            onRedo={redo}
            onKeep={keep}
          />
        ) : (
          <RecordControls
            recording={phase === 'recording'}
            durationMs={recState.durationMillis}
            onStart={start}
            onStop={stop}
          />
        )}
      </View>
    </Modal>
  );
}

function RecordControls({
  recording,
  durationMs,
  onStart,
  onStop,
}: {
  recording: boolean;
  durationMs: number;
  onStart: () => void;
  onStop: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.body}>
      <ThemedText type="subtitle">{recording ? 'Recording…' : 'Voice note'}</ThemedText>
      <ThemedText type="hero" style={{ fontVariant: ['tabular-nums'] }}>
        {formatTime(durationMs)}
      </ThemedText>
      <Pressable
        onPress={recording ? onStop : onStart}
        style={[styles.recordBtn, recording && { backgroundColor: theme.danger }]}>
        <SymbolView
          name={recording ? { ios: 'stop.fill', android: 'stop', web: 'square' } : { ios: 'mic.fill', android: 'mic', web: 'mic' }}
          size={28}
          tintColor="#FFFFFF"
        />
      </Pressable>
      <ThemedText type="small" themeColor="textSecondary">
        {recording ? 'Tap to stop' : 'Tap to start'}
      </ThemedText>
    </View>
  );
}

function ReviewControls({
  durationMs,
  playing,
  onTogglePlay,
  onRedo,
  onKeep,
}: {
  durationMs: number;
  playing: boolean;
  onTogglePlay: () => void;
  onRedo: () => void;
  onKeep: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.body}>
      <ThemedText type="subtitle">Review</ThemedText>
      <View style={styles.reviewRow}>
        <Pressable onPress={onTogglePlay} style={[styles.playBtn, { backgroundColor: theme.primary }]}>
          <SymbolView
            name={playing ? { ios: 'pause.fill', android: 'pause', web: 'pause' } : { ios: 'play.fill', android: 'play_arrow', web: 'play' } as never}
            size={20}
            tintColor="#FFFFFF"
          />
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontVariant: ['tabular-nums'] }}>
          {formatTime(durationMs)}
        </ThemedText>
      </View>
      <View style={styles.reviewActions}>
        <PillButton variant="secondary" onPress={onRedo}>
          <ButtonLabel variant="secondary">Re-record</ButtonLabel>
        </PillButton>
        <PillButton onPress={onKeep}>
          <ButtonLabel>Keep</ButtonLabel>
        </PillButton>
      </View>
    </View>
  );
}

function PermissionBlocked({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.body}>
      <SymbolView name={{ ios: 'mic.slash', android: 'mic_off', web: 'mic-off' } as never} size={32} tintColor={theme.primary} />
      <ThemedText type="subtitle">Microphone access needed</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        Enable microphone access to record voice notes.
      </ThemedText>
      <View style={{ flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two }}>
        <PillButton variant="secondary" onPress={onRetry}>
          <ButtonLabel variant="secondary">Retry</ButtonLabel>
        </PillButton>
        <PillButton onPress={() => Linking.openSettings()}>
          <ButtonLabel>Open Settings</ButtonLabel>
        </PillButton>
      </View>
    </View>
  );
}

function formatTime(ms: number): string {
  const total = Math.floor((ms || 0) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radius.hero,
    borderTopRightRadius: Radius.hero,
    paddingBottom: 40,
    paddingHorizontal: Spacing.five,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120,120,128,0.3)',
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
  body: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.four,
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2B7FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
});
