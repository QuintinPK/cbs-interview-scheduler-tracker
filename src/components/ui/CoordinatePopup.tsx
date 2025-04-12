import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from 'next/dynamic';

export interface CoordinatePopupProps {
  mapLat: number;
  mapLng: number;
  mapLabel: string;
  onClose: () => void;
}

const CoordinatePopup: React.FC<CoordinatePopupProps> = ({
  mapLat,
  mapLng,
  mapLabel,
  onClose
}) => {
  const Map = dynamic(() => import('./Map'), {
    ssr: false,
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{mapLabel}</DialogTitle>
        </DialogHeader>
        
        <div className="h-[450px] w-full">
          {Map && (
            <Map 
              latitude={mapLat} 
              longitude={mapLng} 
              label={mapLabel} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoordinatePopup;
