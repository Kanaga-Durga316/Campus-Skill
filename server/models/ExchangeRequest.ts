import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate {
  issued: boolean;
  certificateId: string;
  issuedAt: string;
}

export interface IExchangeRequest extends Document<string> {
  _id: string;
  requester: { _id: string; name: string };
  responder: { _id: string; name: string };
  skillRequested: {
    _id: string;
    title: string;
    category?: string;
    level?: string;
    courseDescription?: string;
    difficulty?: string;
    duration?: string;
    liveClassLink?: string;
    modules: any[];
  };
  skillOffered: { _id: string; title: string };
  status: string;
  message?: string;
  scheduledAt?: string;
  progress: number;
  completedModules: string[];
  quizScore: number;
  quizTotal: number;
  quizStatus: string;
  assignmentStatus: string;
  assignmentText?: string;
  completedExercises: string[];
  liveClassAttended: boolean;
  feedback: { rating: number; comment: string };
  certificate: ICertificate;
  completedAt?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ExchangeRequestSchema = new Schema<IExchangeRequest>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  requester: { _id: { type: String, required: true }, name: { type: String, required: true } },
  responder: { _id: { type: String, required: true }, name: { type: String, required: true } },
  skillRequested: {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, default: '' },
    level: { type: String, default: '' },
    courseDescription: { type: String, default: '' },
    difficulty: { type: String, default: '' },
    duration: { type: String, default: '' },
    liveClassLink: { type: String, default: '' },
    modules: { type: [Schema.Types.Mixed], default: [] },
  },
  skillOffered: { _id: { type: String, default: '' }, title: { type: String, default: '—' } },
  status: { type: String, enum: ['open', 'pending', 'accepted', 'in_progress', 'rejected', 'cancelled', 'completed'], default: 'open' },
  message: { type: String, default: '' },
  scheduledAt: { type: String, default: '' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  completedModules: { type: [String], default: [] },
  quizScore: { type: Number, default: 0, min: 0 },
  quizTotal: { type: Number, default: 0, min: 0 },
  quizStatus: { type: String, enum: ['not_started', 'passed', 'failed'], default: 'not_started' },
  assignmentStatus: { type: String, enum: ['not_started', 'submitted', 'graded'], default: 'not_started' },
  assignmentText: { type: String, default: '' },
  completedExercises: { type: [String], default: [] },
  liveClassAttended: { type: Boolean, default: false },
  feedback: {
    rating: { type: Number, default: 0, min: 0, max: 5 },
    comment: { type: String, default: '' },
  },
  certificate: {
    issued: { type: Boolean, default: false },
    certificateId: { type: String, default: '' },
    issuedAt: { type: String, default: '' },
  },
  completedAt: { type: String, default: '' },
}, { timestamps: true });

export const ExchangeRequest = mongoose.model<IExchangeRequest>('ExchangeRequest', ExchangeRequestSchema, 'requests');
