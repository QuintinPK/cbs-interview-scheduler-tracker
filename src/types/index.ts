export interface Interviewer {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  island?: 'Bonaire' | 'Saba' | 'Sint Eustatius';
}

export interface Session {
  id: string;
  interviewer_id: string;
  project_id?: string;
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
  project_id?: string;
  start_time: string;
  end_time: string | null;
  start_latitude: number | null;
  start_longitude: number | null;
  start_address: string | null;
  end_latitude: number | null;
  end_longitude: number | null;
  end_address: string | null;
  result: 'response' | 'non-response' | null | string;
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
  project_id?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  excluded_islands: ('Bonaire' | 'Saba' | 'Sint Eustatius')[];
}

export interface ProjectInterviewer {
  id: string;
  project_id: string;
  interviewer_id: string;
}
