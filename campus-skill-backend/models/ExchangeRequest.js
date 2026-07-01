const mongoose = require('mongoose');

const ExchangeRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillRequested: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    skillOffered: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
    status: { type: String, enum: ['open','accepted','rejected','completed','cancelled'], default: 'open' },
    message: { type: String },
    scheduledAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExchangeRequest', ExchangeRequestSchema);
