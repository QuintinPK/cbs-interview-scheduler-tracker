
import { useState } from "react";

export const useCoordinatePopup = () => {
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const handleCoordinateClick = (lat: number | null, lng: number | null) => {
    if (lat !== null && lng !== null) {
      setSelectedCoordinate({ lat, lng });
      setIsMapOpen(true);
    }
  };
  
  const closeMap = () => {
    setIsMapOpen(false);
  };
  
  return {
    selectedCoordinate,
    isMapOpen,
    handleCoordinateClick,
    closeMap
  };
};
