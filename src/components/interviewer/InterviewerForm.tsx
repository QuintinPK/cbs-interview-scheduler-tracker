
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import IslandSelector from "@/components/ui/IslandSelector";

interface InterviewerFormProps {
  formData: {
    code: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    island?: 'Bonaire' | 'Saba' | 'Sint Eustatius';
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleIslandChange?: (island: 'Bonaire' | 'Saba' | 'Sint Eustatius') => void;
  handleSubmit: () => void;
  isEditing: boolean;
  loading: boolean;
  onCancel: () => void;
}

const InterviewerForm: React.FC<InterviewerFormProps> = ({
  formData,
  handleInputChange,
  handleIslandChange,
  handleSubmit,
  isEditing,
  loading,
  onCancel
}) => {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="code">Interviewer Code</Label>
        <Input
          id="code"
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          placeholder="Enter unique code"
          required
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="first_name">First Name</Label>
        <Input
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleInputChange}
          placeholder="Enter first name"
          required
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="last_name">Last Name</Label>
        <Input
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleInputChange}
          placeholder="Enter last name"
          required
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="island">Island</Label>
        {handleIslandChange && (
          <IslandSelector
            selectedIsland={formData.island}
            onIslandChange={handleIslandChange}
            disabled={loading}
          />
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone || ""}
          onChange={handleInputChange}
          placeholder="Enter phone number (optional)"
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email || ""}
          onChange={handleInputChange}
          placeholder="Enter email address (optional)"
          disabled={loading}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!formData.code || !formData.first_name || !formData.last_name || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEditing ? "Update Interviewer" : "Create Interviewer"
          )}
        </Button>
      </div>
    </div>
  );
};

export default InterviewerForm;
