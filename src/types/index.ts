
export interface Interviewer {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface Session {
  id: string;
  interviewerCode: string;
  startTime: string;
  endTime: string | null;
  startLocation?: Location;
  endLocation?: Location;
  isActive: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Schedule {
  id: string;
  interviewerCode: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}
