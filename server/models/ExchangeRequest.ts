// NOTE: Plain TypeScript types (no database). The backend serves
// in-memory mock data. Restore a real persistence layer later.

export interface Certificate {
  issued: boolean;
  certificateId?: string;
  issuedAt?: string;
}

export interface ExchangeRequest {
  _id: string;
  requester: string;
  responder: string;
  skillRequested: string;
  skillOffered?: string;
  status: 'open' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  message?: string;
  scheduledAt?: string;
  progress?: number;
  completedModules?: string[];
  quizScore?: number;
  quizTotal?: number;
  quizStatus?: 'not_started' | 'passed' | 'failed';
  assignmentStatus?: 'not_started' | 'submitted' | 'graded';
  assignmentText?: string;
  liveClassAttended?: boolean;
  feedback?: { rating: number; comment?: string };
  certificate?: Certificate;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
