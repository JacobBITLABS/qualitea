import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { listProjectsList, type ProjectListItem } from '@/data/projects';

/**
 * Loads all non-deleted projects (with note counts) and re-fetches whenever the
 * screen regains focus (so newly created projects appear without a manual refresh).
 */
export function useProjectsList() {
  const db = useSQLiteContext();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await listProjectsList(db));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { projects, loading, refresh };
}
