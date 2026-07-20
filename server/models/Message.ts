import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  from: { _id: string; name: string };
  to: { _id: string; name: string };
  text: string;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessageSchema = new Schema<IMessage>({
  _id: { type: String, required: true },
  from: { _id: { type: String, required: true }, name: { type: String, required: true } },
  to: { _id: { type: String, required: true }, name: { type: String, required: true } },
  text: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema, 'messages');
