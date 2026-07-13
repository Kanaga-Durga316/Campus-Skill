import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Separate collection for skills a user WANTS to learn
const LearnSkillSchema = new Schema(
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
  { timestamps: true, collection: 'learnSkills' }
);

export default model('LearnSkill', LearnSkillSchema);
