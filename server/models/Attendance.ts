import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document<string> {
  _id: string;
  skillId: string;
  meetingId: string;
  userId: string;
  userName: string;
  status: 'present' | 'absent' | 'late';
  createdAt?: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  skillId: { type: String, required: true },
  meetingId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
}, { timestamps: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema, 'attendance');
