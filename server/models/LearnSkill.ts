// NOTE: Plain TypeScript types (no database). The backend serves
// in-memory mock data. Restore a real persistence layer later.

export interface LearnSkill {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  owner?: string;
  level?: string;
  availability?: boolean;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}
