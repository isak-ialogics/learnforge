import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { NextRequest } from "next/server";

const CreateSessionSchema = z.object({
  subtopicId: z.string().min(1, "subtopicId is required"),
});

// POST /api/sessions — Start a new practice session for a subtopic
export async function POST(request: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    return e as Response;
  }

  const limited = checkRateLimit(`sessions:create:${userId}`, 20, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { subtopicId } = parsed.data;

  const subtopic = await prisma.subtopic.findUnique({
    where: { id: subtopicId },
  });

  if (!subtopic) {
    return Response.json({ error: "Subtopic not found" }, { status: 404 });
  }

  const session = await prisma.practiceSession.create({
    data: {
      userId,
      subtopicId,
      currentDifficulty: 3,
    },
    include: {
      subtopic: {
        include: { topic: { include: { subject: true } } },
      },
    },
  });

  return Response.json(session, { status: 201 });
}

const SessionQuerySchema = z.object({
  subtopicId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ABANDONED"]).optional(),
});

// GET /api/sessions — List sessions for the authenticated user
export async function GET(request: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = request.nextUrl;
  const parsed = SessionQuerySchema.safeParse({
    subtopicId: searchParams.get("subtopicId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { subtopicId, status } = parsed.data;

  const where: Record<string, string> = { userId };
  if (subtopicId) where.subtopicId = subtopicId;
  if (status) where.status = status;

  const sessions = await prisma.practiceSession.findMany({
    where,
    include: {
      subtopic: {
        include: { topic: { include: { subject: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(sessions);
}
