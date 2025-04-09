
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Interviewer } from "@/types";
import { Mail, Phone } from "lucide-react";

interface ContactInformationProps {
  interviewer: Interviewer | null;
}

export const ContactInformation: React.FC<ContactInformationProps> = ({
  interviewer,
}) => {
  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit character
    return phone.replace(/\D/g, '');
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-cbs to-cbs-light text-white">
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-1">Name</h3>
            <p className="text-lg">
              {interviewer?.first_name} {interviewer?.last_name}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-1">Phone</h3>
            {interviewer?.phone ? (
              <a 
                href={`https://wa.me/${formatPhoneNumber(interviewer.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-green-600 hover:text-green-800 transition-colors group"
              >
                <Phone className="h-5 w-5 mr-2" />
                <span className="text-lg group-hover:underline">{interviewer.phone}</span>
              </a>
            ) : (
              <p className="text-muted-foreground italic">Not provided</p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-1">Email</h3>
            {interviewer?.email ? (
              <a 
                href={`mailto:${interviewer.email}`}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors group"
              >
                <Mail className="h-5 w-5 mr-2" />
                <span className="text-lg group-hover:underline">{interviewer.email}</span>
              </a>
            ) : (
              <p className="text-muted-foreground italic">Not provided</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
