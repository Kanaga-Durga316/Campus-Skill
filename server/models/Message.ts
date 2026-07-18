// NOTE: Plain TypeScript types (no database). The backend serves
// in-memory mock data. Restore a real persistence layer later.

export interface Message {
  _id: string;
  from: string;
  to: string;
  requestRef?: string;
  text: string;
  read: boolean;
  createdAt?: string;
  updatedAt?: string;
}
