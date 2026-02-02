import { useState, useEffect, useCallback } from "react";

export interface GeoLocation {
  lat: number;
  lng: number;
}

interface UseGeolocationResult {
  location: GeoLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<GeoLocation | null>;
  clearLocation: () => void;
  hasPermission: boolean | null;
}

const STORAGE_KEY = "link_location";

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format distance for display
 * @returns Formatted string like "2.5 km" or "500 m"
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

/**
 * Hook for managing geolocation with localStorage persistence
 */
export const useGeolocation = (): UseGeolocationResult => {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Load stored location on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as GeoLocation;
        if (parsed.lat && parsed.lng) {
          setLocation(parsed);
        }
      } catch {
        // Invalid stored data, ignore
      }
    }

    // Check permission status
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setHasPermission(result.state === "granted");
          result.onchange = () => {
            setHasPermission(result.state === "granted");
          };
        })
        .catch(() => {
          // Permissions API not fully supported
        });
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<GeoLocation | null> => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser");
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: GeoLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocation));
          setHasPermission(true);
          setLoading(false);
          resolve(newLocation);
        },
        (err) => {
          let errorMessage = "Unable to get your location";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Location permission denied";
              setHasPermission(false);
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case err.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          setError(errorMessage);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    location,
    loading,
    error,
    requestLocation,
    clearLocation,
    hasPermission,
  };
};
