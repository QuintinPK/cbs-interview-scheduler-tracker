
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, AlertTriangle } from "lucide-react";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

interface CoordinatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  coordinate: { lat: number; lng: number } | { latitude: number; longitude: number } | null;
}

const CoordinatePopup: React.FC<CoordinatePopupProps> = ({
  isOpen,
  onClose,
  coordinate,
}) => {
  const { apiKey, loading, error } = useGoogleMapsApiKey();
  
  if (!coordinate) return null;

  // Extract lat/lng regardless of which format was provided
  const lat = 'lat' in coordinate ? coordinate.lat : coordinate.latitude;
  const lng = 'lng' in coordinate ? coordinate.lng : coordinate.longitude;
  
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
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            ) : error ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                <p className="text-sm text-muted-foreground">Error loading map: {error}</p>
              </div>
            ) : !apiKey ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                <p className="text-sm text-muted-foreground">Map API key not configured</p>
                <p className="text-xs text-muted-foreground mt-1">Please configure a Google Maps API key in Settings</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => window.open("/admin/settings", "_blank", "noopener,noreferrer")}
                >
                  Go to Settings
                </Button>
              </div>
            ) : (
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            )}
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
