import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
  link: { type: String, default: '' },
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
