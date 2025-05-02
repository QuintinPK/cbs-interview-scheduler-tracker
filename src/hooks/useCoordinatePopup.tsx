
import { useState, useCallback } from "react";

/**
 * Hook to manage the state and actions for a coordinate popup/map
 */
export const useCoordinatePopup = () => {
  const [selectedCoordinate, setSelectedCoordinate] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  /**
   * Handle when a coordinate is clicked to display on map
   */
  const handleCoordinateClick = useCallback((lat: number | null, lng: number | null) => {
    if (lat !== null && lng !== null) {
      setSelectedCoordinate({ lat, lng });
      setIsMapOpen(true);
    }
  }, []);
  
  /**
   * Close the map popup
   */
  const closeMap = useCallback(() => {
    setIsMapOpen(false);
  }, []);
  
  return {
    selectedCoordinate,
    isMapOpen,
    handleCoordinateClick,
    closeMap
  };
};
