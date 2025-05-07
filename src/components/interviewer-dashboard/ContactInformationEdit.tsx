
import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Save, X } from "lucide-react";
import { Interviewer } from "@/types";
import { useInterviewers } from "@/hooks/useInterviewers";
import { useToast } from "@/hooks/use-toast";

interface ContactInformationEditProps {
  interviewer: Interviewer | null;
  onSave: () => void;
}

export const ContactInformationEdit: React.FC<ContactInformationEditProps> = ({ interviewer, onSave }) => {
  const { updateInterviewer } = useInterviewers();
  const { toast } = useToast();
  const [email, setEmail] = useState(interviewer?.email || "");
  const [phone, setPhone] = useState(interviewer?.phone || "");
  const [saving, setSaving] = useState(false);
  
  if (!interviewer) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No interviewer information available
      </div>
    );
  }

  const handleSave = async () => {
    if (!interviewer) return;
    
    setSaving(true);
    try {
      await updateInterviewer(interviewer.id, {
        ...interviewer,
        email,
        phone
      });
      
      toast({
        title: "Contact information updated",
        description: "The interviewer's contact information has been updated successfully."
      });
      
      onSave();
    } catch (error) {
      console.error("Error updating contact information:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the contact information.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <Label htmlFor="email">Email</Label>
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <Label htmlFor="phone">Phone</Label>
            </div>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Island</p>
              <p className="font-medium">{interviewer.island || "Not specified"}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSave}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Full Name</p>
            <p className="font-medium">{interviewer.first_name} {interviewer.last_name}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Interviewer Code</p>
            <p className="font-medium">{interviewer.code}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
