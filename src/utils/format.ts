/** Format milliseconds as M:SS. */
export function formatDuration(ms: number | null | undefined): string {
  const total = Math.floor((ms ?? 0) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format a unix-ms timestamp as a readable date. */
export function formatDate(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format a unix-ms timestamp as date + time. */
export function formatDateTime(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Human-readable byte size, e.g. `12.3 MB`. */
export function formatBytes(bytes: number | null | undefined): string {
  const b = bytes ?? 0;
  if (b < 1024) return `${b} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = b / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}
