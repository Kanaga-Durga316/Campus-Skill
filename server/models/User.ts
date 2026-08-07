import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document<string> {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'teacher' | 'admin';
  bio?: string;
  avatarUrl?: string;
  coverImage?: string;
  location?: string;
  preferredMode?: string;
  experienceLevel?: string;
  sessionDurationHours?: number;
  portfolioLinks?: string[];
  verificationStatus?: string;
  skills?: any[];
  createdAt?: Date;
  updatedAt?: Date;

  studentId?: string;
  college?: string;
  university?: string;
  semester?: string;
  cgpa?: number;
  graduationYear?: string;
  careerGoal?: string;
  academicInterests?: string[];
  skillsTeaching?: any[];
  skillsLearning?: any[];
  certificates?: any[];
  achievements?: any[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    resume?: string;
    leetcode?: string;
    hackerrank?: string;
    codechef?: string;
    kaggle?: string;
  };
  followers?: string[];
  following?: string[];
  profileVisibility?: 'public' | 'college' | 'connections' | 'private';
  privacySettings?: {
    showEmail?: boolean;
    showPhone?: boolean;
    showPortfolio?: boolean;
    showCertificates?: boolean;
    showAchievements?: boolean;
  };
  bookmarks?: string[];
  calendarEvents?: any[];
  teachingAnalytics?: {
    totalCourses?: number;
    studentsEnrolled?: number;
    completedCourses?: number;
    averageRating?: number;
    teachingHours?: number;
    assignmentsCreated?: number;
    quizzesCreated?: number;
    certificatesIssued?: number;
  };
  learningAnalytics?: {
    learningHours?: number;
    coursesCompleted?: number;
    coursesInProgress?: number;
    assignmentsSubmitted?: number;
    quizAverage?: number;
    currentStreak?: number;
    longestStreak?: number;
  };
  profileCompletion?: number;
  lastSeen?: Date;
  phoneNumber?: string;
  twoFactorEnabled?: boolean;
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  location: { type: String, default: '' },
  preferredMode: { type: String, default: 'online' },
  experienceLevel: { type: String, default: 'beginner' },
  sessionDurationHours: { type: Number, default: 1, min: 0 },
  portfolioLinks: { type: [String], default: [] },
  verificationStatus: { type: String, default: 'unverified' },
  skills: { type: [Schema.Types.Mixed], default: [] },

  studentId: { type: String, default: '' },
  college: { type: String, default: '' },
  university: { type: String, default: '' },
  semester: { type: String, default: '' },
  cgpa: { type: Number, default: 0, min: 0, max: 10 },
  graduationYear: { type: String, default: '' },
  careerGoal: { type: String, default: '' },
  academicInterests: { type: [String], default: [] },
  skillsTeaching: { type: [Schema.Types.Mixed], default: [] },
  skillsLearning: { type: [Schema.Types.Mixed], default: [] },
  certificates: { type: [Schema.Types.Mixed], default: [] },
  achievements: { type: [Schema.Types.Mixed], default: [] },
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    resume: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    hackerrank: { type: String, default: '' },
    codechef: { type: String, default: '' },
    kaggle: { type: String, default: '' },
  },
  followers: { type: [String], default: [] },
  following: { type: [String], default: [] },
  profileVisibility: { type: String, enum: ['public', 'college', 'connections', 'private'], default: 'public' },
  privacySettings: {
    showEmail: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: false },
    showPortfolio: { type: Boolean, default: true },
    showCertificates: { type: Boolean, default: true },
    showAchievements: { type: Boolean, default: true },
  },
  bookmarks: { type: [String], default: [] },
  calendarEvents: { type: [Schema.Types.Mixed], default: [] },
  teachingAnalytics: {
    totalCourses: { type: Number, default: 0 },
    studentsEnrolled: { type: Number, default: 0 },
    completedCourses: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    teachingHours: { type: Number, default: 0 },
    assignmentsCreated: { type: Number, default: 0 },
    quizzesCreated: { type: Number, default: 0 },
    certificatesIssued: { type: Number, default: 0 },
  },
  learningAnalytics: {
    learningHours: { type: Number, default: 0 },
    coursesCompleted: { type: Number, default: 0 },
    coursesInProgress: { type: Number, default: 0 },
    assignmentsSubmitted: { type: Number, default: 0 },
    quizAverage: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
  },
  profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
  lastSeen: { type: Date, default: Date.now },
  phoneNumber: { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
