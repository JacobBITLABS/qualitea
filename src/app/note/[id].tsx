import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassHeader } from '@/components/glass-header';
import { GradientBackground } from '@/components/gradient-background';
import { AudioPlayer } from '@/components/note/audio-player';
import { MapPin } from '@/components/map-pin';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { resolveMediaUri } from '@/data/files';
import { softDeleteNote, updateNote } from '@/data/notes';
import type { NoteMedia } from '@/data/types';
import { useNote } from '@/hooks/use-note';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatDateTime } from '@/utils/format';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { note, loading, refresh } = useNote(id);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!id) return <Redirect href="/" />;

  useEffect(() => {
    if (note) setDraft(note.text_body ?? '');
  }, [note?.id]);

  const saveText = async () => {
    if (!note) return;
    await updateNote(db, note.id, {
      text_body: draft.trim() || null,
      title: deriveTitle(draft),
    });
    setEditing(false);
    refresh();
  };

  const onDelete = () => {
    if (!note) return;
    Alert.alert('Delete note?', 'This removes the note and its media from the project.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await softDeleteNote(db, note.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <GradientBackground>
      <GlassHeader>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'chevron_left' }}
              size={22}
              tintColor={theme.primary}
            />
          </Pressable>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.headerTitle}>
            {note?.title ?? 'Note'}
          </ThemedText>
          <View style={styles.headerActions}>
            {editing ? (
              <Pressable onPress={saveText} hitSlop={12}>
                <SymbolView name={{ ios: 'checkmark', android: 'done', web: 'check' }} size={22} tintColor={theme.primary} />
              </Pressable>
            ) : (
              <Pressable onPress={() => setEditing(true)} hitSlop={12} accessibilityLabel="Edit">
                <SymbolView name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit-3' } as never} size={20} tintColor={theme.primary} />
              </Pressable>
            )}
            <Pressable onPress={onDelete} hitSlop={12} accessibilityLabel="Delete">
              <SymbolView name={{ ios: 'trash', android: 'delete', web: 'trash-2' } as never} size={20} tintColor={theme.danger} />
            </Pressable>
          </View>
        </View>
      </GlassHeader>

      {loading && !note ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            Loading…
          </ThemedText>
        </View>
      ) : !note ? (
        <View style={styles.center}>
          <ThemedText type="subtitle">Note not found</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: Spacing.four,
            paddingTop: Spacing.four,
            paddingBottom: insets.bottom + Spacing.six,
            maxWidth: MaxContentWidth,
            width: '100%',
            alignSelf: 'center',
          }}>
          {/* Location */}
          {note.lat != null && note.lng != null && (
            <View style={styles.metaRow}>
              <MapPin
                label={note.place_name ?? `${note.lat.toFixed(4)}, ${note.lng.toFixed(4)}`}
                hint={note.accuracy_m != null ? `±${Math.round(note.accuracy_m)}m` : undefined}
              />
            </View>
          )}

          {/* Text body */}
          {editing ? (
            <TextField value={draft} onChangeText={setDraft} placeholder="Write your field observations…" multiline autoFocus style={styles.textBlock} />
          ) : note.text_body ? (
            <View style={[styles.textBlock, styles.textDisplay]}>
              <ThemedText>{note.text_body}</ThemedText>
            </View>
          ) : null}

          {/* Media */}
          <View style={styles.mediaList}>
            {note.media.map((m) => (
              <MediaView key={m.id} media={m} />
            ))}
          </View>

          {/* Timestamps */}
          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textTertiary">
              Captured {formatDateTime(note.location_captured_at ?? note.created_at)}
            </ThemedText>
            {note.updated_at !== note.created_at && (
              <ThemedText type="small" themeColor="textTertiary">
                Updated {formatDate(note.updated_at)}
              </ThemedText>
            )}
          </View>
        </ScrollView>
      )}
    </GradientBackground>
  );
}

function MediaView({ media }: { media: NoteMedia }) {
  const theme = useTheme();
  const uri = resolveMediaUri(media.file_path);

  if (media.kind === 'audio') {
    return uri ? <AudioPlayer uri={uri} durationMs={media.duration_ms} /> : null;
  }

  if (media.kind === 'video') {
    return uri ? <VideoItem uri={uri} width={media.width} height={media.height} /> : null;
  }

  if (media.kind === 'photo' && uri) {
    const aspect = media.width && media.height ? media.width / media.height : 4 / 3;
    return (
      <Image
        source={{ uri }}
        style={[styles.photo, { aspectRatio: aspect }]}
        contentFit="contain"
        transition={150}
      />
    );
  }

  // text-only media (no file) — nothing to render in M1.
  return null;
}

function VideoItem({ uri, width, height }: { uri: string; width: number | null; height: number | null }) {
  const player = useVideoPlayer(uri);
  const aspect = width && height ? width / height : 16 / 9;
  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      style={{ width: '100%', aspectRatio: aspect, borderRadius: Radius.lg }}
    />
  );
}

function deriveTitle(text: string): string {
  const t = text.trim();
  if (!t) return 'Field note';
  return t.length > 60 ? `${t.slice(0, 60).trim()}…` : t;
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    marginBottom: Spacing.three,
  },
  textBlock: {
    marginBottom: Spacing.three,
    minHeight: 96,
  },
  textDisplay: {
    backgroundColor: 'transparent',
  },
  mediaList: {
    gap: Spacing.three,
  },
  photo: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: Radius.lg,
  },
  footer: {
    marginTop: Spacing.five,
    gap: 2,
  },
});
