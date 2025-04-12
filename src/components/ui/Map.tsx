
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
}

const Map: React.FC<MapProps> = ({
  latitude,
  longitude,
  zoom = 16,
  className = 'w-full h-64 rounded-md'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
        });

        await loader.load();
        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
      }
    };

    loadMap();
  }, []);

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
      
      // Clear existing markers and add a new one
      googleMap.setCenter({ lat: latitude, lng: longitude });
    }
  }, [googleMap, latitude, longitude]);

  return (
    <div ref={mapRef} className={className}>
      {!mapLoaded && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default Map;
