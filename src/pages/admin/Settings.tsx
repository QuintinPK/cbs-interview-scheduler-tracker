import React, { useState, useEffect } from "react";

import AdminLayout from "@/components/layout/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

import DeleteDataCard from "@/components/admin/settings/DeleteDataCard";
import DeleteSchedulesCard from "@/components/admin/settings/DeleteSchedulesCard";
import { useFilter } from "@/contexts/FilterContext";

const Settings = () => {
  const { toast } = useToast();
  const { projectTitle, setProjectTitle, hourlyRate, setHourlyRate, responseRate, setResponseRate, nonResponseRate, setNonResponseRate, showResponseRates, setShowResponseRates, getRates } = useFilter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRates();
  }, [getRates]);

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectTitle(e.target.value);
    
    try {
      setLoading(true);
      
      const { error } = await supabase.functions.invoke('admin-functions', {
        body: {
          action: "updateProjectTitle",
          data: { title: e.target.value }
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Project title updated successfully",
      });
    } catch (error) {
      console.error("Error updating project title:", error);
      toast({
        title: "Error",
        description: "Could not update project title",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Title</CardTitle>
            <CardDescription>
              Update the title of the project. This will be displayed in the
              header of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Title</Label>
              <Input
                id="project-title"
                placeholder="Enter project title"
                value={projectTitle}
                onChange={handleTitleChange}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Data Management</h2>
          <div className="space-y-6">
            <DeleteDataCard />
            <DeleteSchedulesCard />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
