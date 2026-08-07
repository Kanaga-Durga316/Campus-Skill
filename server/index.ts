import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateToken, hashPassword, comparePassword, verifyToken } from './utils/auth.js';
import {
  authMiddleware,
  adminMiddleware,
  AuthRequest,
  asyncHandler,
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  requireFields,
  isValidEmail,
} from './utils/middleware.js';
import { uploadNotes } from './utils/upload.js';
import { computeProgress, gradeQuiz, generateCertificateId } from './utils/progress.js';
import { connectDatabase } from '../config/db.js';
import { User, Skill, LearnSkill, ExchangeRequest, Message, Notification, Review } from './models/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===== Security Headers (Helmet) =====
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

// ===== CORS Configuration =====
const FRONTEND_URL = process.env.FRONTEND_URL;
const ALLOWED_ORIGINS = FRONTEND_URL
  ? [FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:4173'];

if (process.env.NODE_ENV === 'production' && !FRONTEND_URL) {
  console.warn(
    'WARNING: FRONTEND_URL environment variable is not set. CORS will be permissive in production. Set it to your Vercel deployment URL.'
  );
}

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' && FRONTEND_URL
      ? FRONTEND_URL
      : ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static('uploads'));

// ===== Production Static File Serving =====
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// ===== Production Check: Ensure required env vars are set =====
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set in production.');
    console.error('Generate a strong secret: openssl rand -base64 64');
    process.exit(1);
  }
}

// ===== HELPERS =====

function sanitizeUser(user: any) {
  if (!user) return user;
  const { skills: _s, password: _p, ...rest } = user;
  return rest;
}

function toArr(v: any): string[] {
  return typeof v === 'string'
    ? v.split(',').map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(v)
      ? v.map((s: any) => String(s).trim()).filter(Boolean)
      : [];
}

function paramId(req: Request, name: string = 'id'): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val || '';
}

// ===== HEALTH =====

app.get(
  '/api/health',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ ok: true, uptime: process.uptime() });
  })
);

// ===== AUTH ROUTES =====

app.post(
  '/api/auth/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    const missing = requireFields(req.body, ['name', 'email', 'password']);
    if (missing) throw new AppError(missing, 400);

    if (name.trim().length < 2) throw new AppError('Name must be at least 2 characters', 400);
    if (!isValidEmail(email)) throw new AppError('Invalid email format', 400);
    if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
    if (role && !['student', 'teacher'].includes(role)) throw new AppError('Role must be student or teacher', 400);

    const existing = await User.findOne({ email }).lean().exec();
    if (existing) throw new AppError('Email already registered', 409);

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'student',
    });

    const token = generateToken(user._id);
    const userObj = user.toObject ? user.toObject() : user;
    const safeUser = sanitizeUser(userObj);
    res.status(201).json({ user: safeUser, token });
  })
);

app.post(
  '/api/auth/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const missing = requireFields(req.body, ['email', 'password']);
    if (missing) throw new AppError(missing, 400);

    if (!isValidEmail(email)) throw new AppError('Invalid email format', 400);

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .lean()
      .exec();
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const isMatch = await comparePassword(password, user.password!);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');

    const token = generateToken(user._id);
    const safeUser = sanitizeUser(user);
    res.json({ user: safeUser, token });
  })
);

// ===== USER ROUTES =====

app.get(
  '/api/users',
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await User.find().lean().exec();
    const safe = users.map(sanitizeUser);
    res.json(safe);
  })
);

app.get(
  '/api/users/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID format', 400);
    }
    const user = await User.findById(id).lean().exec();
    if (!user) throw new NotFoundError('User');
    res.json(sanitizeUser(user));
  })
);

app.put(
  '/api/users/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (req.userId !== id && req.userId) {
      throw new ForbiddenError('You can only update your own profile');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID format', 400);
    }

    const user = await User.findById(id).lean().exec();
    if (!user) throw new NotFoundError('User');

    const allowed = [
      'name', 'bio', 'avatarUrl', 'coverImage', 'location', 'preferredMode', 'experienceLevel',
      'sessionDurationHours', 'portfolioLinks', 'verificationStatus', 'studentId', 'college',
      'university', 'semester', 'cgpa', 'graduationYear', 'careerGoal', 'academicInterests',
      'skillsTeaching', 'skillsLearning', 'certificates', 'achievements', 'socialLinks',
      'profileVisibility', 'privacySettings', 'phoneNumber', 'twoFactorEnabled'
    ];

    const update: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    const updated = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean().exec();
    res.json(sanitizeUser(updated));
  })
);

// ===== PROFILE API =====

app.get(
  '/api/profile/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req, 'id');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID format', 400);
    }
    const user = await User.findById(id).lean().exec();
    if (!user) throw new NotFoundError('User');

    const visibility = user.profileVisibility || 'public';
    const isSelf = req.userId === id;

    if (visibility === 'private' && !isSelf) {
      throw new ForbiddenError('This profile is private');
    }

    const safe: any = { ...sanitizeUser(user) };

    if (!isSelf) {
      if (visibility === 'connections') {
        const me = await User.findById(req.userId).lean().exec();
        const isFollower = me?.followers?.includes(id);
        if (!isFollower) {
          throw new ForbiddenError('This profile is visible to connections only');
        }
      }
      if (!safe.privacySettings?.showEmail) delete safe.email;
      if (!safe.privacySettings?.showPhone) delete safe.phoneNumber;
      if (!safe.privacySettings?.showPortfolio) delete safe.portfolioLinks;
      if (!safe.privacySettings?.showCertificates) delete safe.certificates;
      if (!safe.privacySettings?.showAchievements) delete safe.achievements;
    }

    res.json(safe);
  })
);

app.put(
  '/api/profile/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req, 'id');
    if (req.userId !== id) {
      throw new ForbiddenError('You can only update your own profile');
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID format', 400);
    }

    const allowed = [
      'bio', 'avatarUrl', 'coverImage', 'location', 'preferredMode', 'experienceLevel',
      'studentId', 'college', 'university', 'semester', 'cgpa', 'graduationYear', 'careerGoal',
      'academicInterests', 'skillsTeaching', 'skillsLearning', 'certificates', 'achievements',
      'socialLinks', 'profileVisibility', 'privacySettings', 'phoneNumber', 'twoFactorEnabled',
      'portfolioLinks'
    ];

    const update: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    const updated = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean().exec();
    res.json(sanitizeUser(updated));
  })
);

// ===== FOLLOW ROUTES =====

app.post(
  '/api/profile/:id/follow',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const targetId = paramId(req, 'id');
    if (req.userId === targetId) {
      throw new AppError('You cannot follow yourself', 400);
    }

    const target = await User.findById(targetId).lean().exec();
    if (!target) throw new NotFoundError('User');

    const me = await User.findById(req.userId).lean().exec();
    if (!me) throw new NotFoundError('User');

    const isFollowing = me.following?.includes(targetId);
    if (isFollowing) {
      await User.findByIdAndUpdate(req.userId, { $pull: { following: targetId } }).exec();
      await User.findByIdAndUpdate(targetId, { $pull: { followers: req.userId } }).exec();
      res.json({ following: false });
    } else {
      await User.findByIdAndUpdate(req.userId, { $addToSet: { following: targetId } }).exec();
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.userId } }).exec();
      res.json({ following: true });
    }
  })
);

app.get(
  '/api/profile/:id/followers',
  asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req, 'id');
    const user = await User.findById(id).select('followers').lean().exec();
    if (!user) throw new NotFoundError('User');
    const followers = await User.find({ _id: { $in: user.followers || [] } }).select('name email avatarUrl').lean().exec();
    res.json(followers.map(sanitizeUser));
  })
);

app.get(
  '/api/profile/:id/following',
  asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req, 'id');
    const user = await User.findById(id).select('following').lean().exec();
    if (!user) throw new NotFoundError('User');
    const following = await User.find({ _id: { $in: user.following || [] } }).select('name email avatarUrl').lean().exec();
    res.json(following.map(sanitizeUser));
  })
);

// ===== USER REVIEWS =====

app.get(
  '/api/users/:id/reviews',
  asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req, 'id');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID format', 400);
    }
    const reviews = await Review.find({ revieweeId: id })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const populated = await Promise.all(
      reviews.map(async (r: any) => {
        const reviewer = await User.findById(r.reviewerId).select('name email avatarUrl').lean().exec();
        return {
          ...r,
          reviewer: reviewer ? sanitizeUser(reviewer) : null,
        };
      })
    );

    res.json(populated);
  })
);

// ===== USER BOOKMARKS =====

app.get(
  '/api/users/:id/skills',
  asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req, 'id');
    const result = await Skill.find({ 'owner._id': id }).sort({ createdAt: -1 }).lean().exec();
    res.json(result);
  })
);

app.get(
  '/api/users/:id/learn-skills',
  asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req, 'id');
    const result = await LearnSkill.find({ 'owner._id': id }).sort({ createdAt: -1 }).lean().exec();
    res.json(result);
  })
);

app.get(
  '/api/users/:id/bookmarks',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req, 'id');
    if (req.userId !== id) {
      throw new ForbiddenError('You can only view your own bookmarks');
    }
    const user = await User.findById(id).select('bookmarks').lean().exec();
    if (!user) throw new NotFoundError('User');

    const bookmarkIds = user.bookmarks || [];
    const skills = await Skill.find({ _id: { $in: bookmarkIds } }).lean().exec();
    res.json(skills);
  })
);

app.post(
  '/api/users/:id/bookmarks',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req, 'id');
    if (req.userId !== id) {
      throw new ForbiddenError('You can only bookmark for yourself');
    }
    const { skillId } = req.body;
    if (!skillId) throw new AppError('Skill ID is required', 400);

    const updated = await User.findByIdAndUpdate(
      id,
      { $addToSet: { bookmarks: skillId } },
      { new: true }
    ).lean().exec();

    res.json(sanitizeUser(updated));
  })
);

app.delete(
  '/api/users/:id/bookmarks/:skillId',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req, 'id');
    const skillId = paramId(req, 'skillId');
    if (req.userId !== id) {
      throw new ForbiddenError('You can only manage your own bookmarks');
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $pull: { bookmarks: skillId } },
      { new: true }
    ).lean().exec();

    res.json(sanitizeUser(updated));
  })
);

// ===== USER CALENDAR =====

app.get(
  '/api/users/:id/calendar',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req, 'id');
    if (req.userId !== id) {
      throw new ForbiddenError('You can only view your own calendar');
    }
    const user = await User.findById(id).select('calendarEvents').lean().exec();
    if (!user) throw new NotFoundError('User');
    res.json(user.calendarEvents || []);
  })
);

app.post(
  '/api/users/:id/calendar',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req, 'id');
    if (req.userId !== id) {
      throw new ForbiddenError('You can only manage your own calendar');
    }
    const { title, date, type, description } = req.body;
    if (!title || !date) throw new AppError('Title and date are required', 400);

    const event = {
      _id: nid(),
      title: String(title).trim(),
      date: String(date),
      type: type || 'event',
      description: description ? String(description).trim() : '',
    };

    const updated = await User.findByIdAndUpdate(
      id,
      { $push: { calendarEvents: event } },
      { new: true }
    ).lean().exec();

    res.json(sanitizeUser(updated));
  })
);

app.delete(
  '/api/users/:id/calendar/:eventId',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req, 'id');
    const eventId = paramId(req, 'eventId');
    if (req.userId !== id) {
      throw new ForbiddenError('You can only manage your own calendar');
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $pull: { calendarEvents: { _id: eventId } } },
      { new: true }
    ).lean().exec();

    res.json(sanitizeUser(updated));
  })
);

// ===== USER ACTIVITY =====

app.get(
  '/api/users/:id/activity',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req, 'id');
    const activities: any[] = [];

    const userSkills = await Skill.find({ 'owner._id': id }).sort({ createdAt: -1 }).limit(5).lean().exec();
    userSkills.forEach((s: any) => {
      activities.push({
        id: `skill_${s._id}`,
        type: 'course_created',
        message: `Created course "${s.title}"`,
        date: s.createdAt,
        icon: '📚',
      });
    });

    const userLearnSkills = await LearnSkill.find({ 'owner._id': id }).sort({ createdAt: -1 }).limit(5).lean().exec();
    userLearnSkills.forEach((ls: any) => {
      activities.push({
        id: `learn_${ls._id}`,
        type: 'learning_goal',
        message: `Added learning goal "${ls.title}"`,
        date: ls.createdAt,
        icon: '🎯',
      });
    });

    const userRequests = await ExchangeRequest.find({
      $or: [{ 'requester._id': id }, { 'responder._id': id }],
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean()
      .exec();

    userRequests.forEach((r: any) => {
      const isRequester = r.requester?._id === id;
      const label = isRequester ? 'Sent request' : 'Received request';
      activities.push({
        id: `req_${r._id}`,
        type: r.status === 'accepted' ? 'request_accepted' : r.status === 'rejected' ? 'request_rejected' : r.status === 'completed' ? 'course_completed' : 'request_sent',
        message: `${label} for "${r.skillRequested?.title || 'a skill'}" — ${r.status}`,
        date: r.updatedAt || r.createdAt,
        icon: r.status === 'accepted' ? '🤝' : r.status === 'rejected' ? '❌' : r.status === 'completed' ? '🎉' : '📬',
      });
    });

    const userReviews = await Review.find({ revieweeId: id }).sort({ createdAt: -1 }).limit(5).lean().exec();
    userReviews.forEach((rv: any) => {
      activities.push({
        id: `review_${rv._id}`,
        type: 'review_received',
        message: `Received a ${rv.rating}-star review`,
        date: rv.createdAt,
        icon: '⭐',
      });
    });

    const userNotifications = await Notification.find({ userId: id }).sort({ createdAt: -1 }).limit(5).lean().exec();
    userNotifications.forEach((n: any) => {
      activities.push({
        id: `notif_${n._id}`,
        type: n.type,
        message: n.message,
        date: n.createdAt,
        icon: '🔔',
      });
    });

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(activities.slice(0, 20));
  })
);

// ===== SKILL ROUTES =====

app.get(
  '/api/skills',
  asyncHandler(async (req: Request, res: Response) => {
    const { search, status } = req.query;
    const query: any = {};

    if (search) {
      const q = String(search);
      if (q.trim().length > 0) {
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } },
        ];
      }
    }

    // Public search only shows approved courses
    if (status !== 'all') {
      query.status = 'approved';
    }

    const result = await Skill.find(query).lean().exec();
    res.json(result);
  })
);

app.get(
  '/api/skills/mine',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await Skill.find({ 'owner._id': req.userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    res.json(result);
  })
);

app.get(
  '/api/skills/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }
    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');

    // Only show approved courses publicly; non-approved are visible only to the owner/admin
    if (skill.status !== 'approved') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      let isOwner = false;
      if (token) {
        const decoded = verifyToken(token);
        if (decoded && decoded.userId === skill.owner._id) {
          isOwner = true;
        }
      }
      if (!isOwner) {
        throw new UnauthorizedError('This course is not available');
      }
    }

    res.json(skill);
  })
);

app.post(
  '/api/skills',
  authMiddleware,
  uploadNotes,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, category, tags, level, courseDescription, notes, videoLinks, recordedVideoLinks, liveClassLink, referenceLinks, assignments, githubLink, difficulty, duration } = req.body;

    if (!title || title.trim().length === 0) throw new AppError('Title is required', 400);
    if (title.trim().length > 200) throw new AppError('Title must be under 200 characters', 400);

    const ownerUser = await User.findById(req.userId).lean().exec();
    if (!ownerUser) throw new NotFoundError('User');

     const skill = await Skill.create({
      title: title.trim(),
      description,
      category,
      tags: tags || [],
      level,
      owner: { _id: req.userId, name: ownerUser?.name || 'You' },
      courseDescription,
      notes,
      notesFile: req.file ? req.file.filename : undefined,
      videoLinks: toArr(videoLinks),
      recordedVideoLinks: toArr(recordedVideoLinks),
      liveClassLink,
      referenceLinks: toArr(referenceLinks),
      assignments: toArr(assignments),
      githubLink,
      difficulty,
      duration,
      status: 'pending',
      submittedAt: new Date(),
    });

    // Notify admins that a new course has been submitted
    const admins = await User.find({ role: 'admin' }).lean().exec();
    await Promise.all(
      admins.map((admin) =>
        Notification.create({
          userId: admin._id,
          type: 'course_submitted',
          message: `${ownerUser?.name || 'Someone'} submitted "${title.trim()}" for approval.`,
          read: false,
          link: '/admin',
        })
      )
    );

    res.status(201).json(skill);
  })
);

app.put(
  '/api/skills/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('You do not own this skill');

    const { title, description, category, tags, level, availability, rating } = req.body;
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (tags !== undefined) update.tags = tags;
    if (level !== undefined) update.level = level;
    if (availability !== undefined) update.availability = availability;
    if (rating !== undefined) update.rating = rating;

    const updated = await Skill.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    res.json(updated);
  })
);

app.delete(
  '/api/skills/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('You do not own this skill');

    await Skill.findByIdAndDelete(id).exec();
    res.json({ success: true });
  })
);

// ===== COURSE MANAGEMENT ROUTES (owner-only) =====

app.post(
  '/api/skills/:id/modules',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('Only the owner can add modules');

    const { title, description } = req.body;
    if (!title) throw new AppError('Module title is required', 400);

    const newModule = {
      title,
      description,
    };

    await Skill.findByIdAndUpdate(id, { $push: { modules: newModule } }).exec();
    const updated = await Skill.findById(id).lean().exec();
    res.status(201).json(updated);
  })
);

app.put(
  '/api/skills/:id/modules/:moduleId',
  authMiddleware,
  uploadNotes,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    const moduleId = paramId(req, 'moduleId');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('Only the owner can update modules');

    const mod = skill.modules.find((m: any) => m._id === moduleId);
    if (!mod) throw new NotFoundError('Module');

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

    await Skill.updateOne({ _id: id, 'modules._id': moduleId }, { $set: update }).exec();
    const updated = await Skill.findById(id).lean().exec();
    res.json(updated);
  })
);

app.delete(
  '/api/skills/:id/modules/:moduleId',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    const moduleId = paramId(req, 'moduleId');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('Only the owner can delete modules');

    const mod = skill.modules.find((m: any) => m._id === moduleId);
    if (!mod) throw new NotFoundError('Module');

    await Skill.updateOne({ _id: id }, { $pull: { modules: { _id: moduleId } } }).exec();
    res.json({ success: true });
  })
);

// ===== QUIZ ROUTES =====

app.post(
  '/api/skills/:id/modules/:moduleId/quizzes',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    const moduleId = paramId(req, 'moduleId');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('Only the owner can add quizzes');

    const mod = skill.modules.find((m: any) => m._id === moduleId);
    if (!mod) throw new NotFoundError('Module');

    const { question, options, correctIndex } = req.body;
    if (!question) throw new AppError('Question is required', 400);

    const newQuiz = {
      question,
      options: toArr(options),
      correctIndex: typeof correctIndex === 'number' ? correctIndex : 0,
    };

    await Skill.updateOne(
      { _id: id, 'modules._id': moduleId },
      { $push: { 'modules.$.quizzes': newQuiz } }
    ).exec();

    const updated = await Skill.findById(id).lean().exec();
    res.status(201).json(updated);
  })
);

app.put(
  '/api/skills/:id/modules/:moduleId/quizzes/:quizId',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    const moduleId = paramId(req, 'moduleId');
    const quizId = paramId(req, 'quizId');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('Only the owner can update quizzes');

    const mod = skill.modules.find((m: any) => m._id === moduleId);
    if (!mod) throw new NotFoundError('Module');
    const quiz = mod.quizzes.find((q: any) => q._id === quizId);
    if (!quiz) throw new NotFoundError('Quiz');

    const { question, options, correctIndex } = req.body;
    const update: any = {};
    if (question !== undefined) update['modules.$.quizzes.$.question'] = question;
    if (options !== undefined) update['modules.$.quizzes.$.options'] = toArr(options);
    if (correctIndex !== undefined) update['modules.$.quizzes.$.correctIndex'] = correctIndex;

    await Skill.updateOne(
      { _id: id, 'modules._id': moduleId, 'modules.quizzes._id': quizId },
      { $set: update }
    ).exec();

    const updated = await Skill.findById(id).lean().exec();
    res.json(updated);
  })
);

app.delete(
  '/api/skills/:id/modules/:moduleId/quizzes/:quizId',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    const moduleId = paramId(req, 'moduleId');
    const quizId = paramId(req, 'quizId');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('Only the owner can delete quizzes');

    const mod = skill.modules.find((m: any) => m._id === moduleId);
    if (!mod) throw new NotFoundError('Module');
    const quiz = mod.quizzes.find((q: any) => q._id === quizId);
    if (!quiz) throw new NotFoundError('Quiz');

    await Skill.updateOne(
      { _id: id, 'modules._id': moduleId },
      { $pull: { 'modules.$.quizzes': { _id: quizId } } }
    ).exec();

    res.json({ success: true });
  })
);

app.post(
  '/api/skills/:id/submit',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid skill ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('Only the owner can submit this course');

    if (skill.status === 'approved') {
      throw new AppError('Course is already approved', 400);
    }

    // Create notification for admins
    const admins = await User.find({ role: 'admin' }).lean().exec();
    await Promise.all(
      admins.map((admin) =>
        Notification.create({
          userId: admin._id,
          type: 'course_submitted',
          message: `${skill.owner.name} submitted "${skill.title}" for approval.`,
          read: false,
          link: '/admin',
        })
      )
    );

    const updated = await Skill.findByIdAndUpdate(
      id,
      {
        status: 'pending',
        submittedAt: new Date(),
        published: false,
      },
      { new: true }
    ).lean().exec();

    res.json({ ...updated, message: 'Your course has been submitted successfully and is waiting for Admin approval.' });
  })
);

// ===== ADMIN ROUTES =====

app.get(
  '/api/admin/courses',
  adminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, search, category, limit = 50, skip = 0 } = req.query;
    const query: any = {};

    if (status) {
      query.status = status;
    }
    if (search) {
      const q = String(search);
      if (q.trim().length > 0) {
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { 'owner.name': { $regex: q, $options: 'i' } },
        ];
      }
    }
    if (category) {
      query.category = String(category);
    }

    const result = await Skill.find(query)
      .populate('approvedBy', 'name')
      .skip(Number(skip))
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    res.json(result);
  })
);

app.get(
  '/api/admin/courses/:id',
  adminMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid course ID format', 400);
    }
    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Course');
    res.json(skill);
  })
);

app.post(
  '/api/admin/courses/:id/approve',
  adminMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid course ID format', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Course');

    const updated = await Skill.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        published: true,
        approvedAt: new Date(),
        approvedBy: req.userId,
      },
      { new: true }
    ).lean().exec();

    // Notify the teacher
    await Notification.create({
      userId: skill.owner._id,
      type: 'course_approved',
      message: `Your course "${skill.title}" has been approved and is now live.`,
      read: false,
      link: '/dashboard',
    });

    res.json(updated);
  })
);

app.post(
  '/api/admin/courses/:id/reject',
  adminMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    const { rejectionReason, adminComments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid course ID format', 400);
    }
    if (!rejectionReason || String(rejectionReason).trim().length === 0) {
      throw new AppError('Rejection reason is required', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Course');

    const updated = await Skill.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        published: false,
        rejectionReason,
        adminComments: adminComments || '',
      },
      { new: true }
    ).lean().exec();

    // Notify the teacher
    await Notification.create({
      userId: skill.owner._id,
      type: 'course_rejected',
      message: `Your course "${skill.title}" has been rejected: ${rejectionReason}`,
      read: false,
      link: '/dashboard',
    });

    res.json(updated);
  })
);

app.post(
  '/api/admin/courses/:id/request-changes',
  adminMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    const { adminComments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid course ID format', 400);
    }
    if (!adminComments || String(adminComments).trim().length === 0) {
      throw new AppError('Comments are required', 400);
    }

    const skill = await Skill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Course');

    const updated = await Skill.findByIdAndUpdate(
      id,
      {
        status: 'changes_requested',
        published: false,
        adminComments,
      },
      { new: true }
    ).lean().exec();

    // Notify the teacher
    await Notification.create({
      userId: skill.owner._id,
      type: 'course_changes_requested',
      message: `Your course "${skill.title}" needs revisions: ${adminComments}`,
      read: false,
      link: '/dashboard',
    });

    res.json(updated);
  })
);

// Admin stats endpoint
app.get(
  '/api/admin/stats',
  adminMiddleware,
  asyncHandler(async (_req: Request, res: Response) => {
    const [total, pending, approved, rejected, changesRequested] = await Promise.all([
      Skill.countDocuments({}),
      Skill.countDocuments({ status: 'pending' }),
      Skill.countDocuments({ status: 'approved' }),
      Skill.countDocuments({ status: 'rejected' }),
      Skill.countDocuments({ status: 'changes_requested' }),
    ]);

    res.json({
      totalCourses: total,
      pendingApprovals: pending,
      approvedCourses: approved,
      rejectedCourses: rejected,
      changeRequests: changesRequested,
    });
  })
);

// ===== LEARN-SKILLS ROUTES =====

app.get(
  '/api/learn-skills',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await LearnSkill.find().lean().exec();
    res.json(result);
  })
);

app.get(
  '/api/learn-skills/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid learn skill ID format', 400);
    }
    const skill = await LearnSkill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Learn skill');
    res.json(skill);
  })
);

app.post(
  '/api/learn-skills',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, category, tags, level } = req.body;
    if (!title || title.trim().length === 0) throw new AppError('Title is required', 400);

    const ownerUser = await User.findById(req.userId).lean().exec();

    const skill = await LearnSkill.create({
      title: title.trim(),
      description,
      category,
      tags: tags || [],
      level,
      owner: { _id: req.userId, name: ownerUser?.name || 'You' },
    });

    res.status(201).json(skill);
  })
);

app.put(
  '/api/learn-skills/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid learn skill ID format', 400);
    }

    const skill = await LearnSkill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Learn skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('You do not own this learn skill');

    const { title, description, category, tags, level, availability, rating } = req.body;
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (tags !== undefined) update.tags = tags;
    if (level !== undefined) update.level = level;
    if (availability !== undefined) update.availability = availability;
    if (rating !== undefined) update.rating = rating;

    const updated = await LearnSkill.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    res.json(updated);
  })
);

app.delete(
  '/api/learn-skills/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid learn skill ID format', 400);
    }

    const skill = await LearnSkill.findById(id).lean().exec();
    if (!skill) throw new NotFoundError('Learn skill');
    if (skill.owner._id !== req.userId) throw new ForbiddenError('You do not own this learn skill');

    await LearnSkill.findByIdAndDelete(id).exec();
    res.json({ success: true });
  })
);

// ===== EXCHANGE REQUEST ROUTES =====

app.get(
  '/api/requests',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ExchangeRequest.find({
      $or: [
        { 'requester._id': req.userId },
        { 'responder._id': req.userId },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    res.json(result);
  })
);

app.get(
  '/api/requests/enrollments',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ExchangeRequest.find({ 'requester._id': req.userId })
      .where('status')
      .in(['accepted', 'completed'])
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    res.json(result);
  })
);

app.get(
  '/api/requests/teacher',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ExchangeRequest.find({ 'responder._id': req.userId })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    res.json(result);
  })
);

app.get(
  '/api/requests/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid request ID format', 400);
    }
    const request = await ExchangeRequest.findById(id).lean().exec();
    if (!request) throw new NotFoundError('Request');

    const isParty = request.requester._id === req.userId || request.responder._id === req.userId;
    if (!isParty) {
      throw new ForbiddenError('You are not part of this exchange');
    }

    res.json(request);
  })
);

app.post(
  '/api/requests',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { responderId, skillRequestedId, skillOfferedId, message } = req.body;

    if (!responderId) throw new AppError('Responder ID is required', 400);
    if (!skillRequestedId) throw new AppError('Skill requested ID is required', 400);

    const [responder, requester, skillRequested] = await Promise.all([
      User.findById(responderId).lean().exec(),
      User.findById(req.userId).lean().exec(),
      Skill.findById(skillRequestedId).lean().exec(),
    ]);

    if (!responder) throw new NotFoundError('Responder user');
    if (!requester) throw new NotFoundError('Requester user');

    const skillOffered = skillOfferedId ? await LearnSkill.findById(skillOfferedId).lean().exec() : null;

    const request = await ExchangeRequest.create({
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
      skillOffered: skillOffered
        ? { _id: skillOffered._id, title: skillOffered.title }
        : { _id: skillOfferedId || '', title: '—' },
      status: 'open',
      message: message || '',
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
      userId: responderId,
      type: 'request',
      message: `${requester?.name || 'Someone'} sent you an exchange request for ${skillRequested?.title || 'a skill'}.`,
      read: false,
      link: '/requests',
    });

    res.status(201).json(request);
  })
);

app.put(
  '/api/requests/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid request ID format', 400);
    }

    const request = await ExchangeRequest.findById(id).lean().exec();
    if (!request) throw new NotFoundError('Request');

    const isRequester = request.requester._id === req.userId;
    const isResponder = request.responder._id === req.userId;
    if (!isRequester && !isResponder) throw new ForbiddenError('You are not part of this exchange');

    const { status, message, scheduledAt, completedModules, assignmentText, answers, liveClassAttended, assignmentStatus, feedback } = req.body;

    const update: any = {};

    if (status !== undefined) {
      if ((status === 'accepted' || status === 'rejected') && !isResponder) {
        throw new ForbiddenError('Only the teacher can accept or reject');
      }
      if (status === 'cancelled' && !isRequester) {
        throw new ForbiddenError('Only the student can cancel');
      }
      if (!['open', 'pending', 'accepted', 'rejected', 'cancelled', 'completed'].includes(status)) {
        throw new AppError('Invalid status value', 400);
      }
      update.status = status;
      if (status === 'completed' && !request.completedAt) {
        update.completedAt = new Date().toISOString();
      }
    }

    if (message !== undefined) update.message = message;
    if (scheduledAt !== undefined) update.scheduledAt = scheduledAt;

    if (assignmentStatus !== undefined) {
      if (!isResponder) throw new ForbiddenError('Only the teacher can update assignment status');
      if (!['not_started', 'submitted', 'graded'].includes(assignmentStatus)) {
        throw new AppError('Invalid assignment status', 400);
      }
      update.assignmentStatus = assignmentStatus;
    }

    if (feedback !== undefined) {
      if (!isRequester) throw new ForbiddenError('Only the student can submit feedback');
      update['feedback.rating'] = feedback.rating;
      update['feedback.comment'] = feedback.comment;
    }

    if (completedModules !== undefined || assignmentText !== undefined || answers !== undefined || liveClassAttended !== undefined) {
      if (!isRequester) throw new ForbiddenError('Only the student can update their learning progress');

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

    const updated = await ExchangeRequest.findByIdAndUpdate(id, update, { new: true })
      .lean()
      .exec();
    res.json(updated);
  })
);

app.delete(
  '/api/requests/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith('demo_')) {
      throw new AppError('Invalid request ID format', 400);
    }

    const request = await ExchangeRequest.findById(id).lean().exec();
    if (!request) throw new NotFoundError('Request');
    if (request.requester._id !== req.userId) {
      throw new ForbiddenError('Only the requester can delete a request');
    }

    await ExchangeRequest.findByIdAndDelete(id).exec();
    res.json({ success: true });
  })
);

// ===== MESSAGE ROUTES =====

app.get(
  '/api/messages',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await Message.find({
      $or: [{ 'from._id': req.userId }, { 'to._id': req.userId }],
    })
      .lean()
      .exec();
    res.json(result);
  })
);

app.get(
  '/api/messages/:userId',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const uid = paramId(req, 'userId');
    if (!mongoose.Types.ObjectId.isValid(uid) && !uid.startsWith('demo_')) {
      throw new AppError('Invalid user ID format', 400);
    }

    const result = await Message.find({
      $or: [
        { 'from._id': req.userId, 'to._id': uid },
        { 'from._id': uid, 'to._id': req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
    res.json(result);
  })
);

app.post(
  '/api/messages',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { toUserId, text } = req.body;

    if (!toUserId) throw new AppError('Recipient is required', 400);
    if (!text || text.trim().length === 0) throw new AppError('Message text is required', 400);

    const [fromUser, toUser] = await Promise.all([
      User.findById(req.userId).lean().exec(),
      User.findById(toUserId).lean().exec(),
    ]);

    if (!toUser) throw new NotFoundError('Recipient');

    const message = await Message.create({
      _id: nid(),
      from: { _id: req.userId, name: fromUser?.name || 'You' },
      to: { _id: toUserId, name: toUser?.name || 'Unknown' },
      text: text.trim(),
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json(message);
  })
);

app.put(
  '/api/messages/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = paramId(req);
    if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith('demo_')) {
      throw new AppError('Invalid message ID format', 400);
    }

    const { read } = req.body;
    const message = await Message.findById(id).lean().exec();
    if (!message) throw new NotFoundError('Message');
    if (message.to._id !== req.userId) {
      throw new ForbiddenError('Only the recipient can mark a message as read');
    }

    const updated = await Message.findByIdAndUpdate(id, { read }, { new: true })
      .lean()
      .exec();
    res.json(updated);
  })
);

// ===== NOTIFICATION ROUTES =====

app.get(
  '/api/notifications',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    res.json(result);
  })
);

app.get(
  '/api/notifications/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const uid = paramId(req, 'userId');
    if (!mongoose.Types.ObjectId.isValid(uid) && !uid.startsWith('demo_')) {
      throw new AppError('Invalid user ID format', 400);
    }

    const result = await Notification.find({ userId: uid })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    res.json(result);
  })
);

app.post(
  '/api/notifications',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId, type, message, link } = req.body;

    const missing = requireFields(req.body, ['userId', 'type', 'message']);
    if (missing) throw new AppError(missing, 400);

    const notification = await Notification.create({
      _id: nid(),
      userId,
      type,
      message,
      read: false,
      link: link || '',
    });

    res.status(201).json(notification);
  })
);

// ===== REVIEW ROUTES =====

app.get(
  '/api/reviews',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await Review.find().lean().exec();
    res.json(result);
  })
);

app.post(
  '/api/reviews',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { requestId, skillId, revieweeId, rating, comment } = req.body;

    const missing = requireFields(req.body, ['requestId', 'skillId', 'revieweeId', 'rating']);
    if (missing) throw new AppError(missing, 400);

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new AppError('Rating must be a number between 1 and 5', 400);
    }

    const review = await Review.create({
      _id: nid(),
      requestId,
      skillId,
      reviewerId: req.userId,
      revieweeId,
      rating,
      comment: comment || '',
    });

    res.status(201).json(review);
  })
);

// ===== ERROR HANDLER (must be last) =====
app.use(errorHandler);

// ===== HELPERS =====

function nid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function seedDatabase(): Promise<void> {
  const userCount = await User.countDocuments().lean().exec();
  if (userCount > 0) {
    console.log(`Seed skipped — ${userCount} users already exist.`);
    return;
  }

  console.log('Seeding database...');

  const [teacher, student, adminUser] = await Promise.all([
    User.create({
      name: 'Demo Teacher',
      email: 'teacher@demo.com',
      password: await hashPassword('teacher123'),
      role: 'teacher',
    }),
    User.create({
      name: 'Demo Student',
      email: 'student@demo.com',
      password: await hashPassword('student123'),
      role: 'student',
    }),
    User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: await hashPassword('admin123'),
      role: 'admin',
    }),
  ]);

  await Skill.create({
    title: 'Introduction to Web Development',
    description: 'Learn HTML, CSS, and JavaScript from scratch. Build responsive websites and understand core web technologies.',
    category: 'Technology',
    tags: ['web', 'frontend', 'javascript'],
    level: 'Beginner',
    owner: { _id: teacher._id, name: teacher.name },
    published: true,
    status: 'approved',
    videoLinks: [],
    recordedVideoLinks: [],
    liveClassLink: '',
    referenceLinks: [],
    assignments: [],
    githubLink: '',
    difficulty: 'Easy',
    duration: '4 weeks',
  });

  await LearnSkill.create({
    title: 'Graphic Design Fundamentals',
    description: 'Looking for someone to teach me design basics, Figma, and color theory.',
    category: 'Design',
    tags: ['design', 'ui', 'figma'],
    level: 'Beginner',
    owner: { _id: student._id, name: student.name },
  });

  console.log('Database seeded successfully.');
}

// ===== START SERVER =====

const PORT = process.env.PORT || 3001;

async function start() {
  await connectDatabase();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

