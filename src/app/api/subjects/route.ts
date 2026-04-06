import { prisma } from "@/lib/prisma";

// GET /api/subjects — List all subjects with their topics and subtopics
export async function GET() {
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
}
