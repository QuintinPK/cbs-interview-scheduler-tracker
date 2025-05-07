
import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Pencil } from "lucide-react";
import { Interviewer } from "@/types";
import { ContactInformationEdit } from "./ContactInformationEdit";

interface ContactInformationProps {
  interviewer: Interviewer | null;
}

export const ContactInformation: React.FC<ContactInformationProps> = ({ interviewer }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  if (!interviewer) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No interviewer information available
      </div>
    );
  }

  if (isEditing) {
    return <ContactInformationEdit interviewer={interviewer} onSave={() => setIsEditing(false)} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contact Details</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">{interviewer.email || "No email provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              <p className="font-medium">{interviewer.phone || "No phone provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Island</p>
              <p className="font-medium">{interviewer.island || "Not specified"}</p>
            </div>
          </div>
        </CardContent>
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
