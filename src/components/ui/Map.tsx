
import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useGoogleMapsApiKey } from '@/hooks/useGoogleMapsApiKey';

interface MapProps {
  latitude: number;
  longitude: number;
  label?: string;
}

const Map: React.FC<MapProps> = ({ latitude, longitude, label }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const { apiKey, loading } = useGoogleMapsApiKey();

  useEffect(() => {
    if (!mapContainer.current || !apiKey || loading) return;

    const initMap = async () => {
      const loader = new Loader({
        apiKey,
        version: "weekly",
      });

      try {
        const { Map } = await loader.importLibrary("maps");
        const position = { lat: latitude, lng: longitude };
        
        // Initialize the map
        map.current = new Map(mapContainer.current, {
          center: position,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Add marker
        new google.maps.Marker({
          position,
          map: map.current,
          title: label || 'Location',
        });
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      // No explicit cleanup needed for Google Maps
    };
  }, [latitude, longitude, label, apiKey, loading]);

  if (loading || !apiKey) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded-md">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-cbs border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div ref={mapContainer} className="h-full w-full rounded-md" />
    </div>
  );
};

export default Map;
