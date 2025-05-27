
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
  offlineId?: number; // Add this property
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
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}
