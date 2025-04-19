
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { parseInterviewersCsv, CsvInterviewer } from "@/utils/csvUtils";

interface Props {
  onImport: (interviewers: CsvInterviewer[]) => Promise<void>;
}

const InterviewerCsvImport: React.FC<Props> = ({ onImport }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const interviewers = parseInterviewersCsv(text);
      
      // Validate required fields
      const invalidEntries = interviewers.filter(
        i => !i.code || !i.first_name || !i.last_name
      );

      if (invalidEntries.length > 0) {
        toast({
          title: "Invalid CSV Format",
          description: "Some entries are missing required fields (code, first name, last name)",
          variant: "destructive",
        });
        return;
      }

      await onImport(interviewers);
      setOpen(false);
      toast({
        title: "Success",
        description: `Imported ${interviewers.length} interviewers successfully`,
      });
    } catch (error) {
      console.error("CSV import error:", error);
      toast({
        title: "Import Failed",
        description: "Failed to import CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset input
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-cbs hover:bg-cbs-light flex items-center gap-2"
      >
        <Upload size={16} />
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Interviewers from CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with the following columns:
              <br />
              Code, First Name, Last Name, Island, Phone Number, Email
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InterviewerCsvImport;
