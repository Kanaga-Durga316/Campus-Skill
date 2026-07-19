import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuiz {
  _id?: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface IModule {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  notes?: string;
  notesFile?: string;
  videoLinks?: string[];
  recordedVideoLinks?: string[];
  liveClassLink?: string;
  assignments?: string[];
  quizzes?: Types.DocumentArray<IQuiz & Document>;
}

export interface ISkill extends Document {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  owner?: mongoose.Types.ObjectId;
  level?: string;
  availability?: boolean;
  rating?: number;
  courseDescription?: string;
  notes?: string;
  notesFile?: string;
  videoLinks?: string[];
  recordedVideoLinks?: string[];
  liveClassLink?: string;
  referenceLinks?: string[];
  assignments?: string[];
  githubLink?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  published?: boolean;
  thumbnail?: string;
  modules?: Types.DocumentArray<IModule & Document>;
  createdAt?: Date;
  updatedAt?: Date;
}

const QuizSchema = new Schema<IQuiz>({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, default: 0 },
});

const ModuleSchema = new Schema<IModule>({
  title: { type: String, required: true },
  description: { type: String },
  notes: { type: String },
  notesFile: { type: String },
  videoLinks: [{ type: String }],
  recordedVideoLinks: [{ type: String }],
  liveClassLink: { type: String },
  assignments: [{ type: String }],
  quizzes: [QuizSchema],
});

const SkillSchema = new Schema<ISkill>(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    tags: [{ type: String }],
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    level: { type: String },
    availability: { type: Boolean },
    rating: { type: Number },
    courseDescription: { type: String },
    notes: { type: String },
    notesFile: { type: String },
    videoLinks: [{ type: String }],
    recordedVideoLinks: [{ type: String }],
    liveClassLink: { type: String },
    referenceLinks: [{ type: String }],
    assignments: [{ type: String }],
    githubLink: { type: String },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    duration: { type: String },
    published: { type: Boolean, default: false },
    thumbnail: { type: String },
    modules: [ModuleSchema],
  },
  { timestamps: true }
);

export default mongoose.model<ISkill>('Skill', SkillSchema);
