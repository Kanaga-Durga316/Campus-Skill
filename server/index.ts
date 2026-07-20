import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateToken, verifyToken } from './utils/auth.js';
import { authMiddleware, AuthRequest } from './utils/middleware.js';
import { uploadNotes } from './utils/upload.js';
import { computeProgress, gradeQuiz, generateCertificateId } from './utils/progress.js';
import { connectDatabase } from './config/db.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

/**
 * ============================================================================
 *  DEMO DATA STORE (in-memory only — no database)
 *  Shapes intentionally mirror the previous Mongoose documents so the
 *  existing React frontend keeps working unchanged.
 * ============================================================================
 */

let idCounter = 1000;
const nid = () => `demo_${++idCounter}`;

const users: any[] = [
  {
    _id: 'demo_user_1',
    name: 'Alex Student',
    email: 'alex@campus.edu',
    role: 'student',
    bio: 'Curious learner exploring programming and design.',
    avatarUrl: '',
    location: 'Campus North',
    preferredMode: 'online',
    experienceLevel: 'beginner',
    sessionDurationHours: 1,
    portfolioLinks: ['https://github.com/alex'],
    verificationStatus: 'verified',
    skills: [],
  },
  {
    _id: 'demo_user_2',
    name: 'Sam Teacher',
    email: 'sam@campus.edu',
    role: 'teacher',
    bio: 'Senior CS student who loves teaching Python & Web Dev.',
    avatarUrl: '',
    location: 'Campus South',
    preferredMode: 'hybrid',
    experienceLevel: 'advanced',
    sessionDurationHours: 2,
    portfolioLinks: ['https://github.com/sam'],
    verificationStatus: 'verified',
    skills: [],
  },
];

const skills: any[] = [
  {
    _id: 'demo_skill_1',
    title: 'Python Programming',
    description: 'Learn Python from scratch with hands-on exercises.',
    category: 'Programming',
    tags: ['python', 'coding'],
    level: 'Beginner',
    owner: { _id: 'demo_user_2', name: 'Sam Teacher' },
    availability: true,
    rating: 4.8,
    courseDescription: 'A friendly introduction to Python fundamentals.',
    notes: '',
    notesFile: '',
    videoLinks: ['https://youtube.com/watch?v=rfscVS0vtbw'],
    recordedVideoLinks: [],
    liveClassLink: 'https://meet.google.com/demo-python',
    referenceLinks: ['https://docs.python.org/3/tutorial/'],
    assignments: ['Write a function that prints the Fibonacci sequence.'],
    githubLink: 'https://github.com/sam/python-demo',
    difficulty: 'Beginner',
    duration: '4 weeks',
    published: true,
    thumbnail: '',
    modules: [
      {
        _id: 'demo_mod_1',
        title: 'Getting Started',
        description: 'Install Python and run your first script.',
        notes: 'Use the official installer for your OS.',
        notesFile: '',
        videoLinks: [],
        recordedVideoLinks: [],
        liveClassLink: '',
        assignments: [],
        quizzes: [
          {
            _id: 'demo_quiz_1',
            question: 'How do you print text in Python?',
            options: ['echo "hi"', 'print("hi")', 'console.log("hi")', 'say("hi")'],
            correctIndex: 1,
          },
        ],
      },
    ],
  },
  {
    _id: 'demo_skill_2',
    title: 'Public Speaking',
    description: 'Overcome stage fright and deliver confident talks.',
    category: 'Communication',
    tags: ['speaking', 'confidence'],
    level: 'All Levels',
    owner: { _id: 'demo_user_2', name: 'Sam Teacher' },
    availability: true,
    rating: 4.6,
    courseDescription: 'Practical techniques for clear, engaging speeches.',
    notes: '',
    notesFile: '',
    videoLinks: [],
    recordedVideoLinks: [],
    liveClassLink: '',
    referenceLinks: [],
    assignments: [],
    githubLink: '',
    difficulty: 'Beginner',
    duration: '2 weeks',
    published: true,
    thumbnail: '',
    modules: [],
  },
];

const learnSkills: any[] = [
  {
    _id: 'demo_learn_1',
    title: 'Guitar for Beginners',
    description: 'I want to learn basic chords and strumming.',
    category: 'Music',
    tags: ['guitar', 'music'],
    level: 'Beginner',
    owner: { _id: 'demo_user_1', name: 'Alex Student' },
    availability: true,
    rating: 0,
  },
];

const requests: any[] = [
  {
    _id: 'demo_req_1',
    requester: { _id: 'demo_user_1', name: 'Alex Student' },
    responder: { _id: 'demo_user_2', name: 'Sam Teacher' },
    skillRequested: {
      _id: 'demo_skill_1',
      title: 'Python Programming',
      category: 'Programming',
      level: 'Beginner',
      courseDescription: 'A friendly introduction to Python fundamentals.',
      difficulty: 'Beginner',
      duration: '4 weeks',
      liveClassLink: 'https://meet.google.com/demo-python',
      modules: [
        {
          _id: 'demo_mod_1',
          title: 'Getting Started',
          description: 'Install Python and run your first script.',
          notes: 'Use the official installer for your OS.',
          notesFile: '',
          videoLinks: [],
          recordedVideoLinks: [],
          liveClassLink: '',
          assignments: [],
          quizzes: [
            {
              _id: 'demo_quiz_1',
              question: 'How do you print text in Python?',
              options: ['echo "hi"', 'print("hi")', 'console.log("hi")', 'say("hi")'],
              correctIndex: 1,
            },
          ],
        },
      ],
    },
    skillOffered: {
      _id: 'demo_learn_1',
      title: 'Guitar for Beginners',
    },
    status: 'accepted',
    message: 'Hi! I would love to learn Python in exchange for guitar lessons.',
    scheduledAt: '',
    progress: 35,
    completedModules: ['demo_mod_1'],
    quizScore: 1,
    quizTotal: 1,
    quizStatus: 'passed',
    assignmentStatus: 'submitted',
    assignmentText: 'Here is my Fibonacci function.',
    liveClassAttended: true,
    feedback: { rating: 0, comment: '' },
    certificate: { issued: false, certificateId: '', issuedAt: '' },
    completedAt: '',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const messages: any[] = [];

// Helper: shallow clone so callers can't mutate the store accidentally
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// Health check
app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const existing = users.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user: any = {
      _id: nid(),
      name,
      email,
      role: role || 'student',
      bio: '',
      preferredMode: 'online',
      experienceLevel: 'beginner',
      sessionDurationHours: 1,
      portfolioLinks: [],
      verificationStatus: 'unverified',
      skills: [],
    };
    users.push(user);

    const token = generateToken(user._id);
    const { skills: _s, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Demo: accept any credentials; prefer a seeded user, else create one.
    let user = users.find((u) => u.email === email);
    if (!user) {
      user = {
        _id: nid(),
        name: email.split('@')[0] || 'Demo User',
        email,
        role: 'student',
        bio: '',
        preferredMode: 'online',
        experienceLevel: 'beginner',
        sessionDurationHours: 1,
        portfolioLinks: [],
        verificationStatus: 'unverified',
        skills: [],
      };
      users.push(user);
    }

    const token = generateToken(user._id);
    const { skills: _s, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== USER ROUTES =====
app.get('/api/users', (_req: Request, res: Response) => {
  const safe = users.map((u) => {
    const { skills: _s, ...rest } = u;
    return rest;
  });
  res.json(safe);
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = users.find((u) => u._id === String(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { skills: _s, ...rest } = user;
  res.json(rest);
});

app.put('/api/users/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (req.userId !== String(req.params.id) && req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = users.find((u) => u._id === String(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const {
      name,
      bio,
      avatarUrl,
      location,
      preferredMode,
      experienceLevel,
      sessionDurationHours,
      portfolioLinks,
      verificationStatus,
    } = req.body;

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (location !== undefined) user.location = location;
    if (preferredMode !== undefined) user.preferredMode = preferredMode;
    if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;
    if (sessionDurationHours !== undefined) user.sessionDurationHours = sessionDurationHours;
    if (portfolioLinks !== undefined) user.portfolioLinks = portfolioLinks;
    if (verificationStatus !== undefined) user.verificationStatus = verificationStatus;

    const { skills: _s, ...rest } = user;
    res.json(rest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ===== SKILL ROUTES =====
app.get('/api/skills', (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let result = skills;
    if (search) {
      const q = String(search).toLowerCase();
      result = skills.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          (s.tags || []).some((t: string) => t.toLowerCase().includes(q))
      );
    }
    res.json(result.map(clone));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

app.get('/api/skills/:id', (req: Request, res: Response) => {
  const skill = skills.find((s) => s._id === String(req.params.id));
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  res.json(clone(skill));
});

app.post('/api/skills', authMiddleware, uploadNotes, (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      level,
      courseDescription,
      notes,
      videoLinks,
      recordedVideoLinks,
      liveClassLink,
      referenceLinks,
      assignments,
      githubLink,
      difficulty,
      duration,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const ownerUser = users.find((u) => u._id === req.userId);
    const skill: any = {
      _id: nid(),
      title,
      description,
      category,
      tags: tags || [],
      level,
      owner: { _id: req.userId, name: ownerUser?.name || 'You' },
      courseDescription,
      notes,
      notesFile: req.file ? req.file.filename : undefined,
      videoLinks: typeof videoLinks === 'string' ? videoLinks.split(',').map((s: string) => s.trim()).filter(Boolean) : videoLinks || [],
      recordedVideoLinks: typeof recordedVideoLinks === 'string' ? recordedVideoLinks.split(',').map((s: string) => s.trim()).filter(Boolean) : recordedVideoLinks || [],
      liveClassLink,
      referenceLinks: typeof referenceLinks === 'string' ? referenceLinks.split(',').map((s: string) => s.trim()).filter(Boolean) : referenceLinks || [],
      assignments: typeof assignments === 'string' ? assignments.split(',').map((s: string) => s.trim()).filter(Boolean) : assignments || [],
      githubLink,
      difficulty,
      duration,
      published: false,
      modules: [],
      rating: 0,
    };
    skills.push(skill);
    res.status(201).json(clone(skill));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create skill' });
  }
});

app.put('/api/skills/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const skill = skills.find((s) => s._id === String(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, description, category, tags, level, availability, rating } = req.body;
    if (title !== undefined) skill.title = title;
    if (description !== undefined) skill.description = description;
    if (category !== undefined) skill.category = category;
    if (tags !== undefined) skill.tags = tags;
    if (level !== undefined) skill.level = level;
    if (availability !== undefined) skill.availability = availability;
    if (rating !== undefined) skill.rating = rating;

    res.json(clone(skill));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

app.delete('/api/skills/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const idx = skills.findIndex((s) => s._id === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Skill not found' });
    if (skills[idx].owner._id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    skills.splice(idx, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// ===== COURSE MANAGEMENT ROUTES (owner-only) =====
const toArr = (v: any): string[] =>
  typeof v === 'string'
    ? v.split(',').map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(v)
      ? v.map((s: any) => String(s).trim()).filter(Boolean)
      : [];

const findModule = (skill: any, moduleId: string) =>
  skill.modules.find((m: any) => m._id === moduleId);

app.post('/api/skills/:id/modules', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const skill = skills.find((s) => s._id === String(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Module title is required' });

    skill.modules.push({
      _id: nid(),
      title,
      description,
      notes: '',
      notesFile: '',
      videoLinks: [],
      recordedVideoLinks: [],
      liveClassLink: '',
      assignments: [],
      quizzes: [],
    });
    res.status(201).json(clone(skill));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add module' });
  }
});

app.put('/api/skills/:id/modules/:moduleId', authMiddleware, uploadNotes, (req: AuthRequest, res: Response) => {
  try {
    const skill = skills.find((s) => s._id === String(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = findModule(skill, String(req.params.moduleId));
    if (!module) return res.status(404).json({ error: 'Module not found' });

    const { title, description, notes, liveClassLink, videoLinks, recordedVideoLinks, assignments } = req.body;
    if (title !== undefined) module.title = title;
    if (description !== undefined) module.description = description;
    if (notes !== undefined) module.notes = notes;
    if (liveClassLink !== undefined) module.liveClassLink = liveClassLink;
    if (videoLinks !== undefined) module.videoLinks = toArr(videoLinks);
    if (recordedVideoLinks !== undefined) module.recordedVideoLinks = toArr(recordedVideoLinks);
    if (assignments !== undefined) module.assignments = toArr(assignments);
    if (req.file) module.notesFile = req.file.filename;

    res.json(clone(skill));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update module' });
  }
});

app.delete('/api/skills/:id/modules/:moduleId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const skill = skills.find((s) => s._id === String(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const idx = skill.modules.findIndex((m: any) => m._id === String(req.params.moduleId));
    if (idx === -1) return res.status(404).json({ error: 'Module not found' });
    skill.modules.splice(idx, 1);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete module' });
  }
});

app.post('/api/skills/:id/modules/:moduleId/quizzes', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const skill = skills.find((s) => s._id === String(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = findModule(skill, String(req.params.moduleId));
    if (!module) return res.status(404).json({ error: 'Module not found' });

    const { question, options, correctIndex } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    module.quizzes.push({
      _id: nid(),
      question,
      options: toArr(options),
      correctIndex: typeof correctIndex === 'number' ? correctIndex : 0,
    });
    res.status(201).json(clone(skill));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add quiz' });
  }
});

app.put('/api/skills/:id/modules/:moduleId/quizzes/:quizId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const skill = skills.find((s) => s._id === String(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = findModule(skill, String(req.params.moduleId));
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const quiz = module.quizzes.find((q: any) => q._id === String(req.params.quizId));
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { question, options, correctIndex } = req.body;
    if (question !== undefined) quiz.question = question;
    if (options !== undefined) quiz.options = toArr(options);
    if (correctIndex !== undefined) quiz.correctIndex = correctIndex;

    res.json(clone(skill));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update quiz' });
  }
});

app.delete('/api/skills/:id/modules/:moduleId/quizzes/:quizId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const skill = skills.find((s) => s._id === String(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = findModule(skill, String(req.params.moduleId));
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const idx = module.quizzes.findIndex((q: any) => q._id === String(req.params.quizId));
    if (idx === -1) return res.status(404).json({ error: 'Quiz not found' });
    module.quizzes.splice(idx, 1);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete quiz' });
  }
});

app.patch('/api/skills/:id/publish', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const skill = skills.find((s) => s._id === String(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { published, courseDescription, difficulty, duration, liveClassLink } = req.body;
    if (published !== undefined) skill.published = published;
    if (courseDescription !== undefined) skill.courseDescription = courseDescription;
    if (difficulty !== undefined) skill.difficulty = difficulty;
    if (duration !== undefined) skill.duration = duration;
    if (liveClassLink !== undefined) skill.liveClassLink = liveClassLink;

    res.json(clone(skill));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to publish course' });
  }
});

// ===== LEARN-SKILLS ROUTES =====
app.get('/api/learn-skills', (_req: Request, res: Response) => {
  res.json(learnSkills.map(clone));
});

app.get('/api/learn-skills/:id', (req: Request, res: Response) => {
  const skill = learnSkills.find((s) => s._id === String(req.params.id));
  if (!skill) return res.status(404).json({ error: 'Learn skill not found' });
  res.json(clone(skill));
});

app.post('/api/learn-skills', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, tags, level } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const ownerUser = users.find((u) => u._id === req.userId);
    const skill: any = {
      _id: nid(),
      title,
      description,
      category,
      tags: tags || [],
      level,
      owner: { _id: req.userId, name: ownerUser?.name || 'You' },
      availability: true,
      rating: 0,
    };
    learnSkills.push(skill);
    res.status(201).json(clone(skill));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create learn skill' });
  }
});

app.put('/api/learn-skills/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const skill = learnSkills.find((s) => s._id === String(req.params.id));
    if (!skill) return res.status(404).json({ error: 'Learn skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { title, description, category, tags, level, availability, rating } = req.body;
    if (title !== undefined) skill.title = title;
    if (description !== undefined) skill.description = description;
    if (category !== undefined) skill.category = category;
    if (tags !== undefined) skill.tags = tags;
    if (level !== undefined) skill.level = level;
    if (availability !== undefined) skill.availability = availability;
    if (rating !== undefined) skill.rating = rating;

    res.json(clone(skill));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update learn skill' });
  }
});

app.delete('/api/learn-skills/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const idx = learnSkills.findIndex((s) => s._id === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Learn skill not found' });
    if (learnSkills[idx].owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });
    learnSkills.splice(idx, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete learn skill' });
  }
});

// ===== EXCHANGE REQUEST ROUTES =====
app.get('/api/requests', (_req: Request, res: Response) => {
  res.json(requests.map(clone));
});

app.get('/api/requests/enrollments', authMiddleware, (req: AuthRequest, res: Response) => {
  const result = requests
    .filter(
      (r) => r.requester._id === req.userId && ['accepted', 'completed'].includes(r.status)
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(result.map(clone));
});

app.get('/api/requests/teacher', authMiddleware, (req: AuthRequest, res: Response) => {
  const result = requests
    .filter((r) => r.responder._id === req.userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(result.map(clone));
});

app.get('/api/requests/:id', (req: Request, res: Response) => {
  const request = requests.find((r) => r._id === String(req.params.id));
  if (!request) return res.status(404).json({ error: 'Request not found' });
  res.json(clone(request));
});

app.post('/api/requests', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { responderId, skillRequestedId, skillOfferedId, message } = req.body;

    if (!responderId || !skillRequestedId) {
      return res.status(400).json({ error: 'Responder and skill requested required' });
    }

    const responder = users.find((u) => u._id === responderId);
    const requester = users.find((u) => u._id === req.userId);
    const skillRequested = skills.find((s) => s._id === skillRequestedId);
    const skillOffered = skillOfferedId ? skills.find((s) => s._id === skillOfferedId) : null;

    const request: any = {
      _id: nid(),
      requester: { _id: req.userId, name: requester?.name || 'You' },
      responder: { _id: responderId, name: responder?.name || 'Unknown' },
      skillRequested: skillRequested
        ? {
            _id: skillRequested._id,
            title: skillRequested.title,
            category: skillRequested.category,
            level: skillRequested.level,
            courseDescription: skillRequested.courseDescription,
            difficulty: skillRequested.difficulty,
            duration: skillRequested.duration,
            liveClassLink: skillRequested.liveClassLink,
            modules: skillRequested.modules,
          }
        : { _id: skillRequestedId, title: 'Unknown Skill' },
      skillOffered: skillOffered ? { _id: skillOffered._id, title: skillOffered.title } : { _id: skillOfferedId, title: '—' },
      status: 'open',
      message,
      scheduledAt: '',
      progress: 0,
      completedModules: [],
      quizScore: 0,
      quizTotal: 0,
      quizStatus: 'not_started',
      assignmentStatus: 'not_started',
      assignmentText: '',
      liveClassAttended: false,
      feedback: { rating: 0, comment: '' },
      certificate: { issued: false, certificateId: '', issuedAt: '' },
      completedAt: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    requests.push(request);
    res.status(201).json(clone(request));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create request' });
  }
});

app.put('/api/requests/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const request = requests.find((r) => r._id === String(req.params.id));
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isRequester = request.requester._id === req.userId;
    const isResponder = request.responder._id === req.userId;
    if (!isRequester && !isResponder) return res.status(403).json({ error: 'Unauthorized' });

    const {
      status, message, scheduledAt,
      completedModules, assignmentText, answers, liveClassAttended,
      assignmentStatus, feedback,
    } = req.body;

    if (status !== undefined) {
      if ((status === 'accepted' || status === 'rejected') && !isResponder) {
        return res.status(403).json({ error: 'Only the teacher can accept or reject' });
      }
      if (status === 'cancelled' && !isRequester) {
        return res.status(403).json({ error: 'Only the student can cancel' });
      }
      request.status = status;
      if (status === 'completed' && !request.completedAt) request.completedAt = new Date().toISOString();
    }

    if (message !== undefined) request.message = message;
    if (scheduledAt !== undefined) request.scheduledAt = scheduledAt;

    if (assignmentStatus !== undefined) {
      if (!isResponder) return res.status(403).json({ error: 'Only the teacher can update assignment status' });
      request.assignmentStatus = assignmentStatus;
    }
    if (feedback !== undefined) {
      if (!isRequester) return res.status(403).json({ error: 'Only the student can submit feedback' });
      if (feedback.rating !== undefined) request.feedback.rating = feedback.rating;
      if (feedback.comment !== undefined) request.feedback.comment = feedback.comment;
    }

    if (completedModules !== undefined || assignmentText !== undefined || answers !== undefined || liveClassAttended !== undefined) {
      if (!isRequester) return res.status(403).json({ error: 'Only the student can update their learning progress' });

      if (completedModules !== undefined) {
        const arr = Array.isArray(completedModules) ? completedModules.map(String) : [];
        request.completedModules = Array.from(new Set(arr));
      }
      if (assignmentText !== undefined) {
        request.assignmentText = assignmentText;
        if (assignmentText && assignmentText.trim().length > 0) {
          request.assignmentStatus = 'submitted';
        }
      }
      if (liveClassAttended !== undefined) {
        request.liveClassAttended = !!liveClassAttended;
      }
      if (answers !== undefined) {
        const result = gradeQuiz(answers, request.skillRequested);
        request.quizScore = result.score;
        request.quizTotal = result.total;
        request.quizStatus = result.status;
      }

      request.progress = computeProgress({
        completedModules: request.completedModules,
        assignmentStatus: request.assignmentStatus,
        quizStatus: request.quizStatus,
        liveClassAttended: request.liveClassAttended,
        skill: request.skillRequested,
      });

      if (request.progress >= 100 && request.status !== 'completed') {
        request.status = 'completed';
        request.completedAt = new Date().toISOString();
      }
    }

    if (request.status === 'completed' && !(request.certificate && request.certificate.issued)) {
      const skillId = request.skillRequested?._id?.toString() || '';
      request.certificate = {
        issued: true,
        certificateId: generateCertificateId(skillId, request._id.toString()),
        issuedAt: new Date().toISOString(),
      };
    }

    request.updatedAt = new Date().toISOString();
    res.json(clone(request));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update request' });
  }
});

app.delete('/api/requests/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const idx = requests.findIndex((r) => r._id === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });
    if (requests[idx].requester._id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    requests.splice(idx, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// ===== MESSAGE ROUTES =====
app.get('/api/messages', authMiddleware, (req: AuthRequest, res: Response) => {
  const result = messages.filter(
    (m) => m.from._id === req.userId || m.to._id === req.userId
  );
  res.json(result.map(clone));
});

app.get('/api/messages/:userId', authMiddleware, (req: AuthRequest, res: Response) => {
  const result = messages
    .filter(
      (m) =>
        (m.from._id === req.userId && m.to._id === String(req.params.userId)) ||
        (m.from._id === String(req.params.userId) && m.to._id === req.userId)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(result.map(clone));
});

app.post('/api/messages', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { toUserId, text } = req.body;

    if (!toUserId || !text) {
      return res.status(400).json({ error: 'Recipient and text required' });
    }

    const fromUser = users.find((u) => u._id === req.userId);
    const toUser = users.find((u) => u._id === toUserId);
    const message: any = {
      _id: nid(),
      from: { _id: req.userId, name: fromUser?.name || 'You' },
      to: { _id: toUserId, name: toUser?.name || 'Unknown' },
      text,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    messages.push(message);
    res.status(201).json(clone(message));
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.put('/api/messages/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { read } = req.body;
    const message = messages.find((m) => m._id === String(req.params.id));
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.to._id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    message.read = read;
    res.json(clone(message));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Central error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err.message);
  res.status(400).json({ error: err.message || 'Request failed' });
});

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
})();
