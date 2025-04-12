
import React, { Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Lazy load the Map component to avoid SSR issues with mapbox
const Map = React.lazy(() => import('./Map'));

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
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{mapLabel}</DialogTitle>
        </DialogHeader>
        
        <div className="h-[450px] w-full">
          <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-md">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <Map 
              latitude={mapLat} 
              longitude={mapLng} 
              label={mapLabel} 
            />
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoordinatePopup;
