
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar, BarChart, Users, Loader2 } from "lucide-react";
import { Interviewer } from "@/types";

interface InterviewerListProps {
  interviewers: Interviewer[];
  loading: boolean;
  onEdit: (interviewer: Interviewer) => void;
  onDelete: (interviewer: Interviewer) => void;
  onSchedule: (interviewer: Interviewer) => void;
  onViewDashboard: (interviewer: Interviewer) => void;
  onManageProjects?: (interviewer: Interviewer) => void;
}

const InterviewerList: React.FC<InterviewerListProps> = ({
  interviewers,
  loading,
  onEdit,
  onDelete,
  onSchedule,
  onViewDashboard,
  onManageProjects
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Island</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cbs" />
                  </div>
                </TableCell>
              </TableRow>
            ) : interviewers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No interviewers found
                </TableCell>
              </TableRow>
            ) : (
              interviewers.map((interviewer) => (
                <TableRow key={interviewer.id}>
                  <TableCell className="font-medium">{interviewer.code}</TableCell>
                  <TableCell>{interviewer.first_name} {interviewer.last_name}</TableCell>
                  <TableCell>
                    {interviewer.island ? (
                      <Badge 
                        variant="default" 
                        style={{
                          backgroundColor: interviewer.island === 'Bonaire' 
                            ? '#FEF7CD' : 
                            interviewer.island === 'Saba' 
                            ? '#1EAEDB' : 
                            '#ea384c'
                        }}
                      >
                        {interviewer.island}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {interviewer.phone && (
                        <div className="text-sm">{interviewer.phone}</div>
                      )}
                      {interviewer.email && (
                        <div className="text-sm text-muted-foreground">{interviewer.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(interviewer)}
                        title="Edit Interviewer"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSchedule(interviewer)}
                        title="Schedule Interviewer"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDashboard(interviewer)}
                        title="View Dashboard"
                      >
                        <BarChart className="h-4 w-4" />
                      </Button>
                      
                      {onManageProjects && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onManageProjects(interviewer)}
                          title="Manage Projects"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(interviewer)}
                        title="Delete Interviewer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InterviewerList;
