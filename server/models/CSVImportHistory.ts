import mongoose, { Document, Schema } from 'mongoose';

export interface ICSVImportHistory extends Document<string> {
  _id: string;
  adminId: string;
  adminName: string;
  fileName: string;
  totalRows: number;
  usersCreated: number;
  usersSkipped: number;
  skillsCreated: number;
  coursesCreated: number;
  errorCount: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errors: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const CSVImportHistorySchema = new Schema<ICSVImportHistory>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  adminId: { type: String, required: true },
  adminName: { type: String, required: true, trim: true },
  fileName: { type: String, required: true, trim: true },
  totalRows: { type: Number, default: 0 },
  usersCreated: { type: Number, default: 0 },
  usersSkipped: { type: Number, default: 0 },
  skillsCreated: { type: Number, default: 0 },
  coursesCreated: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  status: { type: String, enum: ['SUCCESS', 'PARTIAL', 'FAILED'], default: 'SUCCESS' },
  errors: { type: [String], default: [] },
}, { timestamps: true });

export const CSVImportHistory = mongoose.model<ICSVImportHistory>('CSVImportHistory', CSVImportHistorySchema);
