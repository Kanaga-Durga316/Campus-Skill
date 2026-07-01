import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import Skill from './models/Skill';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-skill';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding');

  // Clear collections (careful in prod)
  await User.deleteMany({});
  await Skill.deleteMany({});

  const alice = await User.create({ name: 'Alice', email: 'alice@example.com', passwordHash: 'hash', role: 'student', bio: 'Loves design' });
  const bob = await User.create({ name: 'Bob', email: 'bob@example.com', passwordHash: 'hash', role: 'teacher', bio: 'Math tutor' });

  const skill1 = await Skill.create({ title: 'Graphic Design', description: 'Photoshop, Figma basics', owner: alice._id, tags: ['design','figma'] });
  const skill2 = await Skill.create({ title: 'Algebra Tutoring', description: 'High school algebra', owner: bob._id, tags: ['math','algebra'] });

  alice.skills.push(skill1._id);
  await alice.save();

  bob.skills.push(skill2._id);
  await bob.save();

  console.log('Seeding complete');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
