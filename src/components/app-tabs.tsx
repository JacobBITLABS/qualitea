import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamilies, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Tab route name → SF Symbol (cross-platform via expo-symbols). */
const TAB_ICONS: Record<string, { ios: string; android?: string; web?: string }> = {
  index: { ios: 'folder', android: 'folder', web: 'folder' },
  capture: { ios: 'camera.fill', android: 'photo_camera', web: 'camera' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
};

/**
 * Cross-platform bottom tab bar. Three tabs on native (Projects / Capture /
 * Settings); Capture is hidden on web (`href: null`) so web is read/review only.
 */
export default function AppTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false, animation: 'shift' }} tabBar={renderTabBar}>
      <Tabs.Screen name="index" options={{ title: 'Projects' }} />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Capture',
          // Hide capture entirely on web (read-only surface).
          href: Platform.OS === 'web' ? null : undefined,
        }}
      />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

/**
 * Render-prop for `tabBar`. It must NOT call hooks itself (React Navigation
 * invokes it as a plain function); it just mounts <TabBar/>, whose hooks then
 * run inside a proper component render context.
 */
function renderTabBar(props: unknown) {
  return <TabBar {...(props as TabBarProps)} />;
}

/** Minimal shape of the tab-bar props we consume (expo-router vendors the
 * full type internally and doesn't re-export it). */
type TabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { backgroundColor: theme.glass, borderTopColor: theme.border }]}>
      <View style={[styles.inner, { paddingBottom: insets.bottom + Spacing.one }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const icon = TAB_ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (isFocused || event.defaultPrevented) return;
            navigation.navigate(route.name);
          };

          const tint = isFocused ? theme.primary : theme.textSecondary;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
              {icon && (
                <SymbolView
                  // expo-symbols uses exhaustive literal types; cast for dynamic names.
                  name={icon as never}
                  size={24}
                  tintColor={tint}
                  weight={isFocused ? 'semibold' : 'regular'}
                />
              )}
              <Text
                style={{
                  color: tint,
                  fontFamily: isFocused ? FontFamilies.semibold : FontFamilies.medium,
                  fontSize: 11,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 0.5,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.md,
  },
});
