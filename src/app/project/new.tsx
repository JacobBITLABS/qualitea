import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassHeader } from '@/components/glass-header';
import { GradientBackground } from '@/components/gradient-background';
import { ButtonLabel, PillButton } from '@/components/pill-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { createProject } from '@/data/projects';
import { useTheme } from '@/hooks/use-theme';

const COLORS = ['#2B7FFF', '#B743C6', '#10B978', '#FBBE45', '#FA675B', '#090F15'];

export default function NewProjectScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await createProject(db, {
        name: name.trim(),
        description: description.trim() || null,
        color_hex: color,
      });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <GradientBackground>
      <GlassHeader>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="small" themeColor="primary">
              Cancel
            </ThemedText>
          </Pressable>
          <ThemedText type="subtitle">New Project</ThemedText>
          <Pressable onPress={onSave} disabled={!canSave} hitSlop={12}>
            <ThemedText type="smallBold" themeColor={canSave ? 'primary' : 'textTertiary'}>
              Save
            </ThemedText>
          </Pressable>
        </View>
      </GlassHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}>
        <View style={styles.field}>
          <ThemedText type="eyebrow" style={styles.label}>
            Name
          </ThemedText>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder="e.g. Riverside Interviews"
            autoFocus
            returnKeyType="done"
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="eyebrow" style={styles.label}>
            Description
          </ThemedText>
          <TextField
            value={description}
            onChangeText={setDescription}
            placeholder="Optional — what is this study about?"
            multiline
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="eyebrow" style={styles.label}>
            Color
          </ThemedText>
          <View style={styles.colorRow}>
            {COLORS.map((c) => {
              const selected = c === color;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select color ${c}`}
                  style={[
                    styles.swatch,
                    { backgroundColor: c, borderColor: selected ? theme.text : theme.border },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <PillButton size="lg" disabled={!canSave} onPress={onSave} style={styles.saveButton}>
          <ButtonLabel>Create Project</ButtonLabel>
        </PillButton>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  field: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  label: {
    marginLeft: 2,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 3,
  },
  saveButton: {
    marginTop: Spacing.two,
  },
});
