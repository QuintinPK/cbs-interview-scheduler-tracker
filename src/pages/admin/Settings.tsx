
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Heading, HeadingDescription } from "@/components/ui/heading";
import ChangePasswordCard from "@/components/admin/settings/ChangePasswordCard";
import ProjectRenameCard from "@/components/admin/settings/ProjectRenameCard";
import DeleteDataCard from "@/components/admin/settings/DeleteDataCard";

const Settings = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Heading>Project Settings</Heading>
          <HeadingDescription>
            Manage your project settings, including security and data management options.
          </HeadingDescription>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <ProjectRenameCard />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <ChangePasswordCard />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <DeleteDataCard />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
