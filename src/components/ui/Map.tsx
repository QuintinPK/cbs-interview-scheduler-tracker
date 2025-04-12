
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  latitude: number;
  longitude: number;
  label?: string;
}

const Map: React.FC<MapProps> = ({ latitude, longitude, label }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with a placeholder token - in production, use environment variables
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbGt5bXdkcjUwMDg3M25wOWh1MnliN3JuIn0.6ZjkiNY8LxEcR1aCkVGEDQ';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 14
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add marker with popup
    new mapboxgl.Marker({ color: '#3770FF' })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<h3 class="font-medium">${label || 'Location'}</h3>`)
      )
      .addTo(map.current);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [latitude, longitude, label]);

  return (
    <div className="h-full w-full">
      <div ref={mapContainer} className="h-full w-full rounded-md" />
    </div>
  );
};

export default Map;
