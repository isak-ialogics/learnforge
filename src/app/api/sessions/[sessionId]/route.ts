import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import type { NextRequest } from "next/server";

type Ctx = RouteContext<"/api/sessions/[sessionId]">;

// GET /api/sessions/:sessionId — Get session details
export async function GET(req: NextRequest, ctx: Ctx) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    return e as Response;
  }

  const { sessionId } = await ctx.params;

  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId, userId },
    include: {
      subtopic: {
        include: { topic: { include: { subject: true } } },
      },
      answers: {
        include: { question: true },
        orderBy: { answeredAt: "asc" },
      },
    },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json(session);
}

// PATCH /api/sessions/:sessionId — Complete or abandon a session
export async function PATCH(req: NextRequest, ctx: Ctx) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    return e as Response;
  }

  const { sessionId } = await ctx.params;
  const body = await req.json();
  const { status } = body;

  if (!status || !["COMPLETED", "ABANDONED"].includes(status)) {
    return Response.json(
      { error: "status must be COMPLETED or ABANDONED" },
      { status: 400 }
    );
  }

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

  const updated = await prisma.practiceSession.update({
    where: { id: sessionId },
    data: {
      status,
      completedAt: new Date(),
    },
    include: {
      subtopic: true,
      answers: { include: { question: true } },
    },
  });

  return Response.json(updated);
}
