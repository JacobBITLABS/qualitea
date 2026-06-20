import { useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { GradientBackground } from '@/components/gradient-background';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { totalMediaBytes } from '@/data/media';
import { useTheme } from '@/hooks/use-theme';
import { formatBytes } from '@/utils/format';

type Stats = { bytes: number; projects: number; notes: number };

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats>({ bytes: 0, projects: 0, notes: 0 });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const bytes = await totalMediaBytes(db);
        const projects = await db.getFirstAsync<{ c: number }>(
          'SELECT COUNT(*) AS c FROM projects WHERE deleted_at IS NULL',
        );
        const notes = await db.getFirstAsync<{ c: number }>(
          'SELECT COUNT(*) AS c FROM notes WHERE deleted_at IS NULL',
        );
        setStats({
          bytes,
          projects: projects?.c ?? 0,
          notes: notes?.c ?? 0,
        });
      })();
    }, [db]),
  );

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.six,
          paddingHorizontal: Spacing.four,
          paddingBottom: insets.bottom + Spacing.six,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
        <View style={styles.header}>
          <ThemedText type="eyebrow">Account</ThemedText>
          <ThemedText type="hero">Settings</ThemedText>
        </View>

        {/* Storage */}
        <Card style={styles.section}>
          <ThemedText type="eyebrow" style={styles.sectionLabel}>
            Storage
          </ThemedText>
          <StatRow label="Media on device" value={formatBytes(stats.bytes)} />
          <StatRow label="Projects" value={String(stats.projects)} />
          <StatRow label="Notes" value={String(stats.notes)} last />
        </Card>

        {/* Sync (future) */}
        <Card style={styles.section}>
          <ThemedText type="eyebrow" style={styles.sectionLabel}>
            Sync
          </ThemedText>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
              <SymbolView name={{ ios: 'icloud', android: 'cloud', web: 'cloud' }} size={18} tintColor={theme.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="smallBold">Nextcloud Sync</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Connect to back up notes and share with your team.
              </ThemedText>
            </View>
            <ComingSoonTag />
          </View>
        </Card>

        {/* About */}
        <Card style={styles.section}>
          <ThemedText type="eyebrow" style={styles.sectionLabel}>
            About
          </ThemedText>
          <StatRow label="Version" value="1.0.0" last />
        </Card>

        <ThemedText type="small" themeColor="textTertiary" style={styles.footer}>
          QualiTea · offline qualitative field notes
        </ThemedText>
      </ScrollView>
    </GradientBackground>
  );
}

function StatRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 0.5, borderColor: theme.border }]}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {value}
      </ThemedText>
    </View>
  );
}

function ComingSoonTag() {
  const theme = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: theme.surfaceMuted }]}>
      <ThemedText type="eyebrow" themeColor="textTertiary">
        Soon
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.five,
    alignSelf: 'flex-start',
  },
  section: {
    padding: Spacing.four,
    marginBottom: Spacing.three,
    gap: Spacing.one,
  },
  sectionLabel: {
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
