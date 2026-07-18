// NOTE: This is now a plain TypeScript interface (no database).
// The backend serves in-memory mock data. Re-introduce a real DB later
// by mapping these shapes back to your persistence layer.

export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'student' | 'teacher';
  bio?: string;
  avatarUrl?: string;
  location?: string;
  skills?: string[];
  preferredMode?: 'online' | 'offline' | 'hybrid';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  sessionDurationHours?: number;
  portfolioLinks?: string[];
  verificationStatus?: 'unverified' | 'pending' | 'verified';
  createdAt?: string;
  updatedAt?: string;
}

export function sanitizeUser(u: User) {
  const { passwordHash, ...rest } = u;
  return rest;
}
