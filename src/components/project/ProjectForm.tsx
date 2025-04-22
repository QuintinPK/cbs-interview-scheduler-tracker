
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ProjectFormProps {
  formData: {
    name: string;
    start_date: string;
    end_date: string;
    excluded_islands: ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
    hourly_rate: number;
    show_response_rates: boolean;
    response_rate: number;
    non_response_rate: number;
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

  // Modified handler for the switch component that doesn't try to simulate a full React.ChangeEvent
  const handleSwitchChange = (checked: boolean) => {
    // Create a simpler custom event object with just the properties we need
    const customEvent = {
      target: {
        name: 'show_response_rates',
        value: checked,
        type: 'checkbox',
        checked: checked
      }
    };
    
    // Cast to unknown first, then to the expected type
    handleInputChange(customEvent as unknown as React.ChangeEvent<HTMLInputElement>);
  };

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
      
      <div className="space-y-4 border-t pt-4 mt-4">
        <h3 className="text-lg font-medium">Cost Settings</h3>
        
        <div className="space-y-2">
          <Label htmlFor="hourly_rate" className="text-sm font-medium">Hourly Rate ($)</Label>
          <Input
            id="hourly_rate"
            name="hourly_rate"
            type="number"
            step="0.01"
            min="0"
            value={formData.hourly_rate}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Response Rates</Label>
            <p className="text-[0.8rem] text-muted-foreground">
              Enable bonus rates for responses and non-responses
            </p>
          </div>
          <Switch
            name="show_response_rates"
            checked={formData.show_response_rates}
            onCheckedChange={handleSwitchChange}
            disabled={loading}
          />
        </div>
        
        {formData.show_response_rates && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response_rate" className="text-sm font-medium">Response Bonus ($)</Label>
              <Input
                id="response_rate"
                name="response_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.response_rate}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="non_response_rate" className="text-sm font-medium">Non-Response Bonus ($)</Label>
              <Input
                id="non_response_rate"
                name="non_response_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.non_response_rate}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>
        )}
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
