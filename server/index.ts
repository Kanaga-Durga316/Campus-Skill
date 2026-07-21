import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateToken, verifyToken, hashPassword, comparePassword } from './utils/auth.js';
import { authMiddleware, AuthRequest } from './utils/middleware.js';
import { uploadNotes } from './utils/upload.js';
import { computeProgress, gradeQuiz, generateCertificateId } from './utils/progress.js';
import { connectDatabase } from '../config/db.js';
import { User, Skill, LearnSkill, ExchangeRequest, Message, Notification, Review } from './models/index.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

let idCounter = 1000;
const nid = () => `demo_${++idCounter}`;

async function seedDatabase() {
  const userCount = await User.countDocuments().exec();
  if (userCount > 0) return;

  const demoPassword = await hashPassword('demo1234');

  await User.insertMany([
    {
      _id: 'demo_user_1',
      name: 'Alex Student',
      email: 'alex@campus.edu',
      password: demoPassword,
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
      password: demoPassword,
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
  ]);

  await Skill.insertMany([
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
  ]);

  await LearnSkill.insertMany([
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
  ]);

  const skillRequested = await Skill.findById('demo_skill_1').lean().exec();
  await ExchangeRequest.insertMany([
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
  ]);
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const existing = await User.findOne({ email }).lean().exec();
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      _id: nid(),
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      bio: '',
      preferredMode: 'online',
      experienceLevel: 'beginner',
      sessionDurationHours: 1,
      portfolioLinks: [],
      verificationStatus: 'unverified',
      skills: [],
    });

    const token = generateToken(user._id);
    const userObj = user.toObject ? user.toObject() : user;
    const { skills: _s, password: _p, ...safeUser } = userObj;
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

    const user = await User.findOne({ email }).select('+password').lean().exec();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, user.password!);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    const { skills: _s, password: _p, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== USER ROUTES =====
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const users = await User.find().lean().exec();
    const safe = users.map((u: any) => {
      const { skills: _s, ...rest } = u;
      return rest;
    });
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).lean().exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { skills: _s, ...rest } = user;
    res.json(rest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userId !== String(req.params.id) && req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.params.id).lean().exec();
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

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (bio !== undefined) update.bio = bio;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
    if (location !== undefined) update.location = location;
    if (preferredMode !== undefined) update.preferredMode = preferredMode;
    if (experienceLevel !== undefined) update.experienceLevel = experienceLevel;
    if (sessionDurationHours !== undefined) update.sessionDurationHours = sessionDurationHours;
    if (portfolioLinks !== undefined) update.portfolioLinks = portfolioLinks;
    if (verificationStatus !== undefined) update.verificationStatus = verificationStatus;

    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true }).lean().exec();
    const { skills: _s, ...rest } = updated!;
    res.json(rest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ===== SKILL ROUTES =====
app.get('/api/skills', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const query: any = {};
    if (search) {
      const q = String(search);
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }
    const result = await Skill.find(query).lean().exec();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

app.get('/api/skills/:id', async (req: Request, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json(skill);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

app.post('/api/skills', authMiddleware, uploadNotes, async (req: AuthRequest, res: Response) => {
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

    const ownerUser = await User.findById(req.userId).lean().exec();
    const skill = await Skill.create({
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
    });
    res.status(201).json(skill);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create skill' });
  }
});

app.put('/api/skills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, description, category, tags, level, availability, rating } = req.body;
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (tags !== undefined) update.tags = tags;
    if (level !== undefined) update.level = level;
    if (availability !== undefined) update.availability = availability;
    if (rating !== undefined) update.rating = rating;

    const updated = await Skill.findByIdAndUpdate(req.params.id, update, { new: true }).lean().exec();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

app.delete('/api/skills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await Skill.findByIdAndDelete(req.params.id).exec();
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

app.post('/api/skills/:id/modules', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Module title is required' });

    const newModule = {
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
    };

    await Skill.findByIdAndUpdate(req.params.id, {
      $push: { modules: newModule },
    }).exec();

    const updated = await Skill.findById(req.params.id).lean().exec();
    res.status(201).json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add module' });
  }
});

app.put('/api/skills/:id/modules/:moduleId', authMiddleware, uploadNotes, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.find((m: any) => m._id === String(req.params.moduleId));
    if (!module) return res.status(404).json({ error: 'Module not found' });

    const { title, description, notes, liveClassLink, videoLinks, recordedVideoLinks, assignments } = req.body;
    const update: any = {};
    if (title !== undefined) update['modules.$.title'] = title;
    if (description !== undefined) update['modules.$.description'] = description;
    if (notes !== undefined) update['modules.$.notes'] = notes;
    if (liveClassLink !== undefined) update['modules.$.liveClassLink'] = liveClassLink;
    if (videoLinks !== undefined) update['modules.$.videoLinks'] = toArr(videoLinks);
    if (recordedVideoLinks !== undefined) update['modules.$.recordedVideoLinks'] = toArr(recordedVideoLinks);
    if (assignments !== undefined) update['modules.$.assignments'] = toArr(assignments);
    if (req.file) update['modules.$.notesFile'] = req.file.filename;

    await Skill.updateOne(
      { _id: req.params.id, 'modules._id': req.params.moduleId },
      { $set: update }
    ).exec();

    const updated = await Skill.findById(req.params.id).lean().exec();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update module' });
  }
});

app.delete('/api/skills/:id/modules/:moduleId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.find((m: any) => m._id === String(req.params.moduleId));
    if (!module) return res.status(404).json({ error: 'Module not found' });

    await Skill.updateOne(
      { _id: req.params.id },
      { $pull: { modules: { _id: req.params.moduleId } } }
    ).exec();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete module' });
  }
});

app.post('/api/skills/:id/modules/:moduleId/quizzes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.find((m: any) => m._id === String(req.params.moduleId));
    if (!module) return res.status(404).json({ error: 'Module not found' });

    const { question, options, correctIndex } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const newQuiz = {
      _id: nid(),
      question,
      options: toArr(options),
      correctIndex: typeof correctIndex === 'number' ? correctIndex : 0,
    };

    await Skill.updateOne(
      { _id: req.params.id, 'modules._id': req.params.moduleId },
      { $push: { 'modules.$.quizzes': newQuiz } }
    ).exec();

    const updated = await Skill.findById(req.params.id).lean().exec();
    res.status(201).json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add quiz' });
  }
});

app.put('/api/skills/:id/modules/:moduleId/quizzes/:quizId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.find((m: any) => m._id === String(req.params.moduleId));
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const quiz = module.quizzes.find((q: any) => q._id === String(req.params.quizId));
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { question, options, correctIndex } = req.body;
    const update: any = {};
    if (question !== undefined) update['modules.$.quizzes.$.question'] = question;
    if (options !== undefined) update['modules.$.quizzes.$.options'] = toArr(options);
    if (correctIndex !== undefined) update['modules.$.quizzes.$.correctIndex'] = correctIndex;

    await Skill.updateOne(
      { _id: req.params.id, 'modules._id': req.params.moduleId, 'modules.quizzes._id': req.params.quizId },
      { $set: update }
    ).exec();

    const updated = await Skill.findById(req.params.id).lean().exec();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update quiz' });
  }
});

app.delete('/api/skills/:id/modules/:moduleId/quizzes/:quizId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.find((m: any) => m._id === String(req.params.moduleId));
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const quiz = module.quizzes.find((q: any) => q._id === String(req.params.quizId));
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    await Skill.updateOne(
      { _id: req.params.id, 'modules._id': req.params.moduleId },
      { $pull: { 'modules.$.quizzes': { _id: req.params.quizId } } }
    ).exec();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete quiz' });
  }
});

app.patch('/api/skills/:id/publish', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { published, courseDescription, difficulty, duration, liveClassLink } = req.body;
    const update: any = {};
    if (published !== undefined) update.published = published;
    if (courseDescription !== undefined) update.courseDescription = courseDescription;
    if (difficulty !== undefined) update.difficulty = difficulty;
    if (duration !== undefined) update.duration = duration;
    if (liveClassLink !== undefined) update.liveClassLink = liveClassLink;

    const updated = await Skill.findByIdAndUpdate(req.params.id, update, { new: true }).lean().exec();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to publish course' });
  }
});

// ===== LEARN-SKILLS ROUTES =====
app.get('/api/learn-skills', async (_req: Request, res: Response) => {
  try {
    const result = await LearnSkill.find().lean().exec();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch learn skills' });
  }
});

app.get('/api/learn-skills/:id', async (req: Request, res: Response) => {
  try {
    const skill = await LearnSkill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Learn skill not found' });
    res.json(skill);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch learn skill' });
  }
});

app.post('/api/learn-skills', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, tags, level } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const ownerUser = await User.findById(req.userId).lean().exec();
    const skill = await LearnSkill.create({
      _id: nid(),
      title,
      description,
      category,
      tags: tags || [],
      level,
      owner: { _id: req.userId, name: ownerUser?.name || 'You' },
      availability: true,
      rating: 0,
    });
    res.status(201).json(skill);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create learn skill' });
  }
});

app.put('/api/learn-skills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await LearnSkill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Learn skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { title, description, category, tags, level, availability, rating } = req.body;
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (tags !== undefined) update.tags = tags;
    if (level !== undefined) update.level = level;
    if (availability !== undefined) update.availability = availability;
    if (rating !== undefined) update.rating = rating;

    const updated = await LearnSkill.findByIdAndUpdate(req.params.id, update, { new: true }).lean().exec();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update learn skill' });
  }
});

app.delete('/api/learn-skills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await LearnSkill.findById(req.params.id).lean().exec();
    if (!skill) return res.status(404).json({ error: 'Learn skill not found' });
    if (skill.owner._id !== req.userId) return res.status(403).json({ error: 'Unauthorized' });
    await LearnSkill.findByIdAndDelete(req.params.id).exec();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete learn skill' });
  }
});

// ===== EXCHANGE REQUEST ROUTES =====
app.get('/api/requests', async (_req: Request, res: Response) => {
  try {
    const result = await ExchangeRequest.find().lean().exec();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.get('/api/requests/enrollments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ExchangeRequest.find({ 'requester._id': req.userId })
      .where('status').in(['accepted', 'completed'])
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

app.get('/api/requests/teacher', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ExchangeRequest.find({ 'responder._id': req.userId })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teacher requests' });
  }
});

app.get('/api/requests/:id', async (req: Request, res: Response) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id).lean().exec();
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

app.post('/api/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { responderId, skillRequestedId, skillOfferedId, message } = req.body;

    if (!responderId || !skillRequestedId) {
      return res.status(400).json({ error: 'Responder and skill requested required' });
    }

    const responder = await User.findById(responderId).lean().exec();
    const requester = await User.findById(req.userId).lean().exec();
    const skillRequested = await Skill.findById(skillRequestedId).lean().exec();
    const skillOffered = skillOfferedId ? await LearnSkill.findById(skillOfferedId).lean().exec() : null;

    const request = await ExchangeRequest.create({
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
    });

    // Auto-notify responder about the new exchange request
    await Notification.create({
      _id: nid(),
      userId: responderId,
      type: 'request',
      message: `${requester?.name || 'Someone'} sent you an exchange request for ${skillRequested?.title || 'a skill'}.`,
      read: false,
      link: '/requests',
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create request' });
  }
});

app.put('/api/requests/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id).lean().exec();
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isRequester = request.requester._id === req.userId;
    const isResponder = request.responder._id === req.userId;
    if (!isRequester && !isResponder) return res.status(403).json({ error: 'Unauthorized' });

    const {
      status, message, scheduledAt,
      completedModules, assignmentText, answers, liveClassAttended,
      assignmentStatus, feedback,
    } = req.body;

    const update: any = {};

    if (status !== undefined) {
      if ((status === 'accepted' || status === 'rejected') && !isResponder) {
        return res.status(403).json({ error: 'Only the teacher can accept or reject' });
      }
      if (status === 'cancelled' && !isRequester) {
        return res.status(403).json({ error: 'Only the student can cancel' });
      }
      update.status = status;
      if (status === 'completed' && !request.completedAt) {
        update.completedAt = new Date().toISOString();
      }
    }

    if (message !== undefined) update.message = message;
    if (scheduledAt !== undefined) update.scheduledAt = scheduledAt;

    if (assignmentStatus !== undefined) {
      if (!isResponder) return res.status(403).json({ error: 'Only the teacher can update assignment status' });
      update.assignmentStatus = assignmentStatus;
    }
    if (feedback !== undefined) {
      if (!isRequester) return res.status(403).json({ error: 'Only the student can submit feedback' });
      update['feedback.rating'] = feedback.rating;
      update['feedback.comment'] = feedback.comment;
    }

    if (completedModules !== undefined || assignmentText !== undefined || answers !== undefined || liveClassAttended !== undefined) {
      if (!isRequester) return res.status(403).json({ error: 'Only the student can update their learning progress' });

      if (completedModules !== undefined) {
        const arr = Array.isArray(completedModules) ? completedModules.map(String) : [];
        update.completedModules = Array.from(new Set(arr));
      }
      if (assignmentText !== undefined) {
        update.assignmentText = assignmentText;
        if (assignmentText && assignmentText.trim().length > 0) {
          update.assignmentStatus = 'submitted';
        }
      }
      if (liveClassAttended !== undefined) {
        update.liveClassAttended = !!liveClassAttended;
      }
      if (answers !== undefined) {
        const result = gradeQuiz(answers, request.skillRequested);
        update.quizScore = result.score;
        update.quizTotal = result.total;
        update.quizStatus = result.status;
      }

      const skill = await Skill.findById(request.skillRequested._id).lean().exec();
      const progress = computeProgress({
        completedModules: completedModules || request.completedModules,
        assignmentStatus: update.assignmentStatus || request.assignmentStatus,
        quizStatus: update.quizStatus || request.quizStatus,
        liveClassAttended: update.liveClassAttended ?? request.liveClassAttended,
        skill: skill || request.skillRequested,
      });
      update.progress = progress;

      if (progress >= 100 && request.status !== 'completed') {
        update.status = 'completed';
        if (!request.completedAt) update.completedAt = new Date().toISOString();
      }
    }

    if (request.status === 'completed' && !(request.certificate && request.certificate.issued)) {
      const skillId = request.skillRequested?._id?.toString() || '';
      update.certificate = {
        issued: true,
        certificateId: generateCertificateId(skillId, request._id.toString()),
        issuedAt: new Date().toISOString(),
      };
    }

    // Auto-notify requester if request was accepted or rejected
    if (update.status === 'accepted') {
      await Notification.create({
        _id: nid(),
        userId: request.requester._id,
        type: 'request_accepted',
        message: `${request.responder.name} accepted your exchange request for ${request.skillRequested?.title || 'a skill'}!`,
        read: false,
        link: '/requests',
      });
    } else if (update.status === 'rejected') {
      await Notification.create({
        _id: nid(),
        userId: request.requester._id,
        type: 'request_rejected',
        message: `${request.responder.name} declined your exchange request for ${request.skillRequested?.title || 'a skill'}.`,
        read: false,
        link: '/requests',
      });
    }

    update.updatedAt = new Date().toISOString();

    const updated = await ExchangeRequest.findByIdAndUpdate(req.params.id, update, { new: true }).lean().exec();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update request' });
  }
});

app.delete('/api/requests/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id).lean().exec();
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.requester._id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await ExchangeRequest.findByIdAndDelete(req.params.id).exec();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// ===== MESSAGE ROUTES =====
app.get('/api/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await Message.find({
      $or: [
        { 'from._id': req.userId },
        { 'to._id': req.userId },
      ],
    }).lean().exec();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/messages/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await Message.find({
      $or: [
        { 'from._id': req.userId, 'to._id': String(req.params.userId) },
        { 'from._id': String(req.params.userId), 'to._id': req.userId },
      ],
    }).sort({ createdAt: 1 }).lean().exec();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { toUserId, text } = req.body;

    if (!toUserId || !text) {
      return res.status(400).json({ error: 'Recipient and text required' });
    }

    const fromUser = await User.findById(req.userId).lean().exec();
    const toUser = await User.findById(toUserId).lean().exec();

    const message = await Message.create({
      _id: nid(),
      from: { _id: req.userId, name: fromUser?.name || 'You' },
      to: { _id: toUserId, name: toUser?.name || 'Unknown' },
      text,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.put('/api/messages/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { read } = req.body;
    const message = await Message.findById(req.params.id).lean().exec();
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.to._id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const updated = await Message.findByIdAndUpdate(req.params.id, { read }, { new: true }).lean().exec();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// ===== NOTIFICATION ROUTES =====
app.get('/api/notifications/:userId', async (req: Request, res: Response) => {
  try {
    const result = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, message, link } = req.body;
    if (!userId || !type || !message) {
      return res.status(400).json({ error: 'userId, type, and message required' });
    }
    const notification = await Notification.create({
      _id: nid(),
      userId,
      type,
      message,
      read: false,
      link: link || '',
    });
    res.status(201).json(notification);
  } catch (err: any) {
