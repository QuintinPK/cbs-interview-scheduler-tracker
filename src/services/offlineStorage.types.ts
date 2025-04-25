
import { Session, Interview, Interviewer, Project } from '@/types';

export interface DBSession extends Omit<Session, 'start_latitude' | 'start_longitude' | 'end_latitude' | 'end_longitude'> {
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
}

export interface DBInterview extends Omit<Interview, 'start_latitude' | 'start_longitude' | 'end_latitude' | 'end_longitude'> {
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
}

export interface DBInterviewer extends Interviewer {}

export interface DBProject extends Project {}

export interface DBProjectInterviewer {
  id?: number;
  interviewer_id: string;
  project_id: string;
}
