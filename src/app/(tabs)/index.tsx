import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card } from '@/components/card';
import { Fab } from '@/components/fab';
import { GradientBackground } from '@/components/gradient-background';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useProjectsList } from '@/hooks/use-projects-list';
import { useTheme } from '@/hooks/use-theme';

export default function ProjectsScreen() {
  const { projects, loading } = useProjectsList();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.six }]}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <ThemedText type="eyebrow">Field Notes</ThemedText>
          <ThemedText type="hero">Projects</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Capture and organize qualitative observations.
          </ThemedText>
        </Animated.View>

        <View style={styles.list}>
          {projects.map((p) => (
            <Card
              key={p.id}
              onPress={() => router.push({ pathname: '/project/[id]', params: { id: p.id } })}
              style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.swatch, { backgroundColor: p.color_hex ?? theme.primary }]} />
                <View style={styles.cardMeta}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {p.name}
                  </ThemedText>
                  {p.description ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {p.description}
                    </ThemedText>
                  ) : null}
                </View>
                <View style={styles.countBadge}>
                  <ThemedText type="eyebrow" themeColor="textSecondary">
                    {p.note_count}
                  </ThemedText>
                </View>
              </View>
            </Card>
          ))}

          {!loading && projects.length === 0 && <EmptyProjects />}
        </View>
      </ScrollView>

      <View style={[styles.fabWrap, { bottom: insets.bottom + Spacing.four }]}>
        <Fab icon={{ ios: 'plus', android: 'add', web: 'plus' }} onPress={() => router.push('/project/new')} />
      </View>
    </GradientBackground>
  );
}

function EmptyProjects() {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
        <SymbolView
          name={{ ios: 'folder.badge.plus', android: 'create_new_folder', web: 'folder' }}
          size={32}
          tintColor={theme.primary}
          weight="semibold"
        />
      </View>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No projects yet
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBody}>
        Create your first project to start gathering field notes.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: 140, // clearance for the FAB + tab bar
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.five,
    alignSelf: 'flex-start',
  },
  list: {
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    padding: Spacing.three,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardMeta: {
    flex: 1,
    gap: 2,
  },
  countBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
