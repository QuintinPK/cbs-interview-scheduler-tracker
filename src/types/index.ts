
export interface Session {
  id: string;
  interviewer_id: string;
  project_id?: string;
  start_time: string;
  end_time?: string;
  start_latitude?: number;
  start_longitude?: number;
  start_address?: string;
  end_latitude?: number;
  end_longitude?: number;
  end_address?: string;
  is_active: boolean;
  created_at?: string;
  offlineId?: number;
  is_unusual_reviewed?: boolean;
}

export interface Interview {
  id: string;
  session_id: string;
  project_id?: string;
  start_time: string;
  end_time?: string;
  start_latitude?: number;
  start_longitude?: number;
  start_address?: string;
  end_latitude?: number;
  end_longitude?: number;
  end_address?: string;
  result?: 'response' | 'non-response';
  is_active: boolean;
  created_at?: string;
  candidate_name: string;
}

export interface Interviewer {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  island?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  excluded_islands?: ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
  hourly_rate?: number;
  response_rate?: number;
  non_response_rate?: number;
  show_response_rates?: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Note {
  id: string;
  interviewer_id: string;
  title?: string;
  content: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Evaluation {
  id: string;
  interviewer_id: string;
  rating: number;
  remarks?: string;
  project_id?: string;
  session_id?: string;
  created_at: string;
  created_by?: string;
  tags?: EvaluationTag[];
}

export interface EvaluationTag {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  interviewer_id: string;
  project_id?: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  created_at: string;
}
