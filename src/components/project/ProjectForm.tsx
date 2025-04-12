
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import IslandSelector from "@/components/ui/IslandSelector";

interface ProjectFormProps {
  formData: {
    name: string;
    start_date: string;
    end_date: string;
    island: 'Bonaire' | 'Saba' | 'Sint Eustatius';
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (name: 'start_date' | 'end_date', value: string) => void;
  handleIslandChange: (island: 'Bonaire' | 'Saba' | 'Sint Eustatius') => void;
  handleSubmit: () => void;
  isEditing: boolean;
  loading: boolean;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  formData,
  handleInputChange,
  handleDateChange,
  handleIslandChange,
  handleSubmit,
  isEditing,
  loading,
  onCancel
}) => {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter project name"
          required
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="island">Island</Label>
        <IslandSelector
          selectedIsland={formData.island}
          onIslandChange={handleIslandChange}
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="start_date">Start Date</Label>
        <Input
          id="start_date"
          name="start_date"
          type="date"
          value={formData.start_date}
          onChange={(e) => handleDateChange('start_date', e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="end_date">End Date</Label>
        <Input
          id="end_date"
          name="end_date"
          type="date"
          value={formData.end_date}
          onChange={(e) => handleDateChange('end_date', e.target.value)}
          required
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
          disabled={!formData.name || !formData.start_date || !formData.end_date || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEditing ? "Update Project" : "Create Project"
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProjectForm;
