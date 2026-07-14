/**
 * Progress engine for course enrollments.
 *
 * An enrollment's `progress` (0-100) is calculated ONLY here, on the backend,
 * from the student's completed milestones. The frontend never sends `progress`.
 *
 * Milestones (each counts as 1 equal-weight item):
 *   - every module in the course
 *   - assignment  (if the course has any assignment text)
 *   - quiz        (if the course has any quiz)
 *   - live class  (if the course has any liveClassLink)
 *
 * progress = round(completedMilestones / totalMilestones * 100)
 */

// Percentage of correct answers required to "pass" a quiz.
export const PASS_THRESHOLD = 0.6;

interface ProgressInput {
  completedModules: string[];
  assignmentStatus?: string;
  quizStatus?: string;
  liveClassAttended?: boolean;
  skill: any; // populated Skill document
}

export function computeProgress(input: ProgressInput): number {
  const skill = input.skill || {};
  const modules: any[] = Array.isArray(skill.modules) ? skill.modules : [];
  const completed = new Set((input.completedModules || []).map(String));

  let total = 0;
  let done = 0;

  // Modules
  for (const m of modules) {
    total += 1;
    if (completed.has(String(m._id))) done += 1;
  }

  // Assignment (one milestone if any assignment exists anywhere in the course)
  const hasAssignment =
    (Array.isArray(skill.assignments) && skill.assignments.length > 0) ||
    modules.some((m) => Array.isArray(m.assignments) && m.assignments.length > 0);
  if (hasAssignment) {
    total += 1;
    if (input.assignmentStatus === 'submitted' || input.assignmentStatus === 'graded') done += 1;
  }

  // Quiz (one milestone if any quiz exists anywhere in the course)
  const hasQuiz = modules.some((m) => Array.isArray(m.quizzes) && m.quizzes.length > 0);
  if (hasQuiz) {
    total += 1;
    if (input.quizStatus === 'passed') done += 1;
  }

  // Live class (one milestone if any liveClassLink exists)
  const hasLive = !!skill.liveClassLink || modules.some((m) => !!m.liveClassLink);
  if (hasLive) {
    total += 1;
    if (input.liveClassAttended) done += 1;
  }

  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/**
 * Grade a submission of answers and return { score, total, status }.
 * `answers` maps quizId -> selected option index.
 */
export function gradeQuiz(answers: Record<string, number>, skill: any): {
  score: number;
  total: number;
  status: 'not_started' | 'passed' | 'failed';
} {
  const modules: any[] = Array.isArray(skill?.modules) ? skill.modules : [];
  const allQuizzes: any[] = modules.flatMap((m) => (Array.isArray(m.quizzes) ? m.quizzes : []));
  const total = allQuizzes.length;
  let correct = 0;
  for (const q of allQuizzes) {
    const chosen = answers?.[String(q._id)];
    if (chosen !== undefined && Number(chosen) === q.correctIndex) correct += 1;
  }
  const status: 'not_started' | 'passed' | 'failed' =
    total === 0 ? 'not_started' : correct / total >= PASS_THRESHOLD ? 'passed' : 'failed';
  return { score: correct, total, status };
}

export function generateCertificateId(skillId: string, requestId: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CERT-${String(skillId).slice(-6).toUpperCase()}-${String(requestId).slice(-6).toUpperCase()}-${rand}`;
}
