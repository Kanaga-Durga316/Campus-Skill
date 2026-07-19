import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  requestRef?: mongoose.Types.ObjectId;
  text: string;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestRef: { type: Schema.Types.ObjectId, ref: 'ExchangeRequest' },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
