/**
 * Integration tests: practice session flow
 *
 * Coverage:
 *  1. Practice engine pure-function logic (no I/O)
 *  2. Session-flow orchestration — create → answer → complete — using
 *     in-memory mocks of the Prisma client and session auth so that the
 *     tests run without a real database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  adjustDifficulty,
  updateStreak,
  calculateMasteryScore,
  needsReview,
} from "@/lib/practice-engine";

// ---------------------------------------------------------------------------
// 1. Practice-engine unit tests (pure functions — no mocks needed)
// ---------------------------------------------------------------------------

describe("practice-engine: updateStreak", () => {
  it("increments positive streak on correct answer", () => {
    expect(updateStreak(2, true)).toBe(3);
  });
  it("resets to +1 when direction flips from negative to correct", () => {
    expect(updateStreak(-3, true)).toBe(1);
  });
  it("decrements negative streak on wrong answer", () => {
    expect(updateStreak(-2, false)).toBe(-3);
  });
  it("resets to -1 when direction flips from positive to wrong", () => {
    expect(updateStreak(3, false)).toBe(-1);
  });
});

describe("practice-engine: adjustDifficulty", () => {
  it("increases difficulty after streak of 3 correct", () => {
    expect(adjustDifficulty(3, 3)).toBe(4);
  });
  it("does not exceed max difficulty (5)", () => {
    expect(adjustDifficulty(5, 5)).toBe(5);
  });
  it("decreases difficulty after streak of -3 wrong", () => {
    expect(adjustDifficulty(3, -3)).toBe(2);
  });
  it("does not go below min difficulty (1)", () => {
    expect(adjustDifficulty(1, -5)).toBe(1);
  });
  it("holds difficulty when streak is within threshold", () => {
    expect(adjustDifficulty(3, 2)).toBe(3);
    expect(adjustDifficulty(3, -2)).toBe(3);
  });
});

describe("practice-engine: calculateMasteryScore", () => {
  it("returns full accuracy with no decay (0 days)", () => {
    expect(calculateMasteryScore(100, 0)).toBe(100);
  });
  it("halves score after 7 days (half-life)", () => {
    expect(calculateMasteryScore(100, 7)).toBe(50);
  });
  it("returns 0 for zero accuracy regardless of decay", () => {
    expect(calculateMasteryScore(0, 14)).toBe(0);
  });
});

describe("practice-engine: needsReview", () => {
  it("flags score below 70 for review", () => {
    expect(needsReview(69)).toBe(true);
  });
  it("does not flag score of 70 or above", () => {
    expect(needsReview(70)).toBe(false);
    expect(needsReview(100)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Session-flow integration test (mocked Prisma + auth)
// ---------------------------------------------------------------------------

// Mock the session auth module
vi.mock("@/lib/api-auth", () => ({
  requireUserId: vi.fn().mockResolvedValue("user-test-id"),
}));

// Mock the rate-limit module (always allow in tests)
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue(null),
  rateLimit: vi.fn().mockReturnValue(true),
}));

// Shared mutable state so each test step can set what Prisma returns
const mockPrisma = {
  subtopic: { findUnique: vi.fn() },
  practiceSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  question: { findUnique: vi.fn(), findFirst: vi.fn() },
  sessionAnswer: { findUnique: vi.fn(), create: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

describe("session flow: create → answer → complete", () => {
  const SUBTOPIC_ID = "550e8400-e29b-41d4-a716-446655440000";
  const SESSION_ID = "660e8400-e29b-41d4-a716-446655440001";
  const QUESTION_ID = "770e8400-e29b-41d4-a716-446655440002";
  const USER_ID = "user-test-id";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/sessions — creates a session for a valid subtopicId", async () => {
    mockPrisma.subtopic.findUnique.mockResolvedValue({
      id: SUBTOPIC_ID,
      name: "Quadratic Equations",
    });
    mockPrisma.practiceSession.create.mockResolvedValue({
      id: SESSION_ID,
      userId: USER_ID,
      subtopicId: SUBTOPIC_ID,
      currentDifficulty: 3,
      status: "ACTIVE",
      totalQuestions: 0,
      correctAnswers: 0,
      streak: 0,
    });

    const { POST } = await import("@/app/api/sessions/route");
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtopicId: SUBTOPIC_ID }),
    }) as unknown as import("next/server").NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(SESSION_ID);
    expect(body.status).toBe("ACTIVE");
    expect(mockPrisma.practiceSession.create).toHaveBeenCalledOnce();
  });

  it("POST /api/sessions — rejects non-UUID subtopicId with 400", async () => {
    const { POST } = await import("@/app/api/sessions/route");
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtopicId: "not-a-uuid" }),
    }) as unknown as import("next/server").NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/sessions/[sessionId]/answer — records correct answer and updates session", async () => {
    const activeSession = {
      id: SESSION_ID,
      userId: USER_ID,
      subtopicId: SUBTOPIC_ID,
      status: "ACTIVE",
      currentDifficulty: 3,
      streak: 2,
      totalQuestions: 2,
      correctAnswers: 2,
    };
    const question = {
      id: QUESTION_ID,
      content: "What is 2+2?",
      answer: "A",
      explanation: "Basic arithmetic.",
      difficulty: 3,
      options: [{ label: "A", text: "4" }],
    };

    mockPrisma.practiceSession.findUnique.mockResolvedValue(activeSession);
    mockPrisma.question.findUnique.mockResolvedValue(question);
    mockPrisma.sessionAnswer.findUnique.mockResolvedValue(null); // not yet answered

    const updatedSession = { ...activeSession, totalQuestions: 3, correctAnswers: 3, streak: 3 };
    mockPrisma.$transaction.mockResolvedValue([
      { id: "ans-1", sessionId: SESSION_ID, questionId: QUESTION_ID, isCorrect: true },
      updatedSession,
    ]);

    const { POST } = await import(
      "@/app/api/sessions/[sessionId]/answer/route"
    );
    const req = new Request(
      `http://localhost/api/sessions/${SESSION_ID}/answer`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: QUESTION_ID, answer: "A" }),
      }
    ) as unknown as import("next/server").NextRequest;
    const ctx = { params: Promise.resolve({ sessionId: SESSION_ID }) } as never;

    const res = await POST(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isCorrect).toBe(true);
    expect(body.correctAnswer).toBe("A");
    // streak was 2 correct, now 3 → triggers difficulty bump
    expect(body.difficultyChanged).toBe(true);
    expect(body.newDifficulty).toBe(4);
  });

  it("PATCH /api/sessions/[sessionId] — completes an active session", async () => {
    const activeSession = {
      id: SESSION_ID,
      userId: USER_ID,
      status: "ACTIVE",
      totalQuestions: 5,
      correctAnswers: 4,
    };
    const completedSession = { ...activeSession, status: "COMPLETED", completedAt: new Date() };

    mockPrisma.practiceSession.findUnique.mockResolvedValue(activeSession);
    mockPrisma.practiceSession.update.mockResolvedValue(completedSession);

    const { PATCH } = await import("@/app/api/sessions/[sessionId]/route");
    const req = new Request(`http://localhost/api/sessions/${SESSION_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    }) as unknown as import("next/server").NextRequest;
    const ctx = { params: Promise.resolve({ sessionId: SESSION_ID }) } as never;

    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("COMPLETED");
    expect(mockPrisma.practiceSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETED" }) })
    );
  });

  it("PATCH /api/sessions/[sessionId] — rejects invalid status with 400", async () => {
    const { PATCH } = await import("@/app/api/sessions/[sessionId]/route");
    const req = new Request(`http://localhost/api/sessions/${SESSION_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "INVALID" }),
    }) as unknown as import("next/server").NextRequest;
    const ctx = { params: Promise.resolve({ sessionId: SESSION_ID }) } as never;

    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
  });
});
