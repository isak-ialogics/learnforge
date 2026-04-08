import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { calculateMasteryScore, needsReview } from "@/lib/practice-engine";

const RECENT_SESSION_COUNT = 3; // sessions to consider for recent accuracy
const MAX_RECOMMENDATIONS = 5;

// GET /api/dashboard — Aggregated learner stats for the authenticated user
export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    return e as Response;
  }

  const sessions = await prisma.practiceSession.findMany({
    where: { userId },
    include: {
      subtopic: {
        include: { topic: { include: { subject: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Overall stats
  const totalSessions = sessions.length;
  const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
  const accuracy =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  // Session list for history table
  const sessionList = sessions.map((s) => ({
    id: s.id,
    date: s.createdAt,
    completedAt: s.completedAt,
    subtopic: s.subtopic.name,
    topic: s.subtopic.topic.name,
    subject: s.subtopic.topic.subject.name,
    totalQuestions: s.totalQuestions,
    correctAnswers: s.correctAnswers,
    accuracy:
      s.totalQuestions > 0
        ? Math.round((s.correctAnswers / s.totalQuestions) * 100)
        : 0,
    difficultyReached: s.currentDifficulty,
    status: s.status,
  }));

  // Per-subtopic accuracy breakdown
  const subtopicMap = new Map<
    string,
    {
      subtopicId: string;
      subtopic: string;
      topic: string;
      subject: string;
      sessions: number;
      totalQuestions: number;
      totalCorrect: number;
    }
  >();

  for (const s of sessions) {
    const key = s.subtopicId;
    const existing = subtopicMap.get(key);
    if (existing) {
      existing.sessions += 1;
      existing.totalQuestions += s.totalQuestions;
      existing.totalCorrect += s.correctAnswers;
    } else {
      subtopicMap.set(key, {
        subtopicId: s.subtopicId,
        subtopic: s.subtopic.name,
        topic: s.subtopic.topic.name,
        subject: s.subtopic.topic.subject.name,
        sessions: 1,
        totalQuestions: s.totalQuestions,
        totalCorrect: s.correctAnswers,
      });
    }
  }

  const subtopicStats = Array.from(subtopicMap.values()).map((st) => ({
    ...st,
    accuracy:
      st.totalQuestions > 0
        ? Math.round((st.totalCorrect / st.totalQuestions) * 100)
        : 0,
  }));

  // Spaced repetition: compute recommendations
  const completedBySubtopic = new Map<
    string,
    { session: typeof sessions[number]; accuracy: number }[]
  >();

  for (const s of sessions) {
    if (s.status !== "COMPLETED" || s.totalQuestions === 0) continue;
    const arr = completedBySubtopic.get(s.subtopicId) ?? [];
    arr.push({
      session: s,
      accuracy: Math.round((s.correctAnswers / s.totalQuestions) * 100),
    });
    completedBySubtopic.set(s.subtopicId, arr);
  }

  const now = Date.now();
  const recommendations: {
    subtopicId: string;
    subtopic: string;
    topic: string;
    subject: string;
    masteryScore: number;
    lastPracticedAt: string;
    daysSinceLastPractice: number;
    recentAccuracy: number;
  }[] = [];

  for (const [subtopicId, completed] of completedBySubtopic) {
    const recent = completed.slice(0, RECENT_SESSION_COUNT);
    const recentAccuracy =
      recent.reduce((sum, r) => sum + r.accuracy, 0) / recent.length;

    const lastSession = completed[0].session;
    const lastPracticedAt = lastSession.completedAt ?? lastSession.updatedAt;
    const daysSince =
      (now - new Date(lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24);

    const masteryScore = calculateMasteryScore(recentAccuracy, daysSince);

    if (needsReview(masteryScore)) {
      recommendations.push({
        subtopicId,
        subtopic: lastSession.subtopic.name,
        topic: lastSession.subtopic.topic.name,
        subject: lastSession.subtopic.topic.subject.name,
        masteryScore,
        lastPracticedAt: lastPracticedAt.toISOString(),
        daysSinceLastPractice: Math.floor(daysSince),
        recentAccuracy: Math.round(recentAccuracy),
      });
    }
  }

  recommendations.sort((a, b) => a.masteryScore - b.masteryScore);

  return Response.json({
    overall: { totalSessions, totalQuestions, totalCorrect, accuracy },
    sessions: sessionList,
    subtopicStats,
    recommendations: recommendations.slice(0, MAX_RECOMMENDATIONS),
  });
}
