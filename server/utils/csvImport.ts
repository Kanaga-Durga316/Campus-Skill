import { parse } from 'csv-parse/sync';
import { User, Skill, LearnSkill } from '../models/index.js';
import { hashPassword } from './auth.js';

export interface CsvRow {
  name?: string;
  email?: string;
  collegeName?: string;
  department?: string;
  year?: string;
  skills?: string;
  offerSkills?: string;
  wantedSkills?: string;
  courseTitle?: string;
  courseDescription?: string;
  courseCategory?: string;
  courseLevel?: string;
  courseDuration?: string;
  courseObjectives?: string;
  modules?: string;
  notes?: string;
  resources?: string;
  videoLinks?: string;
  referenceLinks?: string;
  liveClassLinks?: string;
  assignmentLinks?: string;
  quizLinks?: string;
  [key: string]: string | undefined;
}

export interface ImportSummary {
  totalRecords: number;
  usersCreated: number;
  usersSkipped: number;
  skillsCreated: number;
  coursesCreated: number;
  errors: string[];
}

function splitCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function sanitizeString(value: string | undefined): string {
  if (!value) return '';
  return String(value).trim();
}

function normalizeCategory(skillName: string): string {
  const lower = skillName.toLowerCase();
  if (lower.includes('python') || lower.includes('java') || lower.includes('javascript') || lower.includes('react') || lower.includes('node') || lower.includes('mongodb') || lower.includes('sql') || lower.includes('c++') || lower.includes('c#') || lower.includes('coding') || lower.includes('programming') || lower.includes('web') || lower.includes('mobile') || lower.includes('android') || lower.includes('flutter') || lower.includes('data') || lower.includes('machine learning') || lower.includes('ai') || lower.includes('cloud') || lower.includes('docker') || lower.includes('git') || lower.includes('iot') || lower.includes('arduino') || lower.includes('robotics') || lower.includes('blockchain')) {
    return 'Technology';
  }
  if (lower.includes('design') || lower.includes('figma') || lower.includes('ui') || lower.includes('ux') || lower.includes('graphic') || lower.includes('photo') || lower.includes('video') || lower.includes('edit')) {
    return 'Design';
  }
  if (lower.includes('marketing') || lower.includes('business') || lower.includes('finance') || lower.includes('management') || lower.includes('leadership')) {
    return 'Business';
  }
  if (lower.includes('english') || lower.includes('communication') || lower.includes('speaking') || lower.includes('language') || lower.includes('public')) {
    return 'Communication';
  }
  if (lower.includes('math') || lower.includes('physics') || lower.includes('chemistry') || lower.includes('academic') || lower.includes('study') || lower.includes('exam') || lower.includes('aptitude')) {
    return 'Academics';
  }
  return 'Other';
}

function normalizeLevel(level: string | undefined): string {
  if (!level) return 'Beginner';
  const lower = level.toLowerCase();
  if (lower.includes('beginner') || lower.includes('basic') || lower.includes('intro') || lower.includes('easy')) return 'Beginner';
  if (lower.includes('intermediate') || lower.includes('medium') || lower.includes('moderate')) return 'Intermediate';
  if (lower.includes('advanced') || lower.includes('expert') || lower.includes('hard') || lower.includes('pro')) return 'Advanced';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

export async function importCsv(buffer: Buffer): Promise<ImportSummary> {
  const summary: ImportSummary = {
    totalRecords: 0,
    usersCreated: 0,
    usersSkipped: 0,
    skillsCreated: 0,
    coursesCreated: 0,
    errors: [],
  };

  let records: CsvRow[];
  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as CsvRow[];
  } catch (err: any) {
    summary.errors.push(`CSV parse error: ${err.message}`);
    return summary;
  }

  summary.totalRecords = records.length;

  if (records.length === 0) {
    summary.errors.push('CSV file is empty or has no data rows');
    return summary;
  }

  const defaultPassword = await hashPassword('Campus@123');

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowIndex = i + 1;

    const name = sanitizeString(row.name);
    const email = sanitizeString(row.email).toLowerCase();

    if (!name) {
      summary.errors.push(`Row ${rowIndex}: Name is required`);
      continue;
    }

    if (!email) {
      summary.errors.push(`Row ${rowIndex}: Email is required`);
      continue;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      summary.errors.push(`Row ${rowIndex}: Invalid email format: ${email}`);
      continue;
    }

    try {
      const existingUser = await User.findOne({ email }).lean().exec();
      if (existingUser) {
        summary.usersSkipped++;
        summary.errors.push(`Row ${rowIndex}: User with email ${email} already exists (skipped)`);
        continue;
      }

      const department = sanitizeString(row.department) || undefined;
      const year = sanitizeString(row.year) || undefined;
      const college = sanitizeString(row.collegeName) || undefined;

      const skills = splitCsv(row.skills);
      const offerSkills = splitCsv(row.offerSkills);
      const wantedSkills = splitCsv(row.wantedSkills);

      const user = await User.create({
        name,
        email,
        password: defaultPassword,
        role: 'student',
        department,
        year,
        college,
        skills,
        skillsTeaching: offerSkills,
        skillsLearning: wantedSkills,
        profileVisibility: 'public',
        verificationStatus: 'unverified',
        preferredMode: 'online',
        experienceLevel: 'beginner',
        sessionDurationHours: 1,
      });

      summary.usersCreated++;

      for (const skillName of offerSkills) {
        const existingSkill = await Skill.findOne({
          'owner._id': user._id,
          title: skillName,
        }).lean().exec();

        if (!existingSkill) {
          const courseTitle = sanitizeString(row.courseTitle);
          const courseDescription = sanitizeString(row.courseDescription);
          const courseCategory = sanitizeString(row.courseCategory);
          const courseLevel = sanitizeString(row.courseLevel);
          const courseDuration = sanitizeString(row.courseDuration);
          const courseObjectives = sanitizeString(row.courseObjectives);
          const modulesRaw = sanitizeString(row.modules);
          const videoLinks = splitCsv(row.videoLinks);
          const referenceLinks = splitCsv(row.referenceLinks) || splitCsv(row.resources);
          const assignmentLinks = splitCsv(row.assignmentLinks);
          const liveClassLink = sanitizeString(row.liveClassLinks);
          const notes = sanitizeString(row.notes) || courseObjectives;

          const hasCourseData = !!(courseTitle || courseDescription || courseCategory || courseLevel || courseDuration || modulesRaw || videoLinks.length > 0 || referenceLinks.length > 0 || assignmentLinks.length > 0 || liveClassLink);

          if (hasCourseData) {
            const modules = modulesRaw
              .split(/[;,]/)
              .map((m) => m.trim())
              .filter(Boolean)
              .map((title) => ({
                title,
                description: '',
                notes: '',
                notesFile: '',
                videoLinks: [],
                recordedVideoLinks: [],
                liveClassLink: '',
                assignments: [],
                quizzes: [],
              }));

            const title = offerSkills.length === 1 ? (courseTitle || skillName) : skillName;
            const description = offerSkills.length === 1 ? (courseDescription || `Teaching skill: ${skillName}`) : `Teaching skill: ${skillName}`;

            await Skill.create({
              title,
              description,
              category: courseCategory || normalizeCategory(skillName),
              tags: [skillName],
              level: normalizeLevel(courseLevel),
              owner: { _id: user._id, name: user.name },
              courseDescription: offerSkills.length === 1 ? courseDescription : '',
              notes,
              videoLinks,
              recordedVideoLinks: [],
              liveClassLink: liveClassLink || '',
              referenceLinks,
              assignments: assignmentLinks,
              githubLink: '',
              difficulty: '',
              duration: courseDuration,
              published: false,
              status: 'pending',
              submittedAt: new Date(),
              modules: offerSkills.length === 1 ? modules : [],
              thumbnail: '',
            });
            summary.coursesCreated++;
          } else {
            await Skill.create({
              title: skillName,
              description: `Teaching skill: ${skillName}`,
              category: normalizeCategory(skillName),
              tags: [skillName],
              level: 'Beginner',
              owner: { _id: user._id, name: user.name },
              courseDescription: '',
              notes: '',
              videoLinks: [],
              recordedVideoLinks: [],
              liveClassLink: '',
              referenceLinks: [],
              assignments: [],
              githubLink: '',
              difficulty: '',
              duration: '',
              published: false,
              status: 'pending',
              submittedAt: new Date(),
              modules: [],
              thumbnail: '',
            });
            summary.skillsCreated++;
          }
        }
      }

      for (const skillName of wantedSkills) {
        const existingLearn = await LearnSkill.findOne({
          'owner._id': user._id,
          title: skillName,
        }).lean().exec();

        if (!existingLearn) {
          await LearnSkill.create({
            title: skillName,
            description: `Learning goal: ${skillName}`,
            category: normalizeCategory(skillName),
            tags: [skillName],
            level: normalizeLevel(undefined),
            owner: { _id: user._id, name: user.name },
            availability: true,
            rating: 0,
          });
        }
      }
    } catch (err: any) {
      summary.errors.push(`Row ${rowIndex}: Failed to create user ${email}: ${err.message}`);
    }
  }

  return summary;
}
