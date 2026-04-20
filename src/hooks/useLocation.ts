import { useEffect, useState } from "react";

export const useLocation = () => {
  const [locationName, setLocationName] = useState("Detecting...");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLocation = () => {
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setLatitude(lat);
        setLongitude(lon);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );

          const data = await res.json();

          const place =
            data.address?.suburb ||
            data.address?.city ||
            data.address?.town ||
            data.address?.state ||
            "Current Location";

          setLocationName(place);

          localStorage.setItem("user_location", place);
        } catch {
          setLocationName("Current Location");
        }

        setLoading(false);
      },
      () => {
        setLocationName("Enable location");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem("user_location");

    if (saved) {
      setLocationName(saved);
      setLoading(false);
    }

    fetchLocation();
  }, []);

  return {
    latitude,
    longitude,
    locationName,
    loading,
    refreshLocation: fetchLocation
  };
};