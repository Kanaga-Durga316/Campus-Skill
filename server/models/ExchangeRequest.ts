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

    // ===== Enrollment / learning tracking =====
    progress: { type: Number, default: 0, min: 0, max: 100 }, // course completion % (auto-calculated)
    completedModules: [{ type: String }],                      // module _id strings marked complete by the student
    quizScore: { type: Number, default: 0 },
    quizTotal: { type: Number, default: 0 },
    quizStatus: {
      type: String,
      enum: ['not_started', 'passed', 'failed'],
      default: 'not_started'
    },
    assignmentStatus: {
      type: String,
      enum: ['not_started', 'submitted', 'graded'],
      default: 'not_started'
    },
    assignmentText: { type: String },                          // student's submitted assignment
    liveClassAttended: { type: Boolean, default: false },      // live class attendance recorded
    feedback: {
      rating: { type: Number, min: 0, max: 5, default: 0 },
      comment: { type: String }
    },
    certificate: {
      issued: { type: Boolean, default: false },
      certificateId: { type: String },
      issuedAt: { type: Date }
    },
    completedAt: { type: Date }
  },
  { timestamps: true, collection: 'exchangeRequests' }
);

export default model('ExchangeRequest', ExchangeRequestSchema);
