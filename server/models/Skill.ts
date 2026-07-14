import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// ===== Quiz subdocument (lives inside a Module) =====
const QuizSchema = new Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String }],          // answer choices
    correctIndex: { type: Number, default: 0 } // index of correct option
  },
  { _id: true }
);

// ===== Module subdocument (a course is made of unlimited modules) =====
const ModuleSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    notes: { type: String },                    // text notes
    notesFile: { type: String },                // uploaded PDF path (stored on disk)
    videoLinks: [{ type: String }],             // YouTube links (embedded)
    recordedVideoLinks: [{ type: String }],     // recorded session videos
    liveClassLink: { type: String },            // Google Meet / Zoom / Teams
    assignments: [{ type: String }],            // assignments for this module
    quizzes: [QuizSchema]                        // quizzes for this module
  },
  { timestamps: true }
);

const SkillSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    tags: [String],
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    level: { type: String },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },

    // ===== Learning Resources (added) =====
    courseDescription: { type: String },
    notes: { type: String },                                  // text notes
    notesFile: { type: String },                               // path to uploaded PDF (stored on disk, not in DB)
    videoLinks: [{ type: String }],                           // YouTube links (embedded)
    recordedVideoLinks: [{ type: String }],                   // recorded session videos
    liveClassLink: { type: String },                          // Google Meet / Zoom / Teams
    referenceLinks: [{ type: String }],                       // reference websites
    assignments: [{ type: String }],                          // assignments
    githubLink: { type: String },                             // optional GitHub repo
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    duration: { type: String },                                // e.g. "3 hours"

    // ===== Course structure (new) =====
    published: { type: Boolean, default: false },             // teacher publishes the course
    thumbnail: { type: String },                               // optional course thumbnail URL
    modules: [ModuleSchema]                                    // unlimited modules
  },
  { timestamps: true }
);

SkillSchema.index({ title: 'text', description: 'text' });

export default model('Skill', SkillSchema);
