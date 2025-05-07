
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
  apiKey?: string;
}

const Map: React.FC<MapProps> = ({
  latitude,
  longitude,
  zoom = 16,
  className = 'w-full h-64 rounded-md',
  apiKey
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        // Use the provided API key or fallback to environment variable
        const key = apiKey || process.env.GOOGLE_MAPS_API_KEY || '';
        
        if (!key) {
          setError("Google Maps API key is missing");
          return;
        }
        
        const loader = new Loader({
          apiKey: key,
          version: 'weekly',
        });

        await loader.load();
        setMapLoaded(true);
        setError(null);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
        setError('Failed to load Google Maps');
      }
    };

    loadMap();
  }, [apiKey]);

  useEffect(() => {
    if (mapLoaded && mapRef.current && latitude && longitude) {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: zoom,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      const marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: 'Location',
      });

      setGoogleMap(map);
    }
  }, [mapLoaded, latitude, longitude, zoom]);

  // Update map center when coordinates change
  useEffect(() => {
    if (googleMap && latitude && longitude) {
      googleMap.setCenter({ lat: latitude, lng: longitude });
    }
  }, [googleMap, latitude, longitude]);

  return (
    <div ref={mapRef} className={className}>
      {!mapLoaded && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <p className="text-gray-500">Loading map...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Map;
