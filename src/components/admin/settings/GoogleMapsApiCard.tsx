
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Map } from "lucide-react";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

const GoogleMapsApiCard = () => {
  const { apiKey, loading, updateApiKey } = useGoogleMapsApiKey();
  const [newApiKey, setNewApiKey] = useState(apiKey);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateApiKey(newApiKey);
    setIsSaving(false);
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
