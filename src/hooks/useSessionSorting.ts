
import { useState, useMemo } from 'react';
import { Session } from '@/types';

type SortField = 'interviewer_code' | 'project' | 'duration';
type SortDirection = 'asc' | 'desc';

export const useSessionSorting = (
  sessions: Session[],
  getInterviewerCode: (id: string) => string,
  getProjectName: (id: string | undefined | null) => string
) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedSessions = useMemo(() => {
    if (!sortField) return sessions;

    return [...sessions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'interviewer_code':
          comparison = getInterviewerCode(a.interviewer_id).localeCompare(getInterviewerCode(b.interviewer_id));
          break;
        case 'project':
          comparison = getProjectName(a.project_id).localeCompare(getProjectName(b.project_id));
          break;
        case 'duration':
          const getDuration = (session: Session) => {
            if (!session.end_time) return -1; // Active sessions go last
            return new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
          };
          comparison = getDuration(a) - getDuration(b);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [sessions, sortField, sortDirection, getInterviewerCode, getProjectName]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return {
    sortedSessions,
    sortField,
    sortDirection,
    toggleSort
  };
};
