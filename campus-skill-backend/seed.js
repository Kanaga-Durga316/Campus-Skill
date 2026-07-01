require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Skill = require('./models/Skill');
const ExchangeRequest = require('./models/ExchangeRequest');
const Message = require('./models/Message');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_skill';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected for seeding');

  // wipe
  await Message.deleteMany({});
  await ExchangeRequest.deleteMany({});
  await Skill.deleteMany({});
  await User.deleteMany({});

  const alice = await User.create({ name: 'Alice', email: 'alice@example.com', passwordHash: 'hash', role: 'student', bio: 'Design student' });
  const bob = await User.create({ name: 'Bob', email: 'bob@example.com', passwordHash: 'hash', role: 'teacher', bio: 'Math tutor' });

  const s1 = await Skill.create({ title: 'Graphic Design', description: 'Photoshop & Figma', owner: alice._id, tags: ['design'] });
  const s2 = await Skill.create({ title: 'Algebra', description: 'High school algebra', owner: bob._id, tags: ['math'] });

  alice.skills.push(s1._id);
  await alice.save();

  bob.skills.push(s2._id);
  await bob.save();

  const req = await ExchangeRequest.create({ requester: alice._id, responder: bob._id, skillRequested: s2._id, skillOffered: s1._id, message: 'Can you help me with algebra?' });

  await Message.create({ from: alice._id, to: bob._id, requestRef: req._id, text: 'Hi Bob, interested in tutoring?' });

  console.log('Seeding complete');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
