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

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada");
      return;
    }

    // getCurrentPosition for immediate result
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setLocation(loc);
        onLocationChange?.(loc);
      },
      (err) => {
        setError("Não foi possível obter sua localização");
      },
    );

    // Watch position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setLocation(loc);
        onLocationChange?.(loc);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [onLocationChange]);

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
        onLocationChange?.(loc);
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
  }, [onLocationChange]);

  return { location, error, isLocating, centerOnUser };
}
