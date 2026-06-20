import AppTabs from '@/components/app-tabs';

/**
 * The tabs group. Rendered as a single screen inside the root Stack so detail
 * routes (project/[id], note/[id], …) push over it with the tab bar hidden.
 */
export default function TabsLayout() {
  return <AppTabs />;
}
