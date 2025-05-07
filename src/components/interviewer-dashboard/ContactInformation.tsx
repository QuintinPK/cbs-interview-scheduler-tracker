
import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Pencil } from "lucide-react";
import { Interviewer } from "@/types";
import { Button } from "@/components/ui/button";
import { EditContactInformation } from "./EditContactInformation";

interface ContactInformationProps {
  interviewer: Interviewer | null;
}

export const ContactInformation: React.FC<ContactInformationProps> = ({ interviewer }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentInterviewer, setCurrentInterviewer] = useState<Interviewer | null>(interviewer);

  if (!currentInterviewer) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No interviewer information available
      </div>
    );
  }

  const handleSaveContact = (updatedInterviewer: Interviewer) => {
    setCurrentInterviewer(updatedInterviewer);
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {isEditing ? (
        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <EditContactInformation
              interviewer={currentInterviewer}
              onCancel={() => setIsEditing(false)}
              onSave={handleSaveContact}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contact Details</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
                title="Edit contact information"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{currentInterviewer.email || "No email provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{currentInterviewer.phone || "No phone provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Island</p>
                  <p className="font-medium">{currentInterviewer.island || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="font-medium">{currentInterviewer.first_name} {currentInterviewer.last_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Interviewer Code</p>
                <p className="font-medium">{currentInterviewer.code}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
