import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { hashPassword } from '../utils/auth.js';
import { User, Skill, LearnSkill, ExchangeRequest, Message, Notification, Review, ChatRoom, Announcement, Meeting, Poll, DiscussionPost, DiscussionReply, SharedFile, StudyGroup, Attendance } from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('FATAL: MONGODB_URI environment variable is not set.');
  process.exit(1);
}

const COLLECTIONS = [
  'attendance',
  'studygroups',
  'sharedfiles',
  'discussionreplies',
  'discussionposts',
  'polls',
  'meetings',
  'announcements',
  'chatrooms',
  'notifications',
  'reviews',
  'messages',
  'requests',
  'skills',
  'learnskills',
  'users',
];

async function clearDatabase(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection not established');
  for (const col of COLLECTIONS) {
    await db.collection(col).deleteMany({});
    console.log(`Cleared collection: ${col}`);
  }
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'Civil', 'AI&DS', 'Cyber Security'];
const SKILLS_POOL = [
  'Python', 'Java', 'C', 'C++', 'React', 'Node.js', 'MongoDB', 'UI/UX', 'Figma',
  'Machine Learning', 'Deep Learning', 'Cloud Computing', 'Cyber Security', 'Data Structures',
  'Algorithms', 'SQL', 'Git', 'Docker', 'AWS', 'Android Development', 'Flutter',
  'Photography', 'Public Speaking', 'Communication', 'Resume Building', 'Interview Preparation',
  'Aptitude', 'English Speaking', 'Video Editing', 'Graphic Design', 'Digital Marketing',
  'Excel', 'Power BI', 'Tableau', 'Leadership', 'IoT', 'Arduino', 'Robotics', 'Blockchain', 'AI Prompt Engineering'
];

const FIRST_NAMES = ['Aarav', 'Aditya', 'Ananya', 'Arjun', 'Diya', 'Ishaan', 'Kavya', 'Rohan', 'Priya', 'Vikram', 'Neha', 'Rahul', 'Sneha', 'Karan', 'Meera', 'Vivek', 'Anjali', 'Siddharth', 'Pooja', 'Ravi', 'Divya', 'Amit', 'Swathi', 'Karthik', 'Lakshmi', 'Raj', 'Shreya', 'Manish', 'Deepa', 'Sanjay'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Kumar', 'Singh', 'Gupta', 'Joshi', 'Iyer', 'Rao', 'Nair', 'Choudhury', 'Das', 'Pillai', 'Mishra', 'Agarwal', 'Bhat', 'Kulkarni', 'Menon', 'Pandey'];

const TEACHER_NAMES = [
  'Dr. Ramesh Iyer', 'Prof. Anjali Menon', 'Dr. Kiran Reddy', 'Prof. Sneha Nair',
  'Dr. Vikram Singh', 'Prof. Priya Sharma', 'Dr. Arjun Patel', 'Prof. Deepa Choudhury',
  'Dr. Suresh Das', 'Prof. Kavya Pillai'
];

const STUDENT_NAMES = [
  'Aarav Sharma', 'Aditya Verma', 'Ananya Patel', 'Arjun Reddy', 'Diya Kumar',
  'Ishaan Singh', 'Kavya Gupta', 'Rohan Joshi', 'Priya Iyer', 'Vikram Rao',
  'Neha Nair', 'Rahul Choudhury', 'Sneha Das', 'Karan Pillai', 'Meera Mishra',
  'Vivek Agarwal', 'Anjali Bhat', 'Siddharth Kulkarni', 'Pooja Menon', 'Ravi Pandey',
  'Divya Shah', 'Amit Malhotra', 'Swathi Reddy', 'Karthik Iyer', 'Lakshmi Nair',
  'Raj Choudhury', 'Shreya Das', 'Manish Pillai', 'Deepa Mishra', 'Sanjay Agarwal',
  'Riya Bhat', 'Vikram Kulkarni', 'Nisha Menon', 'Rahul Pandey', 'Sneha Shah',
  'Karan Malhotra', 'Meera Reddy', 'Vivek Iyer', 'Anjali Nair', 'Siddharth Choudhury',
  'Pooja Das', 'Ravi Pillai', 'Divya Mishra', 'Amit Agarwal', 'Swathi Bhat',
  'Karthik Kulkarni', 'Lakshmi Menon', 'Raj Pandey', 'Shreya Shah', 'Manish Malhotra'
];

const ACHIEVEMENTS_POOL = [
  { title: 'Top Mentor', icon: '🏆', description: 'Recognized for outstanding mentoring' },
  { title: 'Fast Learner', icon: '⭐', description: 'Completed 5 courses in record time' },
  { title: 'Quiz Champion', icon: '🎖', description: 'Scored 100% in 10 consecutive quizzes' },
  { title: 'Coding Expert', icon: '💻', description: 'Solved 500+ coding problems' },
  { title: 'Course Creator', icon: '📚', description: 'Published 3+ high-quality courses' },
  { title: 'Excellent Mentor', icon: '🌟', description: 'Received 50+ positive reviews' },
  { title: 'Consistent Learner', icon: '🔥', description: '30-day learning streak' },
  { title: 'Top Rated Teacher', icon: '👨‍🏫', description: 'Average rating above 4.8' },
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedAdmin(): Promise<User> {
  const hashed = await hashPassword('Admin@123');
  return User.create({
    name: 'Platform Administrator',
    email: 'admin@campusskill.com',
    password: hashed,
    role: 'admin',
    bio: 'Platform administrator managing Campus Skill Exchange.',
    verificationStatus: 'verified',
    profileVisibility: 'public',
    privacySettings: { showEmail: true, showPhone: false, showPortfolio: true, showCertificates: true, showAchievements: true },
    teachingAnalytics: { totalCourses: 0, studentsEnrolled: 0, completedCourses: 0, averageRating: 0, teachingHours: 0, assignmentsCreated: 0, quizzesCreated: 0, certificatesIssued: 0 },
    learningAnalytics: { learningHours: 0, coursesCompleted: 0, coursesInProgress: 0, assignmentsSubmitted: 0, quizAverage: 0, currentStreak: 0, longestStreak: 0 },
    profileCompletion: 100,
    followers: [],
    following: [],
    bookmarks: [],
    calendarEvents: [],
    certificates: [],
    achievements: [],
    skillsTeaching: [],
    skillsLearning: [],
    socialLinks: {},
    portfolioLinks: [],
  });
}

async function seedTeachers(): Promise<any[]> {
  const teachers: User[] = [];
  for (let i = 0; i < 10; i++) {
    const name = TEACHER_NAMES[i];
    const hashed = await hashPassword('Teacher@123');
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const teacher = await User.create({
      name,
      email: `teacher${i + 1}@campusskill.com`,
      password: hashed,
      role: 'teacher',
      bio: `Experienced ${dept} educator passionate about teaching and mentoring students.`,
      department: dept,
      year: `${randInt(1, 4)}`,
      studentId: `TCH${String(i + 1).padStart(3, '0')}`,
      college: 'Institute of Technology',
      university: 'State University',
      semester: `${randInt(1, 8)}`,
      cgpa: +(Math.min(randInt(7, 10) + Math.random(), 10)).toFixed(2),
      graduationYear: `${randInt(2020, 2024)}`,
      careerGoal: 'To educate and inspire the next generation of engineers.',
      academicInterests: [randItem(SKILLS_POOL), randItem(SKILLS_POOL), randItem(SKILLS_POOL)],
      preferredMode: randItem(['online', 'offline', 'hybrid']),
      experienceLevel: 'advanced',
      sessionDurationHours: randInt(1, 3),
      verificationStatus: 'verified',
      profileVisibility: 'public',
      privacySettings: { showEmail: true, showPhone: false, showPortfolio: true, showCertificates: true, showAchievements: true },
      teachingAnalytics: {
        totalCourses: randInt(3, 8),
        studentsEnrolled: randInt(50, 300),
        completedCourses: randInt(10, 60),
        averageRating: +(randInt(35, 50) / 10).toFixed(1),
        teachingHours: randInt(100, 500),
        assignmentsCreated: randInt(20, 100),
        quizzesCreated: randInt(15, 80),
        certificatesIssued: randInt(20, 100),
      },
      learningAnalytics: { learningHours: randInt(10, 100), coursesCompleted: randInt(2, 10), coursesInProgress: randInt(1, 5), assignmentsSubmitted: randInt(5, 30), quizAverage: +(randInt(60, 95)), currentStreak: randInt(0, 30), longestStreak: randInt(10, 100) },
      profileCompletion: randInt(75, 100),
      followers: [],
      following: [],
      bookmarks: [],
      calendarEvents: [],
      certificates: [],
      achievements: [randItem(ACHIEVEMENTS_POOL), randItem(ACHIEVEMENTS_POOL)],
      skillsTeaching: [],
      skillsLearning: [],
      socialLinks: { github: `https://github.com/teacher${i + 1}`, linkedin: `https://linkedin.com/in/teacher${i + 1}`, portfolio: `https://teacher${i + 1}.dev` },
      portfolioLinks: [`https://teacher${i + 1}.dev`, `https://github.com/teacher${i + 1}`],
    });
    teachers.push(teacher);
  }
  return teachers;
}

async function seedStudents(): Promise<any[]> {
  const students: User[] = [];
  for (let i = 0; i < 50; i++) {
    const name = STUDENT_NAMES[i];
    const hashed = await hashPassword('Student@123');
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const hasCertificates = i % 3 === 0;
    const hasAchievements = i % 2 === 0;
    const completedCourses = i % 4 === 0 ? randInt(1, 5) : 0;
    const student = await User.create({
      name,
      email: `student${i + 1}@campusskill.com`,
      password: hashed,
      role: 'student',
      bio: `${dept} student eager to learn and grow.`,
      department: dept,
      year: `${randInt(1, 4)}`,
      studentId: `STU${String(i + 1).padStart(3, '0')}`,
      college: 'Institute of Technology',
      university: 'State University',
      semester: `${randInt(1, 8)}`,
      cgpa: +(Math.min(randInt(6, 10) + Math.random(), 10)).toFixed(2),
      graduationYear: `${randInt(2025, 2028)}`,
      careerGoal: 'To become a skilled professional in ' + randItem(SKILLS_POOL),
      academicInterests: [randItem(SKILLS_POOL), randItem(SKILLS_POOL)],
      preferredMode: randItem(['online', 'offline', 'hybrid']),
      experienceLevel: randItem(['beginner', 'intermediate', 'advanced']),
      sessionDurationHours: randInt(1, 3),
      verificationStatus: i % 5 === 0 ? 'verified' : 'unverified',
      profileVisibility: randItem(['public', 'public', 'public', 'college', 'private']),
      privacySettings: { showEmail: i % 3 === 0, showPhone: false, showPortfolio: true, showCertificates: true, showAchievements: true },
      teachingAnalytics: { totalCourses: 0, studentsEnrolled: 0, completedCourses: 0, averageRating: 0, teachingHours: 0, assignmentsCreated: 0, quizzesCreated: 0, certificatesIssued: 0 },
      learningAnalytics: {
        learningHours: randInt(5, 200),
        coursesCompleted: completedCourses,
        coursesInProgress: randInt(1, 4),
        assignmentsSubmitted: randInt(2, 20),
        quizAverage: randInt(50, 100),
        currentStreak: randInt(0, 15),
        longestStreak: randInt(5, 50),
      },
      profileCompletion: randInt(40, 95),
      followers: [],
      following: [],
      bookmarks: [],
      calendarEvents: [],
      certificates: hasCertificates ? [{ title: 'Course Completion', skill: randItem(SKILLS_POOL), issuedAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(), issuedBy: 'Platform' }] : [],
      achievements: hasAchievements ? [randItem(ACHIEVEMENTS_POOL), randItem(ACHIEVEMENTS_POOL)] : [],
      skillsTeaching: [],
      skillsLearning: [randItem(SKILLS_POOL), randItem(SKILLS_POOL)],
      socialLinks: { github: `https://github.com/student${i + 1}`, linkedin: `https://linkedin.com/in/student${i + 1}` },
      portfolioLinks: [`https://student${i + 1}.dev`],
    });
    students.push(student);
  }
  return students;
}

async function seedSkills(teachers: any[]): Promise<any[]> {
  const skills: Skill[] = [];
  const statuses: Array<'approved' | 'pending' | 'rejected' | 'changes_requested'> = ['approved', 'pending', 'rejected', 'changes_requested'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  const durations = ['1 week', '2 weeks', '3 weeks', '4 weeks', '6 weeks', '8 weeks'];

  for (let i = 0; i < 55; i++) {
    const owner = randItem(teachers);
    const status = i < 40 ? 'approved' : i < 50 ? 'pending' : 'rejected';
    const skill = await Skill.create({
      title: SKILLS_POOL[i % SKILLS_POOL.length] + (i >= SKILLS_POOL.length ? ` ${Math.floor(i / SKILLS_POOL.length) + 1}` : ''),
      description: `Master ${SKILLS_POOL[i % SKILLS_POOL.length]} from scratch to advanced level. This comprehensive course covers all essential topics.`,
      category: randItem(['Technology', 'Design', 'Business', 'Academics', 'Communication', 'Other']),
      tags: [SKILLS_POOL[i % SKILLS_POOL.length], randItem(SKILLS_POOL), randItem(SKILLS_POOL)],
      level: randItem(['Beginner', 'Intermediate', 'Advanced']),
      owner: { _id: owner._id, name: owner.name },
      courseDescription: `Complete guide to ${SKILLS_POOL[i % SKILLS_POOL.length]} with hands-on projects and real-world applications.`,
      notes: 'Course notes will be provided module-wise.',
      videoLinks: [`https://youtube.com/watch?v=${generateId()}`],
      recordedVideoLinks: [],
      liveClassLink: status === 'approved' ? `https://meet.example.com/${generateId()}` : '',
      referenceLinks: [`https://docs.example.com/${SKILLS_POOL[i % SKILLS_POOL.length].toLowerCase()}`],
      assignments: [`Assignment ${randInt(1, 5)}: Build a project using ${SKILLS_POOL[i % SKILLS_POOL.length]}`],
      githubLink: `https://github.com/example/${SKILLS_POOL[i % SKILLS_POOL.length].toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      difficulty: randItem(difficulties),
      duration: randItem(durations),
      published: status === 'approved',
      status,
      submittedAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
      approvedAt: status === 'approved' ? randomDate(new Date(2024, 6, 1), new Date()).toISOString() : undefined,
      approvedBy: status === 'approved' ? randItem(teachers)._id : undefined,
      rejectionReason: status === 'rejected' ? 'Course content needs more practical examples and structured modules.' : undefined,
      adminComments: status === 'rejected' ? 'Please revise the curriculum and add more hands-on assignments.' : undefined,
      modules: [
        { title: 'Introduction', description: 'Getting started with ' + SKILLS_POOL[i % SKILLS_POOL.length], notes: 'Overview of the course.', videoLinks: [], recordedVideoLinks: [], assignments: [], quizzes: [] },
        { title: 'Core Concepts', description: 'Deep dive into fundamentals.', notes: 'Key concepts explained.', videoLinks: [`https://youtube.com/watch?v=${generateId()}`], recordedVideoLinks: [], assignments: ['Complete exercise set'], quizzes: [{ _id: generateId(), question: 'What is the main concept?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctIndex: 0 }] },
        { title: 'Advanced Topics', description: 'Advanced techniques and best practices.', notes: 'Advanced material.', videoLinks: [], recordedVideoLinks: [], assignments: [], quizzes: [] },
      ],
      thumbnail: `https://picsum.photos/seed/${i + 1}/400/250`,
      rating: +(randInt(30, 50) / 10).toFixed(1),
      availability: true,
    });
    skills.push(skill);
  }
  return skills;
}

async function seedLearnSkills(students: any[]): Promise<any[]> {
  const items: LearnSkill[] = [];
  for (let i = 0; i < 30; i++) {
    const owner = randItem(students);
    const item = await LearnSkill.create({
      title: 'Learning ' + SKILLS_POOL[i % SKILLS_POOL.length],
      description: `I want to learn ${SKILLS_POOL[i % SKILLS_POOL.length]} to enhance my skills.`,
      category: randItem(['Technology', 'Design', 'Business', 'Academics', 'Communication', 'Other']),
      tags: [SKILLS_POOL[i % SKILLS_POOL.length]],
      level: randItem(['Beginner', 'Intermediate', 'Advanced']),
      owner: { _id: owner._id, name: owner.name },
      availability: true,
      rating: +(randInt(20, 45) / 10).toFixed(1),
    });
    items.push(item);
  }
  return items;
}

async function seedExchangeRequests(students: any[], teachers: any[], skills: any[]): Promise<any[]> {
  const requests: ExchangeRequest[] = [];
  const approvedSkills = skills.filter((s) => s.status === 'approved');
  for (let i = 0; i < 80; i++) {
    const student = randItem(students);
    const teacher = randItem(teachers);
    const skill = randItem(approvedSkills);
    const skillOffered = randItem(approvedSkills);
    const status = randItem(['open', 'pending', 'accepted', 'rejected', 'cancelled', 'completed']);
    const request = await ExchangeRequest.create({
      requester: { _id: student._id, name: student.name },
      responder: { _id: teacher._id, name: teacher.name },
      skillRequested: {
        _id: skill._id,
        title: skill.title,
        category: skill.category,
        level: skill.level,
        courseDescription: skill.courseDescription,
        difficulty: skill.difficulty,
        duration: skill.duration,
        liveClassLink: skill.liveClassLink,
        modules: skill.modules,
      },
      skillOffered: { _id: skillOffered._id, title: skillOffered.title },
      status,
      message: `Hi, I would like to learn ${skill.title}.`,
      scheduledAt: status === 'accepted' ? randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : '',
      progress: status === 'completed' ? 100 : randInt(0, status === 'accepted' ? 90 : 0),
      completedModules: status === 'completed' ? ['Introduction', 'Core Concepts'] : [],
      quizScore: status === 'completed' ? randInt(7, 10) : 0,
      quizTotal: 10,
      quizStatus: status === 'completed' ? 'passed' : 'not_started',
      assignmentStatus: status === 'completed' ? 'graded' : randItem(['not_started', 'submitted', 'graded']),
      assignmentText: status === 'completed' ? 'Completed all assignments.' : '',
      liveClassAttended: status === 'completed',
      feedback: status === 'completed' ? { rating: randInt(3, 5), comment: 'Great learning experience!' } : { rating: 0, comment: '' },
      certificate: status === 'completed' ? { issued: true, certificateId: `CERT-${generateId()}`, issuedAt: new Date().toISOString() } : { issued: false, certificateId: '', issuedAt: '' },
      completedAt: status === 'completed' ? new Date().toISOString() : '',
      createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
      updatedAt: randomDate(new Date(2024, 6, 1), new Date()).toISOString(),
    });
    requests.push(request);
  }
  return requests;
}

async function seedMessages(users: any[]): Promise<void> {
  const messages: any[] = [];
  for (let i = 0; i < 150; i++) {
    const from = randItem(users);
    let to = randItem(users);
    while (to._id === from._id) to = randItem(users);
    messages.push({
      _id: generateId(),
      from: { _id: from._id, name: from.name },
      to: { _id: to._id, name: to.name },
      text: randItem(['Hello!', 'When is the next session?', 'Thanks for the help!', 'Can you explain this concept?', 'Great course!', 'I have a doubt.', 'See you in class.', 'Assignment submitted.']),
      read: Math.random() > 0.3,
      createdAt: randomDate(new Date(2024, 6, 1), new Date()).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  await Message.insertMany(messages);
}

async function seedNotifications(users: any[]): Promise<void> {
  const notifs: any[] = [];
  const types = ['course_approved', 'course_rejected', 'assignment_uploaded', 'quiz_published', 'certificate_issued', 'student_joined', 'new_review', 'meeting_reminder'];
  for (let i = 0; i < 200; i++) {
    const user = randItem(users);
    notifs.push({
      _id: generateId(),
      userId: user._id,
      type: randItem(types),
      message: randItem([
        'Your course has been approved!',
        'New assignment has been uploaded.',
        'Quiz is scheduled for tomorrow.',
        'Your certificate is ready.',
        'A new student joined your course.',
        'You received a new review.',
        'Reminder: Live session in 1 hour.',
      ]),
      read: Math.random() > 0.4,
      link: '/dashboard',
      createdAt: randomDate(new Date(2024, 6, 1), new Date()).toISOString(),
    });
  }
  await Notification.insertMany(notifs);
}

async function seedReviews(skills: any[], users: any[]): Promise<void> {
  const reviews: any[] = [];
  for (const skill of skills) {
    if (skill.status !== 'approved') continue;
    const count = randInt(5, 20);
    for (let i = 0; i < count; i++) {
      const reviewer = randItem(users);
      reviews.push({
        _id: generateId(),
        requestId: generateId(),
        skillId: skill._id,
        reviewerId: reviewer._id,
        revieweeId: skill.owner._id,
        rating: randInt(3, 5),
        comment: randItem(['Excellent course!', 'Very helpful.', 'Well structured.', 'Great teacher!', 'Learned a lot.', 'Highly recommended.', 'Good content.']),
        createdAt: randomDate(new Date(2024, 6, 1), new Date()).toISOString(),
      });
    }
  }
  await Review.insertMany(reviews);
}

async function seedChatRooms(users: any[]): Promise<void> {
  const rooms: any[] = [];
  for (let i = 0; i < 20; i++) {
    const participants = [randItem(users), randItem(users)];
    rooms.push({
      _id: generateId(),
      name: participants.map((p) => p.name).join(' & '),
      type: 'private',
      participants: participants.map((p) => ({ _id: p._id, name: p.name })),
      createdBy: participants[0]._id,
      lastMessage: randItem(['Hello!', 'See you soon.', 'Thanks!', 'Ok.', 'Sure.']),
      lastMessageAt: randomDate(new Date(2024, 6, 1), new Date()),
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
    });
  }
  await ChatRoom.insertMany(rooms);
}

async function seedAnnouncements(skills: any[], teachers: any[]): Promise<void> {
  const announcements: any[] = [];
  for (const skill of skills.slice(0, 20)) {
    const count = randInt(1, 5);
    for (let i = 0; i < count; i++) {
      announcements.push({
        _id: generateId(),
        skillId: skill._id,
        title: randItem(['New Notes Uploaded', 'Assignment Released', 'Quiz Tomorrow', 'Live Session Today', 'Holiday Notice']),
        message: 'Please check the course page for details.',
        type: randItem(['general', 'assignment', 'quiz', 'live_session', 'holiday']),
        createdBy: randItem(teachers)._id,
        createdAt: randomDate(new Date(2024, 6, 1), new Date()).toISOString(),
      });
    }
  }
  await Announcement.insertMany(announcements);
}

async function seedMeetings(skills: any[], teachers: any[]): Promise<void> {
  const meetings: any[] = [];
  for (const skill of skills.slice(0, 15)) {
    const count = randInt(1, 4);
    for (let i = 0; i < count; i++) {
      meetings.push({
        _id: generateId(),
        skillId: skill._id,
        title: `${skill.title} - Live Session`,
        date: randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        time: `${String(randInt(9, 17)).padStart(2, '0')}:00`,
        duration: `${randInt(1, 3)} hours`,
        link: `https://meet.example.com/${generateId()}`,
        platform: randItem(['google_meet', 'zoom', 'teams']),
        password: generateId(),
        reminder: true,
        createdBy: randItem(teachers)._id,
        createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
      });
    }
  }
  await Meeting.insertMany(meetings);
}

async function seedPolls(skills: any[]): Promise<void> {
  const polls: any[] = [];
  for (const skill of skills.slice(0, 10)) {
    polls.push({
      _id: generateId(),
      skillId: skill._id,
      question: `What is your preferred time for ${skill.title} sessions?`,
      options: [
        { text: 'Morning (9-12)', votes: randInt(5, 30) },
        { text: 'Afternoon (12-4)', votes: randInt(5, 30) },
        { text: 'Evening (4-8)', votes: randInt(5, 30) },
      ],
      createdBy: skill.owner._id,
      active: Math.random() > 0.2,
      createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    });
  }
  await Poll.insertMany(polls);
}

async function seedDiscussions(skills: any[], users: any[]): Promise<void> {
  const posts: any[] = [];
  const replies: any[] = [];
  for (const skill of skills.slice(0, 15)) {
    const count = randInt(2, 8);
    for (let i = 0; i < count; i++) {
      const post = await DiscussionPost.create({
        _id: generateId(),
        skillId: skill._id,
        authorId: randItem(users)._id,
        authorName: randItem(users).name,
        title: randItem(['How to get started?', 'Best resources for learning?', 'Doubt in module 2', 'Project ideas?', 'Career guidance?']),
        content: 'I have a question regarding the course content. Can someone help me understand this better?',
        pinned: Math.random() > 0.8,
        bestAnswerId: '',
        reported: false,
        createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
      });
      posts.push(post);

      const replyCount = randInt(1, 5);
      for (let j = 0; j < replyCount; j++) {
        replies.push({
          _id: generateId(),
          postId: post._id,
          skillId: skill._id,
          authorId: randItem(users)._id,
          authorName: randItem(users).name,
          content: randItem(['Check the documentation.', 'I found this helpful.', 'Try solving the exercises.', 'Great question!', 'Let me explain...']),
          likes: [randItem(users)._id, randItem(users)._id],
          highlighted: Math.random() > 0.7,
          createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
        });
      }
    }
  }
  await DiscussionReply.insertMany(replies);
}

async function seedStudyGroups(skills: any[], users: any[]): Promise<void> {
  const groups: any[] = [];
  for (const skill of skills.slice(0, 10)) {
    groups.push({
      _id: generateId(),
      name: `${skill.title} Study Group`,
      description: `Study group for ${skill.title} enthusiasts.`,
      skillId: skill._id,
      members: [randItem(users), randItem(users), randItem(users)].map((u) => ({ _id: u._id, name: u.name })),
      createdBy: randItem(users)._id,
      createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    });
  }
  await StudyGroup.insertMany(groups);
}

async function seedSharedFiles(skills: any[], users: any[]): Promise<void> {
  const files: any[] = [];
  for (const skill of skills.slice(0, 10)) {
    const count = randInt(2, 6);
    for (let i = 0; i < count; i++) {
      files.push({
        _id: generateId(),
        skillId: skill._id,
        uploadedBy: randItem(users)._id,
        fileName: randItem(['notes.pdf', 'assignment.docx', 'presentation.pptx', 'code.zip', 'ebook.pdf']),
        filePath: `/uploads/${generateId()}`,
        fileSize: randInt(1024, 5 * 1024 * 1024),
        mimeType: randItem(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip']),
        createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
      });
    }
  }
  await SharedFile.insertMany(files);
}

async function seedAttendance(skills: any[], users: any[]): Promise<void> {
  const records: any[] = [];
  for (const skill of skills.slice(0, 10)) {
    const meetingId = generateId();
    for (const user of users.slice(0, 20)) {
      records.push({
        _id: generateId(),
        skillId: skill._id,
        meetingId,
        userId: user._id,
        userName: user.name,
        status: randItem(['present', 'absent', 'late']),
        createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
      });
    }
  }
  await Attendance.insertMany(records);
}

async function seedBookmarks(students: any[], skills: any[]): Promise<void> {
  const updates: Promise<any>[] = [];
  for (const student of students) {
    const bm = skills.slice(0, randInt(2, 6)).map((s) => s._id);
    updates.push(User.findByIdAndUpdate(student._id, { $set: { bookmarks: bm } }).exec());
  }
  await Promise.all(updates);
}

async function seedFollowers(users: any[]): Promise<void> {
  const updates: Promise<any>[] = [];
  for (const user of users) {
    const count = randInt(5, 30);
    const followers = users.filter((u) => u._id !== user._id).slice(0, count).map((u) => u._id);
    const following = users.filter((u) => u._id !== user._id).slice(0, count).map((u) => u._id);
    updates.push(User.findByIdAndUpdate(user._id, { $set: { followers, following } }).exec());
  }
  await Promise.all(updates);
}

async function main(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    console.log('Clearing all collections...');
    await clearDatabase();

    console.log('Seeding admin...');
    const admin = await seedAdmin();

    console.log('Seeding teachers...');
    const teachers = await seedTeachers();

    console.log('Seeding students...');
    const students = await seedStudents();

    const allUsers = [admin, ...teachers, ...students];

    console.log('Seeding skills...');
    const skills = await seedSkills(teachers);

    console.log('Seeding learning goals...');
    const learnSkills = await seedLearnSkills(students);

    console.log('Seeding exchange requests...');
    const requests = await seedExchangeRequests(students, teachers, skills);

    console.log('Seeding messages...');
    await seedMessages(allUsers);

    console.log('Seeding notifications...');
    await seedNotifications(allUsers);

    console.log('Seeding reviews...');
    await seedReviews(skills, allUsers);

    console.log('Seeding chat rooms...');
    await seedChatRooms(allUsers);

    console.log('Seeding announcements...');
    await seedAnnouncements(skills, teachers);

    console.log('Seeding meetings...');
    await seedMeetings(skills, teachers);

    console.log('Seeding polls...');
    await seedPolls(skills);

    console.log('Seeding discussions...');
    await seedDiscussions(skills, allUsers);

    console.log('Seeding study groups...');
    await seedStudyGroups(skills, allUsers);

    console.log('Seeding shared files...');
    await seedSharedFiles(skills, allUsers);

    console.log('Seeding attendance...');
    await seedAttendance(skills, allUsers);

    console.log('Seeding bookmarks...');
    await seedBookmarks(students, skills);

    console.log('Seeding followers...');
    await seedFollowers(allUsers);

    console.log('Database seeded successfully!');
    console.log('Summary:');
    console.log(`  Admin: 1`);
    console.log(`  Teachers: ${teachers.length}`);
    console.log(`  Students: ${students.length}`);
    console.log(`  Skills: ${skills.length}`);
    console.log(`  Learn Skills: ${learnSkills.length}`);
    console.log(`  Exchange Requests: ${requests.length}`);

    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();
