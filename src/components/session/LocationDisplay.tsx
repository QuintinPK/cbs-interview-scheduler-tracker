
import React from "react";
import { MapPin } from "lucide-react";

interface LocationDisplayProps {
  latitude: number | null;
  longitude: number | null;
  onLocationClick: (lat: number | null, lng: number | null) => void;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  latitude,
  longitude,
  onLocationClick,
}) => {
  if (!latitude || !longitude) {
    return <span>N/A</span>;
  }

  return (
    <button 
      className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
      onClick={() => onLocationClick(latitude, longitude)}
    >
      <MapPin className="h-3 w-3 mr-1 text-gray-500" />
      {latitude.toFixed(4)}, {longitude.toFixed(4)}
    </button>
  );
};
