
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

interface CoordinatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  coordinate: { lat: number; lng: number } | null;
}

const CoordinatePopup: React.FC<CoordinatePopupProps> = ({
  isOpen,
  onClose,
  coordinate,
}) => {
  if (!coordinate) return null;

  const { lat, lng } = coordinate;
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  
  const openInGoogleMaps = () => {
    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted/50 p-3 rounded-md mb-4">
            <p className="text-sm font-medium">Coordinates:</p>
            <p className="font-mono text-xs">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          </div>
          
          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-4">
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDqaVNewgLlSNaCKbJEPedBgXwgOZB720c&q=${lat},${lng}&zoom=15`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="sm:ml-auto">
            Close
          </Button>
          <Button onClick={openInGoogleMaps} className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Open in Google Maps
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoordinatePopup;
