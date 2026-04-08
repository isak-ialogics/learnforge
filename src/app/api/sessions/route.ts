import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { NextRequest } from "next/server";

// POST /api/sessions — Start a new practice session for a subtopic
export async function POST(request: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    return e as Response;
  }

  const body = await request.json();
  const { subtopicId } = body;

  if (!subtopicId) {
    return Response.json({ error: "subtopicId is required" }, { status: 400 });
  }

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

// GET /api/sessions — List sessions for the authenticated user
export async function GET(request: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = request.nextUrl;
  const subtopicId = searchParams.get("subtopicId");
  const status = searchParams.get("status");

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
