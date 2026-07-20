import mongoose, { Document, Schema } from 'mongoose';

export interface IQuiz extends Document {
  _id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

const QuizSchema = new Schema<IQuiz>({
  _id: { type: String, required: true },
  question: { type: String, required: true, trim: true },
  options: { type: [String], required: true },
  correctIndex: { type: Number, required: true, min: 0 },
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
  title: { type: String, required: true, trim: true },
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
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: { type: [String], default: [] },
  level: { type: String, default: '' },
  owner: { _id: { type: String, required: true }, name: { type: String, required: true } },
  availability: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0 },
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
