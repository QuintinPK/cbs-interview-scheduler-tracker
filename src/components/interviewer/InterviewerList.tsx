
import React from "react";
import { Button } from "@/components/ui/button";
import { Interviewer } from "@/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Pencil, Calendar, Trash2, Loader2, BarChart, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

interface InterviewerListProps {
  interviewers: Interviewer[];
  loading: boolean;
  onEdit: (interviewer: Interviewer) => void;
  onDelete: (interviewer: Interviewer) => void;
  onSchedule: (interviewer: Interviewer) => void;
  onViewDashboard: (interviewer: Interviewer) => void;
}

const InterviewerList: React.FC<InterviewerListProps> = ({
  interviewers,
  loading,
  onEdit,
  onDelete,
  onSchedule,
  onViewDashboard
}) => {
  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit character
    const cleaned = phone.replace(/\D/g, '');
    return cleaned;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Code</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
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
                <TableRow key={interviewer.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{interviewer.code}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => onViewDashboard(interviewer)} 
                      className="text-left hover:text-cbs hover:underline transition-colors font-medium"
                    >
                      {`${interviewer.first_name} ${interviewer.last_name}`}
                    </button>
                  </TableCell>
                  <TableCell>
                    {interviewer.phone ? (
                      <a 
                        href={`https://wa.me/${formatPhoneNumber(interviewer.phone)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        <span className="hover:underline">{interviewer.phone}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {interviewer.email ? (
                      <a 
                        href={`mailto:${interviewer.email}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        <span className="hover:underline">{interviewer.email}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDashboard(interviewer)}
                        title="Dashboard"
                        disabled={loading}
                        className="hover:bg-cbs/10 hover:text-cbs"
                      >
                        <BarChart className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(interviewer)}
                        title="Edit"
                        disabled={loading}
                        className="hover:bg-blue-100 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSchedule(interviewer)}
                        title="Schedule"
                        disabled={loading}
                        className="hover:bg-green-100 hover:text-green-600"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(interviewer)}
                        title="Delete"
                        disabled={loading}
                        className="hover:bg-red-100"
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
