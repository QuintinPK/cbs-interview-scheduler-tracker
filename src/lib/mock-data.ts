
import { Interviewer, Session } from "@/types";

export const mockInterviewers: Interviewer[] = [
  {
    id: "1",
    code: "INT001",
    firstName: "John",
    lastName: "Doe",
    phone: "0612345678",
    email: "john.doe@example.com",
  },
  {
    id: "2",
    code: "INT002",
    firstName: "Jane",
    lastName: "Smith",
    phone: "0687654321",
    email: "jane.smith@example.com",
  },
  {
    id: "3",
    code: "INT003",
    firstName: "Michael",
    lastName: "Johnson",
    phone: "0611223344",
    email: "michael.johnson@example.com",
  },
  {
    id: "4",
    code: "INT004",
    firstName: "Emily",
    lastName: "Williams",
    phone: "0699887766",
    email: "emily.williams@example.com",
  }
];

export const mockSessions: Session[] = [
  {
    id: "1",
    interviewerCode: "INT001",
    startTime: "2023-07-01T09:00:00.000Z",
    endTime: "2023-07-01T17:00:00.000Z",
    startLocation: {
      latitude: 52.3676,
      longitude: 4.9041,
      address: "Amsterdam, Netherlands"
    },
    endLocation: {
      latitude: 52.3676,
      longitude: 4.9041,
      address: "Amsterdam, Netherlands"
    },
    isActive: false
  },
  {
    id: "2",
    interviewerCode: "INT002",
    startTime: "2023-07-02T08:30:00.000Z",
    endTime: "2023-07-02T16:30:00.000Z",
    startLocation: {
      latitude: 51.9244,
      longitude: 4.4777,
      address: "Rotterdam, Netherlands"
    },
    endLocation: {
      latitude: 51.9244,
      longitude: 4.4777,
      address: "Rotterdam, Netherlands"
    },
    isActive: false
  },
  {
    id: "3",
    interviewerCode: "INT003",
    startTime: new Date().toISOString(),
    endTime: null,
    startLocation: {
      latitude: 52.0116,
      longitude: 4.3571,
      address: "The Hague, Netherlands"
    },
    isActive: true
  }
];
