import mongoose, { Document, Schema } from 'mongoose';

export interface ISharedFile extends Document<string> {
  _id: string;
  skillId: string;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt?: Date;
}

const SharedFileSchema = new Schema<ISharedFile>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  skillId: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  fileName: { type: String, required: true, trim: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
}, { timestamps: true });

export const SharedFile = mongoose.model<ISharedFile>('SharedFile', SharedFileSchema, 'sharedfiles');
