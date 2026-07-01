const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    tags: [String],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    level: { type: String },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

SkillSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Skill', SkillSchema);
