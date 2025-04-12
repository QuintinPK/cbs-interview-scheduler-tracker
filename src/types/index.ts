
export interface Interviewer {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  island?: 'Bonaire' | 'Saba' | 'Sint Eustatius'; // Add island field
}

export interface Session {
  id: string;
  interviewer_id: string;
  project_id?: string; // Add project_id to track which project a session belongs to
  start_time: string;
  end_time: string | null;
  start_latitude: number | null;
  start_longitude: number | null;
  start_address: string | null;
  end_latitude: number | null;
  end_longitude: number | null;
  end_address: string | null;
  is_active: boolean;
}

export interface Interview {
  id: string;
  session_id: string;
  project_id?: string; // Add project_id to track which project an interview belongs to
  start_time: string;
  end_time: string | null;
  start_latitude: number | null;
  start_longitude: number | null;
  start_address: string | null;
  end_latitude: number | null;
  end_longitude: number | null;
  end_address: string | null;
  result: 'response' | 'non-response' | null | string; // Including string to accommodate Supabase data
  is_active: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Schedule {
  id: string;
  interviewer_id: string;
  project_id?: string; // Add project_id to track which project a schedule belongs to
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

// Add new Project interface
export interface Project {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  island: 'Bonaire' | 'Saba' | 'Sint Eustatius';
}

// Add interface for the project-interviewer relationship
export interface ProjectInterviewer {
  id: string;
  project_id: string;
  interviewer_id: string;
}
