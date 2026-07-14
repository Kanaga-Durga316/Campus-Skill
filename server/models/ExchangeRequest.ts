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
    scheduledAt: { type: Date },

    // ===== Enrollment / learning tracking (new) =====
    progress: { type: Number, default: 0, min: 0, max: 100 }, // course completion %
    quizScore: { type: Number, default: 0 },
    quizTotal: { type: Number, default: 0 },
    assignmentStatus: {
      type: String,
      enum: ['not_started', 'submitted', 'graded'],
      default: 'not_started'
    },
    assignmentText: { type: String },                          // student's submitted assignment
    feedback: {
      rating: { type: Number, min: 0, max: 5, default: 0 },
      comment: { type: String }
    },
    completedAt: { type: Date }
  },
  { timestamps: true, collection: 'exchangeRequests' }
);

export default model('ExchangeRequest', ExchangeRequestSchema);
