import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Skill from './models/Skill.js';
import ExchangeRequest from './models/ExchangeRequest.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-skill';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error', err);
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Users
app.get('/api/users', async (req, res) => {
  const users = await User.find().limit(50).populate('skills');
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const { name, email, passwordHash, role } = req.body;
  const user = await User.create({ name, email, passwordHash, role });
  res.status(201).json(user);
});

// Skills
app.get('/api/skills', async (req, res) => {
  const skills = await Skill.find().limit(100).populate('owner');
  res.json(skills);
});

app.post('/api/skills', async (req, res) => {
  const body = req.body;
  const skill = await Skill.create(body);
  res.status(201).json(skill);
});

// Exchange Requests
app.get('/api/requests', async (req, res) => {
  const requests = await ExchangeRequest.find().limit(100).populate('requester responder skillRequested skillOffered');
  res.json(requests);
});

// Messages
app.get('/api/messages', async (req, res) => {
  const messages = await Message.find().limit(200).populate('from to');
  res.json(messages);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
