import mongoose, { Document, Schema } from 'mongoose';

export interface IMeeting extends Document<string> {
  _id: string;
  skillId: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  link: string;
  platform: 'google_meet' | 'zoom' | 'teams';
  password?: string;
  reminder: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MeetingSchema = new Schema<IMeeting>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  skillId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: String, required: true },
  link: { type: String, required: true },
  platform: { type: String, enum: ['google_meet', 'zoom', 'teams'], default: 'google_meet' },
  password: { type: String, default: '' },
  reminder: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
}, { timestamps: true });

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema, 'meetings');
