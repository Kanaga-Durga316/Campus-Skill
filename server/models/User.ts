import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'student' | 'teacher';
  bio?: string;
  avatarUrl?: string;
  location?: string;
  skills?: mongoose.Types.ObjectId[];
  preferredMode?: 'online' | 'offline' | 'hybrid';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  sessionDurationHours?: number;
  portfolioLinks?: string[];
  verificationStatus?: 'unverified' | 'pending' | 'verified';
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['student', 'teacher'], default: 'student' },
    bio: { type: String },
    avatarUrl: { type: String },
    location: { type: String },
    skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    preferredMode: { type: String, enum: ['online', 'offline', 'hybrid'] },
    experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    sessionDurationHours: { type: Number },
    portfolioLinks: [{ type: String }],
    verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified'], default: 'unverified' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
