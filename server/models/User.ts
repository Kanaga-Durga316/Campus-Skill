import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  bio?: string;
  avatarUrl?: string;
  location?: string;
  preferredMode?: string;
  experienceLevel?: string;
  sessionDurationHours?: number;
  portfolioLinks?: string[];
  verificationStatus?: string;
  skills?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  location: { type: String, default: '' },
  preferredMode: { type: String, default: 'online' },
  experienceLevel: { type: String, default: 'beginner' },
  sessionDurationHours: { type: Number, default: 1, min: 0 },
  portfolioLinks: { type: [String], default: [] },
  verificationStatus: { type: String, default: 'unverified' },
  skills: { type: [Schema.Types.Mixed], default: [] },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
