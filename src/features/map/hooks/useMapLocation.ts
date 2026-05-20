import { useState, useEffect, useCallback, useRef } from "react";

interface UseMapLocationOptions {
  onLocationChange?: (location: [number, number]) => void;
}

interface UseMapLocationReturn {
  location: [number, number] | null;
  error: string | null;
  isLocating: boolean;
  centerOnUser: () => void;
}

export function useMapLocation({
  onLocationChange,
}: UseMapLocationOptions = {}): UseMapLocationReturn {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const hasInitiallyLocatedRef = useRef(false);
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada");
      return;
    }

    const handlePosition = (position: GeolocationPosition) => {
      const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
      setLocation(loc);
      if (!hasInitiallyLocatedRef.current) {
        hasInitiallyLocatedRef.current = true;
        onLocationChangeRef.current?.(loc);
      }
    };

    navigator.geolocation.getCurrentPosition(handlePosition, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 60000,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 30000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const centerOnUser = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setLocation(loc);
        setError(null);
        onLocationChangeRef.current?.(loc);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Permita o acesso à localização");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("GPS indisponível");
            break;
          case err.TIMEOUT:
            setError("Tempo esgotado. Tente novamente.");
            break;
          default:
            setError("Erro ao obter localização");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  return { location, error, isLocating, centerOnUser };
}
