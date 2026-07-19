import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate {
  issued: boolean;
  certificateId?: string;
  issuedAt?: Date;
}

export interface IFeedback {
  rating?: number;
  comment?: string;
}

export interface IExchangeRequest extends Document {
  requester: mongoose.Types.ObjectId;
  responder: mongoose.Types.ObjectId;
  skillRequested?: mongoose.Types.ObjectId;
  skillOffered?: mongoose.Types.ObjectId;
  status: 'open' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  message?: string;
  scheduledAt?: Date;
  progress?: number;
  completedModules?: string[];
  quizScore?: number;
  quizTotal?: number;
  quizStatus?: 'not_started' | 'passed' | 'failed';
  assignmentStatus?: 'not_started' | 'submitted' | 'graded';
  assignmentText?: string;
  liveClassAttended?: boolean;
  feedback?: IFeedback;
  certificate?: ICertificate;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    issued: { type: Boolean, default: false },
    certificateId: { type: String },
    issuedAt: { type: Date },
  },
  { _id: false }
);

const FeedbackSchema = new Schema<IFeedback>(
  {
    rating: { type: Number },
    comment: { type: String },
  },
  { _id: false }
);

const ExchangeRequestSchema = new Schema<IExchangeRequest>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    responder: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    skillRequested: { type: Schema.Types.ObjectId, ref: 'Skill' },
    skillOffered: { type: Schema.Types.ObjectId, ref: 'Skill' },
    status: {
      type: String,
      enum: ['open', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'open',
    },
    message: { type: String },
    scheduledAt: { type: Date },
    progress: { type: Number, default: 0 },
    completedModules: [{ type: String }],
    quizScore: { type: Number },
    quizTotal: { type: Number },
    quizStatus: { type: String, enum: ['not_started', 'passed', 'failed'] },
    assignmentStatus: { type: String, enum: ['not_started', 'submitted', 'graded'] },
    assignmentText: { type: String },
    liveClassAttended: { type: Boolean },
    feedback: { type: FeedbackSchema, default: () => ({}) },
    certificate: { type: CertificateSchema, default: () => ({ issued: false }) },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IExchangeRequest>('ExchangeRequest', ExchangeRequestSchema);
