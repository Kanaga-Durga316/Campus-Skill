import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  bio?: string;
  avatarUrl?: string;
  location?: string;
  preferredMode?: string;
  experienceLevel?: string;
  sessionDurationHours?: number;
  portfolioLinks?: string[];
  verificationStatus?: string;
  skills?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  location: { type: String, default: '' },
  preferredMode: { type: String, default: 'online' },
  experienceLevel: { type: String, default: 'beginner' },
  sessionDurationHours: { type: Number, default: 1 },
  portfolioLinks: { type: [String], default: [] },
  verificationStatus: { type: String, default: 'unverified' },
  skills: { type: [Schema.Types.Mixed], default: [] },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);

export interface IQuiz extends Document {
  _id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

const QuizSchema = new Schema<IQuiz>({
  _id: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctIndex: { type: Number, required: true },
});

export interface IModule extends Document {
  _id: string;
  title: string;
  description?: string;
  notes?: string;
  notesFile?: string;
  videoLinks: string[];
  recordedVideoLinks: string[];
  liveClassLink?: string;
  assignments: string[];
  quizzes: IQuiz[];
}

const ModuleSchema = new Schema<IModule>({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  notes: { type: String, default: '' },
  notesFile: { type: String, default: '' },
  videoLinks: { type: [String], default: [] },
  recordedVideoLinks: { type: [String], default: [] },
  liveClassLink: { type: String, default: '' },
  assignments: { type: [String], default: [] },
  quizzes: { type: [QuizSchema], default: [] },
});

export interface ISkill extends Document {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  level?: string;
  owner: { _id: string; name: string };
  availability?: boolean;
  rating?: number;
  courseDescription?: string;
  notes?: string;
  notesFile?: string;
  videoLinks: string[];
  recordedVideoLinks: string[];
  liveClassLink?: string;
  referenceLinks: string[];
  assignments: string[];
  githubLink?: string;
  difficulty?: string;
  duration?: string;
  published: boolean;
  modules: IModule[];
  thumbnail?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SkillSchema = new Schema<ISkill>({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: { type: [String], default: [] },
  level: { type: String, default: '' },
  owner: { _id: String, name: String, required: true },
  availability: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  courseDescription: { type: String, default: '' },
  notes: { type: String, default: '' },
  notesFile: { type: String, default: '' },
  videoLinks: { type: [String], default: [] },
  recordedVideoLinks: { type: [String], default: [] },
  liveClassLink: { type: String, default: '' },
  referenceLinks: { type: [String], default: [] },
  assignments: { type: [String], default: [] },
  githubLink: { type: String, default: '' },
  difficulty: { type: String, default: '' },
  duration: { type: String, default: '' },
  published: { type: Boolean, default: false },
  modules: { type: [ModuleSchema], default: [] },
  thumbnail: { type: String, default: '' },
}, { timestamps: true });

export const Skill = mongoose.model<ISkill>('Skill', SkillSchema);

export interface ILearnSkill extends Document {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  level?: string;
  owner: { _id: string; name: string };
  availability?: boolean;
  rating?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const LearnSkillSchema = new Schema<ILearnSkill>({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: { type: [String], default: [] },
  level: { type: String, default: '' },
  owner: { _id: String, name: String, required: true },
  availability: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

export const LearnSkill = mongoose.model<ILearnSkill>('LearnSkill', LearnSkillSchema);

export interface IMessage extends Document {
  _id: string;
  from: { _id: string; name: string };
  to: { _id: string; name: string };
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  _id: { type: String, required: true },
  from: { _id: String, name: String, required: true },
  to: { _id: String, name: String, required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

export interface ICertificate {
  issued: boolean;
  certificateId: string;
  issuedAt: string;
}

export interface IRequest extends Document {
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
    modules: IModule[];
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
  liveClassAttended: boolean;
  feedback: { rating: number; comment: string };
  certificate: ICertificate;
  completedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>({
  _id: { type: String, required: true },
  requester: { _id: String, name: String, required: true },
  responder: { _id: String, name: String, required: true },
  skillRequested: {
    _id: String,
    title: String,
    category: String,
    level: String,
    courseDescription: String,
    difficulty: String,
    duration: String,
    liveClassLink: String,
    modules: [ModuleSchema],
  },
  skillOffered: { _id: String, title: String, required: true },
  status: { type: String, default: 'open' },
  message: { type: String, default: '' },
  scheduledAt: { type: String, default: '' },
  progress: { type: Number, default: 0 },
  completedModules: { type: [String], default: [] },
  quizScore: { type: Number, default: 0 },
  quizTotal: { type: Number, default: 0 },
  quizStatus: { type: String, default: 'not_started' },
  assignmentStatus: { type: String, default: 'not_started' },
  assignmentText: { type: String, default: '' },
  liveClassAttended: { type: Boolean, default: false },
  feedback: { rating: { type: Number, default: 0 }, comment: { type: String, default: '' } },
  certificate: {
    issued: { type: Boolean, default: false },
    certificateId: { type: String, default: '' },
    issuedAt: { type: String, default: '' },
  },
  completedAt: { type: String, default: '' },
}, { timestamps: true });

export const Request = mongoose.model<IRequest>('Request', RequestSchema);
