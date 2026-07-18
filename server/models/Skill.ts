// NOTE: Plain TypeScript types (no database). The backend serves
// in-memory mock data. Restore Mongoose here when adding a real DB.

export interface Quiz {
  _id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Module {
  _id: string;
  title: string;
  description?: string;
  notes?: string;
  notesFile?: string;
  videoLinks?: string[];
  recordedVideoLinks?: string[];
  liveClassLink?: string;
  assignments?: string[];
  quizzes?: Quiz[];
}

export interface Skill {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  owner?: string | UserRef;
  level?: string;
  availability?: boolean;
  rating?: number;
  courseDescription?: string;
  notes?: string;
  notesFile?: string;
  videoLinks?: string[];
  recordedVideoLinks?: string[];
  liveClassLink?: string;
  referenceLinks?: string[];
  assignments?: string[];
  githubLink?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  published?: boolean;
  thumbnail?: string;
  modules?: Module[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRef {
  _id: string;
  name: string;
  email: string;
}

import type { User } from './User.js';
