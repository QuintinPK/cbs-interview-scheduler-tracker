
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Star,
  BarChart,
} from "lucide-react";
import { Interviewer, Project } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface InterviewerListProps {
  interviewers: Interviewer[];
  loading: boolean;
  onEdit: (interviewer: Interviewer) => void;
  onDelete: (interviewer: Interviewer) => void;
  onSchedule: (interviewer: Interviewer) => void;
  onViewDashboard: (interviewer: Interviewer) => void;
  onEvaluate?: (interviewer: Interviewer) => void;
  interviewerProjects: { [key: string]: any[] };
}

const InterviewerList: React.FC<InterviewerListProps> = ({
  interviewers,
  loading,
  onEdit,
  onDelete,
  onSchedule,
  onViewDashboard,
  onEvaluate,
  interviewerProjects,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Island</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (interviewers.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
        <p className="text-muted-foreground">No interviewers found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Island</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviewers.map((interviewer) => (
              <TableRow key={interviewer.id}>
                <TableCell className="font-mono text-xs">
                  {interviewer.code}
                </TableCell>
                <TableCell className="font-semibold">
                  {interviewer.first_name} {interviewer.last_name}
                </TableCell>
                <TableCell>
                  {interviewer.island ? (
                    <Badge variant="outline">{interviewer.island}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Not specified
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[250px]">
                    {interviewerProjects[interviewer.id] &&
                    interviewerProjects[interviewer.id].length > 0 ? (
                      interviewerProjects[interviewer.id]
                        .slice(0, 3)
                        .map((project) => (
                          <Badge
                            key={project.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {project.name}
                          </Badge>
                        ))
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        No projects
                      </span>
                    )}
                    {interviewerProjects[interviewer.id] &&
                      interviewerProjects[interviewer.id].length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{interviewerProjects[interviewer.id].length - 3} more
                        </Badge>
                      )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSchedule(interviewer)}
                      title="Schedule"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDashboard(interviewer)}
                      title="View Dashboard"
                    >
                      <BarChart className="h-4 w-4" />
                    </Button>
                    
                    {onEvaluate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEvaluate(interviewer)}
                        title="Evaluate"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(interviewer)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(interviewer)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InterviewerList;
