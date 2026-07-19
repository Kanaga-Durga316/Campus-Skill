import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Skill from './models/Skill.js';
import LearnSkill from './models/LearnSkill.js';
import ExchangeRequest from './models/ExchangeRequest.js';
import Message from './models/Message.js';
import { hashPassword, comparePassword, generateToken } from './utils/auth.js';
import { authMiddleware, AuthRequest } from './utils/middleware.js';
import { uploadNotes } from './utils/upload.js';
import { computeProgress, gradeQuiz, generateCertificateId } from './utils/progress.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_skill';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role: role || 'student' });
    
    const token = generateToken(user._id.toString());
    res.status(201).json({ user: user.toJSON(), token });
  } catch (err: any) {
    console.error('Registration error:', err.message, err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString());
    res.json({ user: user.toJSON(), token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== USER ROUTES =====
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash').populate('skills').limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').populate('skills');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userId !== req.params.id && req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const {
      name,
      bio,
      avatarUrl,
      location,
      preferredMode,
      experienceLevel,
      sessionDurationHours,
      portfolioLinks,
      verificationStatus
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        bio,
        avatarUrl,
        location,
        preferredMode,
        experienceLevel,
        sessionDurationHours,
        portfolioLinks,
        verificationStatus
      },
      { new: true }
    ).select('-passwordHash');


    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ===== SKILL ROUTES =====
app.get('/api/skills', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query: any = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search as string, 'i')] } }
        ]
      };
    }

    const skills = await Skill.find(query).populate('owner').limit(100);
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

app.get('/api/skills/:id', async (req: Request, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id).populate('owner');
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
      duration
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const skill = await Skill.create({
      title,
      description,
      category,
      tags: tags || [],
      level,
      owner: req.userId,
      courseDescription,
      notes,
      notesFile: req.file ? req.file.filename : undefined,
      videoLinks: typeof videoLinks === 'string' ? videoLinks.split(',').map((s: string) => s.trim()).filter(Boolean) : (videoLinks || []),
      recordedVideoLinks: typeof recordedVideoLinks === 'string' ? recordedVideoLinks.split(',').map((s: string) => s.trim()).filter(Boolean) : (recordedVideoLinks || []),
      liveClassLink,
      referenceLinks: typeof referenceLinks === 'string' ? referenceLinks.split(',').map((s: string) => s.trim()).filter(Boolean) : (referenceLinks || []),
      assignments: typeof assignments === 'string' ? assignments.split(',').map((s: string) => s.trim()).filter(Boolean) : (assignments || []),
      githubLink,
      difficulty,
      duration
    });

    await User.findByIdAndUpdate(req.userId, {
      $push: { skills: skill._id }
    });

    const populated = await skill.populate('owner');
    res.status(201).json(populated);
  } catch (err: any) {
    console.error('Skill creation error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create skill' });
  }
});

app.put('/api/skills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    if (skill.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, description, category, tags, level, availability, rating } = req.body;
    const updated = await Skill.findByIdAndUpdate(
      req.params.id,
      { title, description, category, tags, level, availability, rating },
      { new: true }
    ).populate('owner');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

app.delete('/api/skills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    if (skill.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Skill.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.userId, {
      $pull: { skills: req.params.id }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// ===== COURSE MANAGEMENT ROUTES (owner-only) =====
// Helper: normalise a value into a trimmed, non-empty string array
const toArr = (v: any): string[] =>
  typeof v === 'string'
    ? v.split(',').map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(v)
      ? v.map((s: any) => String(s).trim()).filter(Boolean)
      : [];

// Add a module to a course
app.post('/api/skills/:id/modules', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner.toString() !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Module title is required' });

    skill.modules.push({ title, description });
    await skill.save();
    res.status(201).json(skill);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add module' });
  }
});

// Update a module
app.put('/api/skills/:id/modules/:moduleId', authMiddleware, uploadNotes, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner.toString() !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.id(req.params.moduleId as string);
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

    await skill.save();
    res.json(skill);
  } catch (err: any) {
    console.error('Module update error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to update module' });
  }
});

// Delete a module
app.delete('/api/skills/:id/modules/:moduleId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner.toString() !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.id(req.params.moduleId as string);
    if (!module) return res.status(404).json({ error: 'Module not found' });

    skill.modules.pull({ _id: req.params.moduleId } as any);
    await skill.save();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete module' });
  }
});

// Add a quiz to a module
app.post('/api/skills/:id/modules/:moduleId/quizzes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner.toString() !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.id(req.params.moduleId as string);
    if (!module) return res.status(404).json({ error: 'Module not found' });

    const { question, options, correctIndex } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    module.quizzes.push({
      question,
      options: toArr(options),
      correctIndex: typeof correctIndex === 'number' ? correctIndex : 0
    });
    await skill.save();
    res.status(201).json(skill);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add quiz' });
  }
});

// Update a quiz
app.put('/api/skills/:id/modules/:moduleId/quizzes/:quizId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner.toString() !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.id(req.params.moduleId as string);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const quiz = module.quizzes.id(req.params.quizId as string);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { question, options, correctIndex } = req.body;
    if (question !== undefined) quiz.question = question;
    if (options !== undefined) quiz.options = toArr(options);
    if (correctIndex !== undefined) quiz.correctIndex = correctIndex;

    await skill.save();
    res.json(skill);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update quiz' });
  }
});

// Delete a quiz
app.delete('/api/skills/:id/modules/:moduleId/quizzes/:quizId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner.toString() !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const module = skill.modules.id(req.params.moduleId as string);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const quiz = module.quizzes.id(req.params.quizId as string);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    module.quizzes.pull({ _id: req.params.quizId } as any);
    await skill.save();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete quiz' });
  }
});

// Publish / unpublish a course (and update course-level metadata)
app.patch('/api/skills/:id/publish', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    if (skill.owner.toString() !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { published, courseDescription, difficulty, duration, liveClassLink } = req.body;
    if (published !== undefined) skill.published = published;
    if (courseDescription !== undefined) skill.courseDescription = courseDescription;
    if (difficulty !== undefined) skill.difficulty = difficulty;
    if (duration !== undefined) skill.duration = duration;
    if (liveClassLink !== undefined) skill.liveClassLink = liveClassLink;

    await skill.save();
    res.json(skill);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to publish course' });
  }
});

// ===== LEARN-SKILLS ROUTES (separate collection: learnSkills) =====
app.get('/api/learn-skills', async (req: Request, res: Response) => {
  try {
    const skills = await LearnSkill.find().populate('owner').limit(200);
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch learn skills' });
  }
});

app.get('/api/learn-skills/:id', async (req: Request, res: Response) => {
  try {
    const skill = await LearnSkill.findById(req.params.id).populate('owner');
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

    const skill = await LearnSkill.create({
      title,
      description,
      category,
      tags: tags || [],
      level,
      owner: req.userId
    });

    const populated = await skill.populate('owner');
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create learn skill' });
  }
});

app.put('/api/learn-skills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await LearnSkill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Learn skill not found' });
    if (skill.owner.toString() !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { title, description, category, tags, level, availability, rating } = req.body;
    const updated = await LearnSkill.findByIdAndUpdate(
      req.params.id,
      { title, description, category, tags, level, availability, rating },
      { new: true }
    ).populate('owner');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update learn skill' });
  }
});

app.delete('/api/learn-skills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skill = await LearnSkill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Learn skill not found' });
    if (skill.owner.toString() !== req.userId) return res.status(403).json({ error: 'Unauthorized' });

    await LearnSkill.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete learn skill' });
  }
});

// ===== EXCHANGE REQUEST ROUTES =====
app.get('/api/requests', async (req: Request, res: Response) => {
  try {
    const requests = await ExchangeRequest.find()
      .populate('requester responder skillRequested skillOffered')
      .limit(100);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Student's learning enrollments ("My Learning"): accepted requests where I am the requester
app.get('/api/requests/enrollments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await ExchangeRequest.find({
      requester: req.userId,
      status: { $in: ['accepted', 'completed'] }
    })
      .populate('requester responder skillRequested skillOffered')
      .sort({ updatedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Teacher's requests ("Students Learning My Skills"): all requests where I am the responder
// (pending requests to accept/reject + accepted enrollments to track progress)
app.get('/api/requests/teacher', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await ExchangeRequest.find({
      responder: req.userId
    })
      .populate('requester responder skillRequested skillOffered')
      .sort({ updatedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teaching enrollments' });
  }
});

app.get('/api/requests/:id', async (req: Request, res: Response) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id)
      .populate('requester responder skillRequested skillOffered');
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

    const request = await ExchangeRequest.create({
      requester: req.userId,
      responder: responderId,
      skillRequested: skillRequestedId,
      skillOffered: skillOfferedId,
      message
    });

    const populated = await request.populate('requester responder skillRequested skillOffered');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create request' });
  }
});

app.put('/api/requests/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id)
      .populate('requester responder skillRequested skillOffered');
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isRequester = request.requester._id.toString() === req.userId;
    const isResponder = request.responder._id.toString() === req.userId;
    if (!isRequester && !isResponder) return res.status(403).json({ error: 'Unauthorized' });

    const {
      status, message, scheduledAt,
      completedModules, assignmentText, answers, liveClassAttended,
      assignmentStatus, feedback
    } = req.body;

    // Status transitions (teacher accepts/rejects; student cancels)
    if (status !== undefined) {
      if ((status === 'accepted' || status === 'rejected') && !isResponder) {
        return res.status(403).json({ error: 'Only the teacher can accept or reject' });
      }
      if (status === 'cancelled' && !isRequester) {
        return res.status(403).json({ error: 'Only the student can cancel' });
      }
      request.status = status;
      if (status === 'completed' && !request.completedAt) request.completedAt = new Date();
    }

    if (message !== undefined) request.message = message;
    if (scheduledAt !== undefined) request.scheduledAt = scheduledAt;

    // Teacher-only: grade the assignment + read feedback (teachers monitor only)
    if (assignmentStatus !== undefined) {
      if (!isResponder) return res.status(403).json({ error: 'Only the teacher can update assignment status' });
      request.assignmentStatus = assignmentStatus;
    }
    if (feedback !== undefined) {
      if (!isRequester) return res.status(403).json({ error: 'Only the student can submit feedback' });
      if (feedback.rating !== undefined) request.feedback.rating = feedback.rating;
      if (feedback.comment !== undefined) request.feedback.comment = feedback.comment;
    }

    // Student-only learning actions -> all progress is auto-calculated afterwards
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

      // AUTO-CALCULATE progress (backend only)
      request.progress = computeProgress({
        completedModules: request.completedModules,
        assignmentStatus: request.assignmentStatus,
        quizStatus: request.quizStatus,
        liveClassAttended: request.liveClassAttended,
        skill: request.skillRequested
      });

      // AUTO-COMPLETE when every milestone is done
      if (request.progress >= 100 && request.status !== 'completed') {
        request.status = 'completed';
        request.completedAt = new Date();
      }
    }

    // Certificate is issued whenever the course is completed (auto or by teacher)
    if (request.status === 'completed' && !(request.certificate && request.certificate.issued)) {
      const skillId = request.skillRequested?._id?.toString() || '';
      request.certificate = {
        issued: true,
        certificateId: generateCertificateId(skillId, request._id.toString()),
        issuedAt: new Date()
      };
    }

    await request.save();
    res.json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update request' });
  }
});

app.delete('/api/requests/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const request = await ExchangeRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.requester.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await ExchangeRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// ===== MESSAGE ROUTES =====
app.get('/api/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Message.find({
      $or: [{ from: req.userId }, { to: req.userId }]
    }).populate('from to').limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/messages/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.userId, to: req.params.userId },
        { from: req.params.userId, to: req.userId }
      ]
    }).populate('from to').sort({ createdAt: 1 });
    res.json(messages);
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

    const message = await Message.create({
      from: req.userId,
      to: toUserId,
      text
    });

    const populated = await message.populate('from to');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.put('/api/messages/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { read } = req.body;

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.to.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      { read },
      { new: true }
    ).populate('from to');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Central error handler (ensures upload/validation errors return JSON)
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err.message);
  res.status(400).json({ error: err.message || 'Request failed' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
