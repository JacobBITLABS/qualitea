import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { Fab } from '@/components/fab';
import { GlassHeader } from '@/components/glass-header';
import { GradientBackground } from '@/components/gradient-background';
import { MapPin } from '@/components/map-pin';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { resolveMediaUri } from '@/data/files';
import type { NoteListItem } from '@/data/notes';
import { useProject } from '@/hooks/use-project';
import { useProjectNotes } from '@/hooks/use-project-notes';
import { useTheme } from '@/hooks/use-theme';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { project } = useProject(id);
  const { notes, loading } = useProjectNotes(id);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!id) return <Redirect href="/" />;

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
            {project?.name ?? 'Project'}
          </ThemedText>
          <View style={{ width: 22 }} />
        </View>
      </GlassHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingTop: Spacing.five,
          paddingBottom: 140,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
        <View style={styles.list}>
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
          {!loading && notes.length === 0 && <EmptyNotes />}
        </View>
      </ScrollView>

      {Platform.OS !== 'web' && (
        <View style={[styles.fabWrap, { bottom: insets.bottom + Spacing.four }]}>
          <Fab
            icon={{ ios: 'camera.fill', android: 'photo_camera', web: 'camera' }}
            onPress={() => router.push({ pathname: '/capture', params: { projectId: id } })}
          />
        </View>
      )}
    </GradientBackground>
  );
}

function placeholderIcon(note: NoteListItem) {
  if (note.thumb_kind) return note.thumb_kind === 'video' ? 'video' : 'photo';
  return note.media_count > 0 ? 'paperclip' : 'doc.text';
}

function NoteCard({ note }: { note: NoteListItem }) {
  const theme = useTheme();
  const thumb = resolveMediaUri(note.thumb_path);
  const title = note.title || note.text_body?.slice(0, 70) || 'Untitled note';

  return (
    <Card
      onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
      style={styles.noteCard}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: theme.surfaceMuted }]}>
          <SymbolView
            name={{ ios: placeholderIcon(note) as never, android: 'description', web: 'description' }}
            size={22}
            tintColor={theme.textSecondary}
          />
        </View>
      )}
      <View style={styles.noteBody}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {title}
        </ThemedText>
        {note.place_name ? <MapPin label={note.place_name} variant="plain" /> : null}
        <View style={styles.noteMeta}>
          <ThemedText type="small" themeColor="textTertiary">
            {formatDate(note.created_at)}
          </ThemedText>
          {note.media_count > 0 && (
            <ThemedText type="small" themeColor="textTertiary">
              {'  ·  '}
              {note.media_count} {note.media_count === 1 ? 'item' : 'items'}
            </ThemedText>
          )}
        </View>
      </View>
    </Card>
  );
}

function EmptyNotes() {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
        <SymbolView
          name={{ ios: 'camera', android: 'photo_camera', web: 'camera' }}
          size={30}
          tintColor={theme.primary}
          weight="semibold"
        />
      </View>
      <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
        No notes yet
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', maxWidth: 280 }}>
        Capture a photo, video, or voice note to add your first observation.
      </ThemedText>
    </View>
  );
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
  list: {
    gap: Spacing.two,
  },
  noteCard: {
    flexDirection: 'row',
    padding: Spacing.two,
    gap: Spacing.three,
    alignItems: 'center',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBody: {
    flex: 1,
    gap: 4,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabWrap: {
    position: 'absolute',
    right: Spacing.four,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.six,
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
});
