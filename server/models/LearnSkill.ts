import mongoose, { Schema, Document } from 'mongoose';

export interface ILearnSkill extends Document {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  owner?: mongoose.Types.ObjectId;
  level?: string;
  availability?: boolean;
  rating?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const LearnSkillSchema = new Schema<ILearnSkill>(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    tags: [{ type: String }],
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    level: { type: String },
    availability: { type: Boolean },
    rating: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<ILearnSkill>('LearnSkill', LearnSkillSchema);
