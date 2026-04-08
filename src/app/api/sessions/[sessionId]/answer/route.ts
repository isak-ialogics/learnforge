import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { adjustDifficulty, updateStreak } from "@/lib/practice-engine";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import type { NextRequest } from "next/server";

type Ctx = RouteContext<"/api/sessions/[sessionId]/answer">;

const AnswerSchema = z.object({
  questionId: z.string().uuid("questionId must be a valid UUID"),
  answer: z.string().min(1, "answer is required").max(500),
});

// POST /api/sessions/:sessionId/answer — Submit an answer
export async function POST(req: NextRequest, ctx: Ctx) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    return e as Response;
  }

  const limited = checkRateLimit(`sessions:answer:${userId}`, 120, 60_000);
  if (limited) return limited;

  const { sessionId } = await ctx.params;

  if (!z.string().uuid().safeParse(sessionId).success) {
    return Response.json({ error: "Invalid sessionId" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AnswerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { questionId, answer } = parsed.data;

  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId, userId },
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
    answer.trim().toUpperCase() === question.answer.trim().toUpperCase();

  // Update streak and difficulty
  const newStreak = updateStreak(session.streak, isCorrect);
  const newDifficulty = adjustDifficulty(session.currentDifficulty, newStreak);
  const resetStreak =
    newDifficulty !== session.currentDifficulty ? 0 : newStreak;

  const [, updatedSession] = await prisma.$transaction([
    prisma.sessionAnswer.create({
      data: {
        sessionId,
        questionId,
        givenAnswer: answer,
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
