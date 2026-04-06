import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// POST /api/sessions — Start a new practice session for a subtopic
export async function POST(request: NextRequest) {
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

// GET /api/sessions — List sessions (optionally filter by subtopic)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const subtopicId = searchParams.get("subtopicId");
  const status = searchParams.get("status");

  const where: Record<string, string> = {};
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
