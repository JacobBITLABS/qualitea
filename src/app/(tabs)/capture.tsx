import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel } from '@/components/glass-panel';
import type { PendingMedia } from '@/components/capture/types';
import { VoiceRecorder } from '@/components/capture/voice-recorder';
import { MapPin } from '@/components/map-pin';
import { ButtonLabel, PillButton } from '@/components/pill-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { defaultExtensionFor, extFromUri, persistMediaFile } from '@/data/files';
import { uuid } from '@/data/id';
import { addMedia } from '@/data/media';
import { createNote } from '@/data/notes';
import { useCaptureLocation } from '@/hooks/use-capture-location';
import { useProjectsList } from '@/hooks/use-projects-list';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/utils/format';

type Facing = 'front' | 'back';
type Flash = 'on' | 'off' | 'auto';

type Captured = {
  kind: 'photo' | 'video';
  tempUri: string;
  width?: number;
  height?: number;
  durationMs?: number;
};

export default function CaptureScreen() {
  // Capture is a native-only surface; web is read/review only.
  if (Platform.OS === 'web') return <Redirect href="/" />;
  return <CaptureNative />;
}

function CaptureNative() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const { projects } = useProjectsList();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<Facing>('back');
  const [flash, setFlash] = useState<Flash>('off');

  // Destination project for the next "snap".
  const [projectId, setProjectId] = useState<string | null>(params.projectId ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Post-capture composer.
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<PendingMedia | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const { location, capture: captureLocation, status: locStatus } = useCaptureLocation();

  // Video (hold-to-record) state.
  const recordingRef = useRef(false);
  const recordStart = useRef(0);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!projectId && projects.length > 0) setProjectId(projects[0].id);
  }, [projectId, projects]);

  // Silently grab location only if permission is already granted (no surprise prompt).
  useEffect(() => {
    (async () => {
      try {
        const p = await Location.getForegroundPermissionsAsync();
        if (p.granted) captureLocation();
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const granted = permission?.granted ?? false;
  const selectedProject = projects.find((p) => p.id === projectId) ?? null;

  const takePhoto = async () => {
    if (!ready || !cameraRef.current || recordingRef.current) return;
    const pic = await cameraRef.current.takePictureAsync({ quality: 1 });
    setCaptured({ kind: 'photo', tempUri: pic.uri, width: pic.width, height: pic.height });
  };

  const startVideo = async () => {
    if (!ready || !cameraRef.current) return;
    recordingRef.current = true;
    recordStart.current = Date.now();
    setRecording(true);
    try {
      const res = await cameraRef.current.recordAsync({ maxDuration: 300 });
      if (res?.uri) {
        setCaptured({ kind: 'video', tempUri: res.uri, durationMs: Date.now() - recordStart.current });
      }
    } finally {
      setRecording(false);
    }
  };

  const onShutterPress = () => takePhoto();
  const onShutterLong = () => startVideo();
  const onShutterOut = () => {
    if (recordingRef.current) {
      recordingRef.current = false;
      cameraRef.current?.stopRecording();
    }
  };

  const resetComposer = () => {
    setCaptured(null);
    setText('');
    setVoice(null);
  };

  const onSave = async () => {
    if (!captured || !projectId || saving) return;
    setSaving(true);
    try {
      const note = await createNote(db, {
        project_id: projectId,
        title: text.trim().slice(0, 60) || (captured.kind === 'video' ? 'Video note' : 'Photo note'),
        text_body: text.trim() || null,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        accuracy_m: location?.accuracy_m ?? null,
        altitude_m: location?.altitude_m ?? null,
        place_name: location?.place_name ?? null,
        location_captured_at: location?.captured_at ?? null,
      });

      const items: Array<{
        kind: 'photo' | 'video' | 'audio';
        tempUri: string;
        mime?: string;
        durationMs?: number;
        width?: number;
        height?: number;
      }> = [
        {
          kind: captured.kind,
          tempUri: captured.tempUri,
          mime: captured.kind === 'video' ? 'video/quicktime' : 'image/jpeg',
          durationMs: captured.durationMs,
          width: captured.width,
          height: captured.height,
        },
      ];
      if (voice) items.push({ kind: 'audio', tempUri: voice.tempUri, mime: 'audio/m4a', durationMs: voice.durationMs });

      for (const m of items) {
        const ext = extFromUri(m.tempUri, defaultExtensionFor(m.kind));
        const persisted = await persistMediaFile({
          tempUri: m.tempUri,
          projectId,
          noteId: note.id,
          mediaId: uuid(),
          kind: m.kind,
          ext,
        });
        await addMedia(db, {
          note_id: note.id,
          kind: m.kind,
          file_path: persisted.file_path,
          mime_type: m.mime ?? null,
          duration_ms: m.durationMs ?? null,
          width: m.width ?? null,
          height: m.height ?? null,
          byte_size: persisted.byte_size,
        });
      }

      resetComposer();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1200);
    } finally {
      setSaving(false);
    }
  };

  const locLabel = location
    ? location.place_name ?? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    : locStatus === 'denied'
      ? 'Location off'
      : 'Add location';

  return (
    <View style={styles.screen}>
      {granted ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
          videoQuality="1080p"
          onCameraReady={() => setReady(true)}
          onMountError={() => setReady(false)}
        />
      ) : null}

      {/* Top chrome */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <GlassIconButton name={{ ios: 'xmark', android: 'close', web: 'close' }} onPress={() => router.back()} />
        <Pressable
          onPress={() => projects.length > 0 && setPickerOpen(true)}
          style={({ pressed }) => pressed && { opacity: 0.8 }}>
          <GlassPanel intensity={50} radius={Radius.pill} style={styles.destPill} contentStyle={styles.destPillContent}>
            <View style={[styles.swatch, { backgroundColor: selectedProject?.color_hex ?? '#FFFFFF' }]} />
            <ThemedText type="smallBold" numberOfLines={1} style={{ maxWidth: 140 }}>
              {selectedProject?.name ?? 'Pick project'}
            </ThemedText>
            <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'chevron-down' } as never} size={12} tintColor={theme.textSecondary} />
          </GlassPanel>
        </Pressable>
        <Pressable onPress={captureLocation} style={({ pressed }) => pressed && { opacity: 0.8 }}>
          <GlassPanel intensity={50} radius={Radius.pill} style={styles.locPill} contentStyle={styles.locPillContent}>
            <SymbolView name={{ ios: 'location.fill', android: 'my_location', web: 'map-pin' } as never} size={13} tintColor={theme.primary} />
            <ThemedText type="smallBold" numberOfLines={1}>
              {locLabel}
            </ThemedText>
          </GlassPanel>
        </Pressable>
      </View>

      {/* Center hint */}
      {!captured && !recording && granted && (
        <View pointerEvents="none" style={styles.hintWrap}>
          <GlassPanel intensity={30} radius={Radius.pill} style={styles.hintPill} contentStyle={styles.hintContent}>
            <ThemedText type="small">Tap for photo · Hold for video</ThemedText>
          </GlassPanel>
        </View>
      )}

      {recording && (
        <View pointerEvents="none" style={styles.recBadgeWrap}>
          <GlassPanel intensity={40} radius={Radius.pill} style={styles.recBadge} contentStyle={styles.recContent}>
            <View style={styles.recDot} />
            <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
              Recording
            </ThemedText>
          </GlassPanel>
        </View>
      )}

      {/* Bottom chrome */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.four }]}>
        <GlassIconButton
          name={{ ios: flash === 'off' ? 'bolt.slash' : 'bolt.fill', android: 'flash_off', web: 'zap' }}
          onPress={() => setFlash((f) => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'))}
        />
        <Pressable
          disabled={!ready}
          onPress={onShutterPress}
          onLongPress={onShutterLong}
          onPressOut={onShutterOut}
          delayLongPress={350}
          style={[styles.shutter, !ready && styles.shutterDisabled, recording && styles.shutterRecording]}
        />
        <GlassIconButton
          name={{ ios: 'camera.rotate', android: 'flip_camera_android', web: 'repeat' }}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        />
      </View>

      {/* Saved toast */}
      {justSaved && (
        <View pointerEvents="none" style={styles.toastWrap}>
          <GlassPanel intensity={60} radius={Radius.pill} style={styles.toast} contentStyle={styles.toastContent}>
            <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check-circle' } as never} size={20} tintColor={theme.success} />
            <ThemedText type="smallBold">Saved</ThemedText>
          </GlassPanel>
        </View>
      )}

      {/* Permission gate */}
      {permission && !granted && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <PermissionGate onAllow={requestPermission} />
        </View>
      )}

      {/* Review / annotate sheet */}
      <ReviewSheet
        captured={captured}
        text={text}
        setText={setText}
        voice={voice}
        onAddVoice={() => setVoiceOpen(true)}
        onRemoveVoice={() => setVoice(null)}
        locationLabel={locLabel}
        onAddLocation={captureLocation}
        projectName={selectedProject?.name}
        saving={saving}
        canSave={!!captured && !!projectId}
        onDiscard={resetComposer}
        onSave={onSave}
      />

      {/* Destination picker */}
      <ProjectPicker
        visible={pickerOpen}
        projects={projects}
        selectedId={projectId}
        onSelect={(id) => {
          setProjectId(id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <VoiceRecorder
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onCapture={(item) => {
          setVoice(item);
          setVoiceOpen(false);
        }}
      />
    </View>
  );
}

function GlassIconButton({
  name,
  onPress,
  size = 20,
}: {
  name: { ios: string; android?: string; web?: string };
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.8 }}>
      <GlassPanel
        intensity={55}
        radius={Radius.pill}
        style={{ width: 44, height: 44 }}
        contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
        <SymbolView name={name as never} size={size} tintColor="#FFFFFF" weight="semibold" />
      </GlassPanel>
    </Pressable>
  );
}

function PermissionGate({ onAllow }: { onAllow: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.gate, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
      <View style={{ width: '100%', maxWidth: 320 }}>
        <GlassPanel intensity={40} radius={Radius.lg} style={{ padding: Spacing.five }} contentStyle={{ alignItems: 'center', gap: Spacing.two }}>
          <SymbolView name={{ ios: 'camera', android: 'photo_camera', web: 'camera' }} size={36} tintColor="#FFFFFF" />
          <ThemedText style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>Camera access needed</ThemedText>
          <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
            QualiTea captures field notes through the camera. Allow access to start snapping.
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two }}>
            <PillButton onPress={onAllow}>
              <ButtonLabel>Allow</ButtonLabel>
            </PillButton>
            <PillButton variant="secondary" onPress={() => Linking.openSettings()}>
              <ButtonLabel variant="secondary">Settings</ButtonLabel>
            </PillButton>
          </View>
        </GlassPanel>
      </View>
    </View>
  );
}

function ReviewSheet(props: {
  captured: Captured | null;
  text: string;
  setText: (t: string) => void;
  voice: PendingMedia | null;
  onAddVoice: () => void;
  onRemoveVoice: () => void;
  locationLabel: string;
  onAddLocation: () => void;
  projectName?: string;
  saving: boolean;
  canSave: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();
  const { captured } = props;
  return (
    <Modal visible={!!captured} animationType="slide" transparent onRequestClose={props.onDiscard}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onDiscard} />
        <GlassPanel intensity={70} radius={Radius.hero} style={styles.sheet} contentStyle={{ padding: Spacing.four }}>
          <View style={styles.sheetHandle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.three, paddingBottom: Spacing.three }}>
            {/* Preview */}
            {captured?.kind === 'video' ? (
              <VideoPreview uri={captured.tempUri} />
            ) : captured ? (
              <Image
                source={{ uri: captured.tempUri }}
                style={styles.preview}
                contentFit="cover"
              />
            ) : null}

            <TextField
              value={props.text}
              onChangeText={props.setText}
              placeholder="Add a note…"
              multiline
              style={styles.noteField}
            />

            {props.voice ? (
              <View style={[styles.voiceChip, { backgroundColor: theme.surfaceMuted }]}>
                <SymbolView name={{ ios: 'waveform', android: 'graphic_eq', web: 'audio' } as never} size={16} tintColor={theme.primary} />
                <ThemedText type="smallBold">Voice · {formatDuration(props.voice.durationMs)}</ThemedText>
                <View style={{ flex: 1 }} />
                <Pressable onPress={props.onRemoveVoice} hitSlop={8}>
                  <SymbolView name={{ ios: 'xmark', android: 'close', web: 'x' } as never} size={14} tintColor={theme.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <PillButton variant="secondary" onPress={props.onAddVoice}>
                <SymbolView name={{ ios: 'mic', android: 'mic', web: 'mic' }} size={16} tintColor={theme.primary} />
                <ButtonLabel variant="secondary">Add voice note</ButtonLabel>
              </PillButton>
            )}

            <Pressable onPress={props.onAddLocation} style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <MapPin label={props.locationLabel} />
            </Pressable>
          </ScrollView>

          <View style={styles.sheetActions}>
            <PillButton variant="secondary" onPress={props.onDiscard}>
              <ButtonLabel variant="secondary">Discard</ButtonLabel>
            </PillButton>
            <PillButton onPress={props.onSave} disabled={!props.canSave || props.saving} style={{ flex: 1 }}>
              <ButtonLabel>{props.saving ? 'Saving…' : props.projectName ? `Save to ${props.projectName}` : 'Save'}</ButtonLabel>
            </PillButton>
          </View>
        </GlassPanel>
      </View>
    </Modal>
  );
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="cover"
      style={styles.preview}
    />
  );
}

function ProjectPicker({
  visible,
  projects,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  projects: ReturnType<typeof useProjectsList>['projects'];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GlassPanel intensity={70} radius={Radius.hero} style={styles.sheet} contentStyle={{ padding: Spacing.four }}>
          <View style={styles.sheetHandle} />
          <ThemedText type="subtitle">Save to</ThemedText>
          {projects.length === 0 ? (
            <Pressable onPress={() => { onClose(); router.push('/project/new'); }} style={{ paddingVertical: Spacing.three }}>
              <ThemedText type="small" themeColor="primary">Create a project first →</ThemedText>
            </Pressable>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.one, paddingTop: Spacing.two }}>
              {projects.map((p) => {
                const selected = p.id === selectedId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => onSelect(p.id)}
                    style={({ pressed }) => [styles.pickerRow, { backgroundColor: selected ? theme.primarySoft : 'transparent' }, pressed && { opacity: 0.7 }]}>
                    <View style={[styles.swatch, { backgroundColor: p.color_hex ?? theme.primary }]} />
                    <ThemedText type="smallBold" numberOfLines={1} style={{ flex: 1 }}>
                      {p.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{p.note_count}</ThemedText>
                    {selected && (
                      <SymbolView name={{ ios: 'checkmark', android: 'done', web: 'check' }} size={16} tintColor={theme.primary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </GlassPanel>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  destPill: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    maxWidth: 220,
  },
  destPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  locPill: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  locPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  swatch: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  hintWrap: {
    position: 'absolute',
    top: '32%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintPill: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  hintContent: {
    alignItems: 'center',
  },
  recBadgeWrap: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recBadge: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'rgba(250,103,91,0.25)',
  },
  recContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FA675B',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  shutterDisabled: {
    opacity: 0.4,
  },
  shutterRecording: {
    backgroundColor: '#FA675B',
    borderColor: 'rgba(250,103,91,0.4)',
    transform: [{ scale: 0.9 }],
  },
  toastWrap: {
    position: 'absolute',
    top: '18%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.four,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120,120,128,0.35)',
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.lg,
    backgroundColor: '#000000',
  },
  noteField: {
    minHeight: 80,
  },
  voiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
  },
});
