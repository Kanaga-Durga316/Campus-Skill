import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscussionPost extends Document<string> {
  _id: string;
  skillId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  pinned: boolean;
  bestAnswerId?: string;
  reported: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const DiscussionPostSchema = new Schema<IDiscussionPost>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  skillId: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  pinned: { type: Boolean, default: false },
  bestAnswerId: { type: String, default: '' },
  reported: { type: Boolean, default: false },
}, { timestamps: true });

export const DiscussionPost = mongoose.model<IDiscussionPost>('DiscussionPost', DiscussionPostSchema, 'discussionposts');
