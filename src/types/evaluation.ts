
// Define the evaluation types
export interface InterviewerRating {
  id: string;
  interviewerId: string;
  score: number; // 1-5 rating
  comment?: string;
  createdAt: string;
  createdBy: string;
}

export interface RatingStats {
  average: number;
  count: number;
}
