import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { countNotesInProject, getProject } from '@/data/projects';
import type { Project } from '@/data/types';

/** Loads a single project (and its live note count) by id. */
export function useProject(id: string | undefined) {
  const db = useSQLiteContext();
  const [project, setProject] = useState<Project | null>(null);
  const [noteCount, setNoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      if (!id) {
        setProject(null);
        setLoading(false);
        return;
      }
      const [p, count] = await Promise.all([getProject(db, id), countNotesInProject(db, id)]);
      if (!active) return;
      setProject(p);
      setNoteCount(count);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [db, id]);

  return { project, noteCount, loading };
}
