
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Interviewer } from "@/types";
import { Loader2 } from "lucide-react";

interface InterviewerFormProps {
  formData: {
    code: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  isEditing: boolean;
  loading: boolean;
  onCancel: () => void;
}

const InterviewerForm: React.FC<InterviewerFormProps> = ({
  formData,
  handleInputChange,
  handleSubmit,
  isEditing,
  loading,
  onCancel
}) => {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="code">Interviewer Code*</Label>
        <Input
          id="code"
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          placeholder="e.g. INT001"
          disabled={loading}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name*</Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            placeholder="John"
            disabled={loading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name*</Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            placeholder="Doe"
            disabled={loading}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="06-12345678"
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="john.doe@example.com"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="bg-cbs hover:bg-cbs-light"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Saving..." : "Adding..."}
            </>
          ) : (
            isEditing ? "Save Changes" : "Add Interviewer"
          )}
        </Button>
      </div>
    </div>
  );
};

export default InterviewerForm;
