
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Map } from "lucide-react";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";
import { useToast } from "@/hooks/use-toast";

const GoogleMapsApiCard = () => {
  const { apiKey, loading, error, updateApiKey } = useGoogleMapsApiKey();
  const { toast } = useToast();
  const [newApiKey, setNewApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Update the newApiKey state when apiKey is loaded
  useEffect(() => {
    if (apiKey) {
      setNewApiKey(apiKey);
    }
  }, [apiKey]);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateApiKey(newApiKey);
    setIsSaving(false);
    
    if (success) {
      toast({
        title: "Success",
        description: "Google Maps API key updated successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update Google Maps API key",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Map className="h-5 w-5 text-muted-foreground" />
          Google Maps API
        </CardTitle>
        <CardDescription>
          Configure your Google Maps API key for location features
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="google-maps-api-key">API Key</Label>
          <Input
            id="google-maps-api-key"
            type="text"
            placeholder="Enter your Google Maps API key"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            disabled={loading || isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Your API key is stored securely in the database and is only used for Google Maps integration.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={loading || isSaving || newApiKey === apiKey}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save API Key"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GoogleMapsApiCard;
