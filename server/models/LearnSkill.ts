import mongoose, { Document, Schema } from 'mongoose';

export interface ILearnSkill extends Document<string> {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  level?: string;
  owner: { _id: string; name: string };
  availability?: boolean;
  rating?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const LearnSkillSchema = new Schema<ILearnSkill>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: { type: [String], default: [] },
  level: { type: String, default: '' },
  owner: { _id: { type: String, required: true }, name: { type: String, required: true } },
  availability: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export const LearnSkill = mongoose.model<ILearnSkill>('LearnSkill', LearnSkillSchema, 'learnskills');
