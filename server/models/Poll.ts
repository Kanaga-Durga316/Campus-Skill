import mongoose, { Document, Schema } from 'mongoose';

export interface IPoll extends Document<string> {
  _id: string;
  skillId: string;
  question: string;
  options: { text: string; votes: number }[];
  createdBy: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PollSchema = new Schema<IPoll>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  skillId: { type: String, required: true },
  question: { type: String, required: true, trim: true },
  options: [{ text: { type: String, required: true }, votes: { type: Number, default: 0 } }],
  createdBy: { type: String, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const Poll = mongoose.model<IPoll>('Poll', PollSchema, 'polls');
