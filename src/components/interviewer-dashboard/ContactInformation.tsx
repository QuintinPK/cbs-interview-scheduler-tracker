
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Interviewer } from "@/types";

interface ContactInformationProps {
  interviewer: Interviewer | null;
}

export const ContactInformation: React.FC<ContactInformationProps> = ({
  interviewer,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Name</h3>
            <p className="text-muted-foreground">
              {interviewer?.first_name} {interviewer?.last_name}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Phone</h3>
            <p className="text-muted-foreground">
              {interviewer?.phone || 'Not provided'}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Email</h3>
            <p className="text-muted-foreground">
              {interviewer?.email || 'Not provided'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
