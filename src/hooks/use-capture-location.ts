import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export type CaptureLocation = {
  lat: number;
  lng: number;
  accuracy_m: number | null;
  altitude_m: number | null;
  place_name: string | null;
  captured_at: number;
};

export type LocationStatus = 'idle' | 'granted' | 'denied';

/**
 * Just-in-time foreground location capture for a field note. Requests
 * permission only when `capture()` is called (never on mount), gets a single
 * high-accuracy fix, and best-effort reverse-geocodes a place name. Geocoding
 * failures never block saving — `place_name` just stays null.
 */
export function useCaptureLocation() {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [location, setLocation] = useState<CaptureLocation | null>(null);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(async (): Promise<CaptureLocation | null> => {
    if (busy) return location;
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setStatus('denied');
        return null;
      }
      setStatus('granted');

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      let place_name: string | null = null;
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const g = geo[0];
        if (g) {
          place_name =
            [g.street, g.city].filter(Boolean).join(', ') ||
            g.name ||
            g.region ||
            null;
        }
      } catch {
        // best-effort; ignore
      }

      const loc: CaptureLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy ?? null,
        altitude_m: pos.coords.altitude ?? null,
        place_name,
        captured_at: Date.now(),
      };
      setLocation(loc);
      return loc;
    } finally {
      setBusy(false);
    }
  }, [busy, location]);

  return { status, location, busy, capture };
}
