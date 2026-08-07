import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document<string> {
  _id: string;
  skillId: string;
  title: string;
  message: string;
  type: 'general' | 'assignment' | 'quiz' | 'live_session' | 'holiday';
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  skillId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ['general', 'assignment', 'quiz', 'live_session', 'holiday'], default: 'general' },
  createdBy: { type: String, required: true },
}, { timestamps: true });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema, 'announcements');
