export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  created_by?: string;
  excluded_islands?: ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
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
  created_by?: string;
}

export interface Session {
  id: string;
  project_id: string;
  interviewer_id: string;
  start_time: string;
  end_time?: string;
  is_active: boolean;
  created_at?: string;
  created_by?: string;
}

export interface Interview {
  id: string;
  session_id: string;
  candidate_name: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  created_at?: string;
  created_by?: string;
}

// Evaluation related types
export interface Evaluation {
  id: string;
  interviewer_id: string;
  project_id?: string;
  session_id?: string;
  rating: number;
  remarks?: string;
  created_at: string;
  created_by?: string;
  tags?: EvaluationTag[];
  projects?: {
    name: string;
  };
}

export interface EvaluationTag {
  id: string;
  name: string;
  category: string;
  created_at: string;
}
