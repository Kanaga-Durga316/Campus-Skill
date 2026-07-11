import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ExchangeRequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    responder: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    skillRequested: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    skillOffered: { type: Schema.Types.ObjectId, ref: 'Skill' },
    status: { type: String, enum: ['open','accepted','rejected','completed','cancelled'], default: 'open' },
    message: { type: String },
    scheduledAt: { type: Date }
  },
  { timestamps: true, collection: 'exchangeRequests' }
);

export default model('ExchangeRequest', ExchangeRequestSchema);
