import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document<string> {
  _id: string;
  requestId: string;
  skillId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReviewSchema = new Schema<IReview>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  requestId: { type: String, required: true },
  skillId: { type: String, required: true },
  reviewerId: { type: String, required: true },
  revieweeId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { timestamps: true });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
