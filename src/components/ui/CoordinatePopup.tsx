
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Map from '@/components/ui/Map';
import { useGoogleMapsApiKey } from '@/hooks/useGoogleMapsApiKey';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface CoordinatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  coordinate: Coordinate | null;
}

const CoordinatePopup: React.FC<CoordinatePopupProps> = ({ isOpen, onClose, coordinate }) => {
  const { apiKey } = useGoogleMapsApiKey();

  if (!coordinate) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Location</DialogTitle>
          <DialogDescription>
            Coordinates: {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="h-[400px] mt-4">
          <Map 
            latitude={coordinate.latitude}
            longitude={coordinate.longitude}
            zoom={15}
            className="w-full h-full"
            apiKey={apiKey}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoordinatePopup;
