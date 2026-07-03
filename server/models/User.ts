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
    location: { type: String }
  },
  { timestamps: true, toJSON: { transform: (doc, ret) => { delete ret.passwordHash; return ret; } } }
);

export default model('User', UserSchema);
