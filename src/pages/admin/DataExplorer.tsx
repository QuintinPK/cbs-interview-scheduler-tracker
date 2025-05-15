
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import DataExplorerContent from "@/components/data-explorer/DataExplorerContent";

const DataExplorer = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <h1 className="text-3xl font-bold">Data Explorer</h1>
        </div>
        
        <DataExplorerContent />
      </div>
    </AdminLayout>
  );
};

export default DataExplorer;
