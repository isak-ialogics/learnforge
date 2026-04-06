import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

type Ctx = RouteContext<"/api/sessions/[sessionId]/next">;

// GET /api/sessions/:sessionId/next — Get the next question for this session
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { sessionId } = await ctx.params;

  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: { select: { questionId: true } },
    },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "ACTIVE") {
    return Response.json(
      { error: "Session is not active" },
      { status: 400 }
    );
  }

  // Find questions the user hasn't answered yet, near the current difficulty
  const answeredIds = session.answers.map((a) => a.questionId);

  const question = await prisma.question.findFirst({
    where: {
      subtopicId: session.subtopicId,
      id: { notIn: answeredIds.length > 0 ? answeredIds : undefined },
      difficulty: {
        gte: Math.max(1, session.currentDifficulty - 1),
        lte: Math.min(5, session.currentDifficulty + 1),
      },
    },
    orderBy: [
      // Prefer questions closest to current difficulty
      { difficulty: "asc" },
    ],
  });

  if (!question) {
    // No more questions available — try any unanswered question in this subtopic
    const fallback = await prisma.question.findFirst({
      where: {
        subtopicId: session.subtopicId,
        id: { notIn: answeredIds.length > 0 ? answeredIds : undefined },
      },
    });

    if (!fallback) {
      return Response.json(
        { done: true, message: "No more questions available for this subtopic" },
        { status: 200 }
      );
    }

    return Response.json({
      done: false,
      question: {
        id: fallback.id,
        content: fallback.content,
        type: fallback.type,
        difficulty: fallback.difficulty,
        options: fallback.options,
      },
      sessionDifficulty: session.currentDifficulty,
    });
  }

  return Response.json({
    done: false,
    question: {
      id: question.id,
      content: question.content,
      type: question.type,
      difficulty: question.difficulty,
      options: question.options,
    },
    sessionDifficulty: session.currentDifficulty,
  });
}
