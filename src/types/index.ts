
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
  
  // Add missing properties for cost calculations
  hourly_rate?: number;
  response_rate?: number;
  non_response_rate?: number;
  show_response_rates?: boolean;

  // Add missing properties for project date ranges
  start_date: string;
  end_date: string;
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
  
  // Add location properties
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  start_address?: string;
  end_address?: string;
  
  // Add property for unusual session review
  is_unusual_reviewed?: boolean;
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
  
  // Add location properties
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  start_address?: string;
  end_address?: string;
  
  // Add result property
  result?: string;
  
  // Add active status
  is_active?: boolean;
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

// Add Location interface
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// Add Schedule interface
export interface Schedule {
  id: string;
  interviewer_id: string;
  project_id?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'canceled';
  notes?: string;
  created_at?: string;
}
