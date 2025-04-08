
import { Interviewer, Session } from "@/types";

export const mockInterviewers: Interviewer[] = [
  {
    id: "1",
    code: "INT001",
    first_name: "John",
    last_name: "Doe",
    phone: "0612345678",
    email: "john.doe@example.com",
  },
  {
    id: "2",
    code: "INT002",
    first_name: "Jane",
    last_name: "Smith",
    phone: "0687654321",
    email: "jane.smith@example.com",
  },
  {
    id: "3",
    code: "INT003",
    first_name: "Michael",
    last_name: "Johnson",
    phone: "0611223344",
    email: "michael.johnson@example.com",
  },
  {
    id: "4",
    code: "INT004",
    first_name: "Emily",
    last_name: "Williams",
    phone: "0699887766",
    email: "emily.williams@example.com",
  }
];

export const mockSessions: Session[] = [
  {
    id: "1",
    interviewer_id: "1",
    start_time: "2023-07-01T09:00:00.000Z",
    end_time: "2023-07-01T17:00:00.000Z",
    start_latitude: 52.3676,
    start_longitude: 4.9041,
    start_address: "Amsterdam, Netherlands",
    end_latitude: 52.3676,
    end_longitude: 4.9041,
    end_address: "Amsterdam, Netherlands",
    is_active: false
  },
  {
    id: "2",
    interviewer_id: "2",
    start_time: "2023-07-02T08:30:00.000Z",
    end_time: "2023-07-02T16:30:00.000Z",
    start_latitude: 51.9244,
    start_longitude: 4.4777,
    start_address: "Rotterdam, Netherlands",
    end_latitude: 51.9244,
    end_longitude: 4.4777,
    end_address: "Rotterdam, Netherlands",
    is_active: false
  },
  {
    id: "3",
    interviewer_id: "3",
    start_time: new Date().toISOString(),
    end_time: null,
    start_latitude: 52.0116,
    start_longitude: 4.3571,
    start_address: "The Hague, Netherlands",
    end_latitude: null,
    end_longitude: null,
    end_address: null,
    is_active: true
  }
];
