import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

type Ctx = RouteContext<"/api/sessions/[sessionId]">;

const PatchSessionSchema = z.object({
  status: z.enum(["COMPLETED", "ABANDONED"], {
    message: "status must be COMPLETED or ABANDONED",
  }),
});

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PatchSessionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { status } = parsed.data;

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
