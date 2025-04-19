
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProjectFormProps {
  formData: {
    name: string;
    start_date: string;
    end_date: string;
    excluded_islands: ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (name: 'start_date' | 'end_date', value: string) => void;
  handleExcludedIslandsChange: (island: 'Bonaire' | 'Saba' | 'Sint Eustatius') => void;
  handleSubmit: () => Promise<void>;
  isEditing: boolean;
  loading: boolean;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  formData,
  handleInputChange,
  handleDateChange,
  handleExcludedIslandsChange,
  handleSubmit,
  isEditing,
  loading,
  onCancel
}) => {
  const allIslands: ('Bonaire' | 'Saba' | 'Sint Eustatius')[] = ['Bonaire', 'Saba', 'Sint Eustatius'];

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Project Name</label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter project name"
          disabled={loading}
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="start_date" className="text-sm font-medium">Start Date</label>
        <Input
          id="start_date"
          name="start_date"
          type="date"
          value={formData.start_date}
          onChange={(e) => handleDateChange('start_date', e.target.value)}
          disabled={loading}
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="end_date" className="text-sm font-medium">End Date</label>
        <Input
          id="end_date"
          name="end_date"
          type="date"
          value={formData.end_date}
          onChange={(e) => handleDateChange('end_date', e.target.value)}
          disabled={loading}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium">Excluded Islands</Label>
        <div className="flex items-center space-x-4 pt-2">
          {allIslands.map(island => (
            <div key={island} className="flex items-center space-x-2">
              <Checkbox
                id={`exclude-${island}`}
                checked={formData.excluded_islands.includes(island)}
                onCheckedChange={() => handleExcludedIslandsChange(island)}
                disabled={loading}
              />
              <Label htmlFor={`exclude-${island}`}>{island}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <DialogFooter className="pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.name || !formData.start_date || !formData.end_date}
          className="bg-cbs hover:bg-cbs-light"
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
      </DialogFooter>
    </div>
  );
};

export default ProjectForm;
