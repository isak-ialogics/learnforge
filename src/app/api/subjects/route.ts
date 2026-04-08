import { prisma } from "@/lib/prisma";

// GET /api/subjects — List all subjects with their topics and subtopics
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        topics: {
          include: {
            subtopics: {
              include: {
                _count: { select: { questions: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return Response.json(subjects);
  } catch (error) {
    console.error("[/api/subjects] Database error:", error);
    return Response.json(
      { error: "Failed to load subjects. Please try again later." },
      { status: 500 }
    );
  }
}
