
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { Interviewer } from "@/types";

interface ContactInformationProps {
  interviewer: Interviewer | null;
}

export const ContactInformation: React.FC<ContactInformationProps> = ({ interviewer }) => {
  if (!interviewer) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No interviewer information available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
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
