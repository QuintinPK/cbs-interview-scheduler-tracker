
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const DeleteSchedulesDialog = ({
  isOpen,
  onClose,
  onConfirm,
  password,
  setPassword,
  isLoading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  error: string | null;
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Schedules</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all interviewer schedules from the system. This affects all interviewers and all time periods.
            <br /><br />
            <strong className="text-destructive">This action cannot be undone.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-password">Confirm with Admin Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="text-red-500"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading || !password}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete All Schedules"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const DeleteSchedulesCard = () => {
  const { toast } = useToast();
  const { verifyPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteAllSchedules = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Verify the admin password
      const isValid = await verifyPassword(password);
      
      if (!isValid) {
        setError("Invalid password");
        return;
      }
      
      // Call the edge function to delete all schedules
      const { error: functionError } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "deleteAllSchedules"
        }
      });
      
      if (functionError) throw functionError;
      
      toast({
        title: "Success",
        description: "All schedules have been deleted",
      });
      
      setIsDeleteDialogOpen(false);
      setPassword("");
    } catch (error) {
      console.error("Error deleting schedules:", error);
      toast({
        title: "Error",
        description: "Failed to delete schedules",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Management</CardTitle>
        <CardDescription>
          Manage interviewer schedules across the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Delete All Schedules</h3>
              <p className="text-sm text-muted-foreground">
                Delete all interviewer scheduling data across the system.
              </p>
            </div>
            <Button 
              variant="destructive"
              onClick={() => {
                setError(null);
                setPassword("");
                setIsDeleteDialogOpen(true);
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Delete All Schedules
            </Button>
          </div>
        </div>

        <DeleteSchedulesDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteAllSchedules}
          password={password}
          setPassword={setPassword}
          isLoading={isLoading}
          error={error}
        />
      </CardContent>
    </Card>
  );
};

export default DeleteSchedulesCard;
