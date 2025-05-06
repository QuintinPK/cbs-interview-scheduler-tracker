
import React from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Interview } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import CoordinatePopup from "../ui/CoordinatePopup";
import InterviewTable from "./InterviewTable";
import InterviewDeleteDialog from "./InterviewDeleteDialog";
import InterviewEditDialog from "./InterviewEditDialog";
import useInterviewManagement from "@/hooks/useInterviewManagement";

interface InterviewsListProps {
  interviews: Interview[];
  refreshInterviews: () => Promise<void>;
}

const InterviewsList: React.FC<InterviewsListProps> = ({ interviews, refreshInterviews }) => {
  const {
    selectedInterview,
    isDeleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    editingInterview,
    setEditingInterview,
    isSubmitting,
    selectedCoordinate,
    isMapOpen,
    setIsMapOpen,
    getResultBadge,
    handleDeleteClick,
    handleEditClick,
    handleCoordinateClick,
    confirmDelete,
    handleSaveEdit
  } = useInterviewManagement(refreshInterviews);

  return (
    <>
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Interview Details</CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <InterviewTable 
            interviews={interviews}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            handleCoordinateClick={handleCoordinateClick}
            getResultBadge={getResultBadge}
          />
        </CardContent>
      </Card>

      <InterviewDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirmDelete={confirmDelete}
        isDeleting={isDeleting}
      />

      <InterviewEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveEdit}
        isSubmitting={isSubmitting}
        editingInterview={editingInterview}
        setEditingInterview={setEditingInterview}
      />
      
      <CoordinatePopup
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)} 
        coordinate={selectedCoordinate}
      />
    </>
  );
};

export default InterviewsList;
