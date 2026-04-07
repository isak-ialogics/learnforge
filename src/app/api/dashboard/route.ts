import { prisma } from "@/lib/prisma";

// GET /api/dashboard — Aggregated learner stats across all sessions
export async function GET() {
  const sessions = await prisma.practiceSession.findMany({
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

  return Response.json({
    overall: { totalSessions, totalQuestions, totalCorrect, accuracy },
    sessions: sessionList,
    subtopicStats,
  });
}
