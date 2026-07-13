const BASE = 'http://localhost:5000/api';
const H = (token) => ({ Authorization: `Bearer ${token}` });

async function j(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}

(async () => {
  const teacher = await j('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Split T', email: 'split_t@x.io', password: 'password123' }) });
  console.log('teacher', teacher.user._id);

  // Teach skill -> /skills (creates in "skills" collection)
  const teach = await fetch(BASE + '/skills', {
    method: 'POST', headers: { ...H(teacher.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Guitar', category: 'Music', level: 'Beginner', description: 'Teach guitar' })
  }).then(r => r.json());
  if (!teach._id) throw new Error('teach skill not created: ' + JSON.stringify(teach));
  console.log('TEACH skill ->', teach._id, teach.title);

  // Learn skill -> /learn-skills (creates in "learnSkills" collection)
  const learn = await fetch(BASE + '/learn-skills', {
    method: 'POST', headers: { ...H(teacher.token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Piano', category: 'Music', level: 'Intermediate', description: 'Want to learn piano' })
  }).then(r => r.json());
  if (!learn._id) throw new Error('learn skill not created: ' + JSON.stringify(learn));
  console.log('LEARN skill ->', learn._id, learn.title);

  // Verify separation: /skills should NOT contain the learn skill, and vice versa
  const skills = await j('/skills');
  const learnSkills = await j('/learn-skills');
  const teachInLearn = learnSkills.find(s => s._id === teach._id);
  const learnInTeach = skills.find(s => s._id === learn._id);
  console.log('\n/skills count:', skills.length, '| /learn-skills count:', learnSkills.length);
  console.log('teach skill leaked into learnSkills?', teachInLearn ? 'YES (BAD)' : 'no (good)');
  console.log('learn skill leaked into skills?', learnInTeach ? 'YES (BAD)' : 'no (good)');

  // Delete both (teach via /skills, learn via /learn-skills)
  const dT = await fetch(BASE + `/skills/${teach._id}`, { method: 'DELETE', headers: H(teacher.token) });
  const dL = await fetch(BASE + `/learn-skills/${learn._id}`, { method: 'DELETE', headers: H(teacher.token) });
  console.log('\ndelete teach status:', dT.status, '| delete learn status:', dL.status);

  // Cleanup user
  const { createRequire } = await import('module');
  const require = createRequire('D:/coding/Campus Skill/package.json');
  const { MongoClient } = require('mongodb');
  const client = new MongoClient('mongodb://localhost:27017/campus_skill');
  await client.connect();
  await client.db().collection('users').deleteMany({ email: 'split_t@x.io' });
  await client.db().collection('skills').deleteMany({});
  await client.db().collection('learnSkills').deleteMany({});
  await client.close();
  console.log('\nCLEANUP done — DB empty.');
  process.exit(0);
})().catch(e => { console.error('TEST FAILED:', e.message); process.exit(1); });
