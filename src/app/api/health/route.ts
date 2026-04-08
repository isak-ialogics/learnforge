import { prisma } from "@/lib/prisma";

// GET /api/health — Liveness + readiness check
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok", db: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch {
    return Response.json(
      { status: "error", db: "unreachable", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
