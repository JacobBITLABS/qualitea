/** A captured-but-not-yet-saved media item, held in the composer's state. */
export type PendingMedia = {
  /** Local key (uuid), also reused as the persisted file name. */
  id: string;
  kind: 'photo' | 'video' | 'audio';
  /** Temporary cache URI from expo-camera / expo-audio / expo-image-picker. */
  tempUri: string;
  mime?: string;
  durationMs?: number;
  width?: number;
  height?: number;
};
