import { prisma } from "@/lib/prisma";
import { adjustDifficulty, updateStreak } from "@/lib/practice-engine";
import type { NextRequest } from "next/server";

type Ctx = RouteContext<"/api/sessions/[sessionId]/answer">;

// POST /api/sessions/:sessionId/answer — Submit an answer
export async function POST(req: NextRequest, ctx: Ctx) {
  const { sessionId } = await ctx.params;
  const body = await req.json();
  const { questionId, answer } = body;

  if (!questionId || answer === undefined) {
    return Response.json(
      { error: "questionId and answer are required" },
      { status: 400 }
    );
  }

  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
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

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return Response.json({ error: "Question not found" }, { status: 404 });
  }

  // Check if already answered
  const existing = await prisma.sessionAnswer.findUnique({
    where: { sessionId_questionId: { sessionId, questionId } },
  });

  if (existing) {
    return Response.json(
      { error: "Question already answered in this session" },
      { status: 409 }
    );
  }

  // Evaluate answer
  const isCorrect =
    answer.toString().trim().toUpperCase() ===
    question.answer.trim().toUpperCase();

  // Update streak and difficulty
  const newStreak = updateStreak(session.streak, isCorrect);
  const newDifficulty = adjustDifficulty(session.currentDifficulty, newStreak);
  // Reset streak to 0 after difficulty adjustment
  const resetStreak =
    newDifficulty !== session.currentDifficulty ? 0 : newStreak;

  // Save answer and update session in a transaction
  const [sessionAnswer, updatedSession] = await prisma.$transaction([
    prisma.sessionAnswer.create({
      data: {
        sessionId,
        questionId,
        givenAnswer: answer.toString(),
        isCorrect,
      },
    }),
    prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        totalQuestions: { increment: 1 },
        correctAnswers: isCorrect ? { increment: 1 } : undefined,
        streak: resetStreak,
        currentDifficulty: newDifficulty,
      },
    }),
  ]);

  return Response.json({
    isCorrect,
    correctAnswer: question.answer,
    explanation: question.explanation,
    streak: resetStreak,
    previousDifficulty: session.currentDifficulty,
    newDifficulty,
    difficultyChanged: newDifficulty !== session.currentDifficulty,
    session: {
      totalQuestions: updatedSession.totalQuestions,
      correctAnswers: updatedSession.correctAnswers,
    },
  });
}
