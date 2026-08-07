import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyGroup extends Document<string> {
  _id: string;
  name: string;
  description: string;
  skillId: string;
  members: { _id: string; name: string }[];
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const StudyGroupSchema = new Schema<IStudyGroup>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  skillId: { type: String, required: true },
  members: [{ _id: { type: String, required: true }, name: { type: String, required: true } }],
  createdBy: { type: String, required: true },
}, { timestamps: true });

export const StudyGroup = mongoose.model<IStudyGroup>('StudyGroup', StudyGroupSchema, 'studygroups');
