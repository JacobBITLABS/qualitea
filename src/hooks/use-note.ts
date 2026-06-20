import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { getNoteWithMedia } from '@/data/notes';
import type { NoteWithMedia } from '@/data/types';

/** Loads a note with all its media, plus a manual `refresh`. */
export function useNote(id: string | undefined) {
  const db = useSQLiteContext();
  const [note, setNote] = useState<NoteWithMedia | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) {
      setNote(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setNote(await getNoteWithMedia(db, id));
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { note, loading, refresh };
}
