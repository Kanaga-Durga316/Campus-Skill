import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const SkillSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    tags: [String],
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    level: { type: String },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

SkillSchema.index({ title: 'text', description: 'text' });

export default model('Skill', SkillSchema);
