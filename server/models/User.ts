import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], default: 'student' },
    bio: { type: String },
    avatarUrl: { type: String },
    skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    location: { type: String },

    // ===== Added profile fields =====
    preferredMode: { type: String, default: 'online' }, // e.g. online/offline/hybrid
    experienceLevel: { type: String, default: 'beginner' }, // e.g. beginner/intermediate/advanced
    sessionDurationHours: { type: Number, default: 1 }, // store as hours
    portfolioLinks: { type: [String], default: [] }, // list of URLs
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified'],
      default: 'unverified'
    }
  },
  {
    timestamps: true,
    toJSON: { transform: (doc, ret) => { delete ret.passwordHash; return ret; } }
  }
);


export default model('User', UserSchema);
