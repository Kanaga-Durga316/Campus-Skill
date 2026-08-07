import mongoose, { Document, Schema } from 'mongoose';

export interface IChatRoom extends Document<string> {
  _id: string;
  name: string;
  type: 'private' | 'group';
  skillId?: string;
  participants: { _id: string; name: string }[];
  createdBy: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatRoomSchema = new Schema<IChatRoom>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['private', 'group'], default: 'private' },
  skillId: { type: String, default: '' },
  participants: [{ _id: { type: String, required: true }, name: { type: String, required: true } }],
  createdBy: { type: String, required: true },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: null },
}, { timestamps: true });

export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema, 'chatrooms');
