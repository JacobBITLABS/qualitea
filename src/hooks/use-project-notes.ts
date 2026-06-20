import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { listNoteListItems, type NoteListItem } from '@/data/notes';

/** Loads a project's notes (with thumbnail/count) and refreshes on focus. */
export function useProjectNotes(projectId: string | undefined) {
  const db = useSQLiteContext();
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setNotes(await listNoteListItems(db, projectId));
    } finally {
      setLoading(false);
    }
  }, [db, projectId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { notes, loading, refresh };
}
