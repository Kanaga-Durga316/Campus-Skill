import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscussionReply extends Document<string> {
  _id: string;
  postId: string;
  skillId: string;
  authorId: string;
  authorName: string;
  content: string;
  likes: string[];
  highlighted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const DiscussionReplySchema = new Schema<IDiscussionReply>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  postId: { type: String, required: true },
  skillId: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true, trim: true },
  likes: [{ type: String }],
  highlighted: { type: Boolean, default: false },
}, { timestamps: true });

export const DiscussionReply = mongoose.model<IDiscussionReply>('DiscussionReply', DiscussionReplySchema, 'discussionreplies');
