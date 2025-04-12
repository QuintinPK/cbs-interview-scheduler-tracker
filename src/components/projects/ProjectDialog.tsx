
import { useState } from "react";
import { format } from "date-fns";
import { Project, Island } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (project: Omit<Project, 'id' | 'created_at'>) => Promise<boolean>;
  isEditing: boolean;
  selectedProject?: Project | null;
  title?: string;
}

const ProjectDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isEditing,
  selectedProject = null,
  title
}: ProjectDialogProps) => {
  const [name, setName] = useState(selectedProject?.name || "");
  const [island, setIsland] = useState<Island | "">(selectedProject?.island || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    selectedProject?.start_date ? new Date(selectedProject.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    selectedProject?.end_date ? new Date(selectedProject.end_date) : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const islands: Island[] = ['Bonaire', 'Saba', 'Sint Eustatius'];

  const handleSubmit = async () => {
    if (!name || !island || !startDate || !endDate) {
      return;
    }

    setIsSubmitting(true);

    const projectData = {
      name,
      island: island as Island,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd')
    };

    const success = await onSubmit(projectData);
    
    if (success) {
      // Reset form
      if (!isEditing) {
        setName("");
        setIsland("");
        setStartDate(undefined);
        setEndDate(undefined);
      }
      onOpenChange(false);
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || (isEditing ? "Edit Project" : "Add New Project")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="island">Island</Label>
            <Select
              value={island}
              onValueChange={(value) => setIsland(value as Island)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="island">
                <SelectValue placeholder="Select an island" />
              </SelectTrigger>
              <SelectContent>
                {islands.map((islandOption) => (
                  <SelectItem key={islandOption} value={islandOption}>
                    {islandOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => startDate ? date < startDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name || !island || !startDate || !endDate}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update Project" : "Create Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDialog;
