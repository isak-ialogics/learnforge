try { require("dotenv/config"); } catch {}
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const QuestionType = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE" as const,
  TRUE_FALSE: "TRUE_FALSE" as const,
  SHORT_ANSWER: "SHORT_ANSWER" as const,
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type QuestionSeed = {
  content: string;
  type: (typeof QuestionType)[keyof typeof QuestionType];
  difficulty: number;
  options: { label: string; text: string }[];
  answer: string;
  explanation?: string;
  subtopicId: string;
  metadata?: object;
};

/** Idempotent upsert for a question: match on (subtopicId, content).
 *  Returns { wasCreated: true } for a new row, false for an existing one. */
async function upsertQuestion(q: QuestionSeed): Promise<{ wasCreated: boolean }> {
  const existing = await prisma.question.findFirst({
    where: { subtopicId: q.subtopicId, content: q.content },
    select: { id: true },
  });
  if (existing) return { wasCreated: false };
  await prisma.question.create({ data: q });
  return { wasCreated: true };
}

async function main() {
  // --- Demo user ---
  const demoEmail = "demo@learnforge.dev";
  const existingDemo = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existingDemo) {
    const hashedPassword = await bcrypt.hash("demo1234", 12);
    await prisma.user.create({
      data: { name: "Demo User", email: demoEmail, hashedPassword },
    });
    console.log(`Demo user created: ${demoEmail} / demo1234`);
  } else {
    console.log(`Demo user already exists: ${demoEmail}`);
  }

  // --- Mathematics ---
  const maths = await prisma.subject.upsert({
    where: { name: "Mathematics" },
    update: {},
    create: { name: "Mathematics" },
  });

  const algebra = await prisma.topic.upsert({
    where: { subjectId_name: { subjectId: maths.id, name: "Algebra" } },
    update: {},
    create: { name: "Algebra", subjectId: maths.id },
  });

  const quadratics = await prisma.subtopic.upsert({
    where: { topicId_name: { topicId: algebra.id, name: "Quadratic Equations" } },
    update: {},
    create: { name: "Quadratic Equations", topicId: algebra.id },
  });

  const exponents = await prisma.subtopic.upsert({
    where: { topicId_name: { topicId: algebra.id, name: "Exponents and Surds" } },
    update: {},
    create: { name: "Exponents and Surds", topicId: algebra.id },
  });

  const calculus = await prisma.topic.upsert({
    where: { subjectId_name: { subjectId: maths.id, name: "Calculus" } },
    update: {},
    create: { name: "Calculus", subjectId: maths.id },
  });

  const derivatives = await prisma.subtopic.upsert({
    where: { topicId_name: { topicId: calculus.id, name: "Derivatives" } },
    update: {},
    create: { name: "Derivatives", topicId: calculus.id },
  });

  // --- Physical Science ---
  const science = await prisma.subject.upsert({
    where: { name: "Physical Science" },
    update: {},
    create: { name: "Physical Science" },
  });

  const mechanics = await prisma.topic.upsert({
    where: { subjectId_name: { subjectId: science.id, name: "Mechanics" } },
    update: {},
    create: { name: "Mechanics", subjectId: science.id },
  });

  const newtonLaws = await prisma.subtopic.upsert({
    where: { topicId_name: { topicId: mechanics.id, name: "Newton's Laws" } },
    update: {},
    create: { name: "Newton's Laws", topicId: mechanics.id },
  });

  const chemistry = await prisma.topic.upsert({
    where: { subjectId_name: { subjectId: science.id, name: "Chemistry" } },
    update: {},
    create: { name: "Chemistry", subjectId: science.id },
  });

  const stoichiometry = await prisma.subtopic.upsert({
    where: { topicId_name: { topicId: chemistry.id, name: "Stoichiometry" } },
    update: {},
    create: { name: "Stoichiometry", topicId: chemistry.id },
  });

  // --- Questions ---
  const questions: QuestionSeed[] = [
    // =========================================================
    // Mathematics – Quadratic Equations (10 questions, diff 1-5)
    // =========================================================
    {
      content: "The roots of a quadratic equation are real and equal when the discriminant is zero.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "A",
      explanation: "When Δ = 0, there is exactly one repeated real root.",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "A quadratic equation always has exactly two distinct real roots.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "B",
      explanation: "A quadratic can have two distinct, two equal, or no real roots depending on the discriminant.",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Solve for x: x² - 5x + 6 = 0",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 2,
      options: [
        { label: "A", text: "x = 2 or x = 3" },
        { label: "B", text: "x = -2 or x = -3" },
        { label: "C", text: "x = 1 or x = 6" },
        { label: "D", text: "x = -1 or x = -6" },
      ],
      answer: "A",
      explanation: "Factor: (x - 2)(x - 3) = 0, so x = 2 or x = 3.",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Which of the following is the correct quadratic formula?",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 2,
      options: [
        { label: "A", text: "x = (-b ± √(b²-4ac)) / 2a" },
        { label: "B", text: "x = (-b ± √(b²+4ac)) / 2a" },
        { label: "C", text: "x = (b ± √(b²-4ac)) / 2a" },
        { label: "D", text: "x = (-b ± √(b²-4ac)) / a" },
      ],
      answer: "A",
      explanation: "The quadratic formula is x = (-b ± √(b²-4ac)) / 2a, derived from completing the square.",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "What is the discriminant of 2x² + 3x - 5 = 0?",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 3,
      options: [
        { label: "A", text: "49" },
        { label: "B", text: "-31" },
        { label: "C", text: "29" },
        { label: "D", text: "-49" },
      ],
      answer: "A",
      explanation: "Δ = b² - 4ac = 9 - 4(2)(-5) = 9 + 40 = 49.",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "For what value of k does x² + kx + 9 = 0 have equal roots?",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 3,
      options: [
        { label: "A", text: "±6" },
        { label: "B", text: "±3" },
        { label: "C", text: "±9" },
        { label: "D", text: "±4" },
      ],
      answer: "A",
      explanation: "Equal roots when Δ = 0: k² - 4(1)(9) = 0 → k² = 36 → k = ±6.",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "State the nature of the roots of x² + x + 1 = 0.",
      type: QuestionType.SHORT_ANSWER,
      difficulty: 3,
      options: [],
      answer: "non-real",
      explanation: "Δ = 1 - 4 = -3 < 0, so the roots are non-real (complex conjugates).",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Solve for x: 2x² - 7x + 3 = 0 (give both roots).",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 4,
      options: [
        { label: "A", text: "x = 3 or x = ½" },
        { label: "B", text: "x = -3 or x = -½" },
        { label: "C", text: "x = 1 or x = 3/2" },
        { label: "D", text: "x = 7 or x = -1" },
      ],
      answer: "A",
      explanation: "Factor: (2x - 1)(x - 3) = 0 → x = ½ or x = 3.",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "A ball is thrown upward with height h = -5t² + 20t + 1 (metres, t in seconds). At what time does it reach its maximum height?",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 4,
      options: [
        { label: "A", text: "t = 2 s" },
        { label: "B", text: "t = 4 s" },
        { label: "C", text: "t = 1 s" },
        { label: "D", text: "t = 5 s" },
      ],
      answer: "A",
      explanation: "The vertex is at t = -b/2a = -20/(2×-5) = 2 s.",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "If α and β are roots of 3x² - 6x + 2 = 0, find the value of α² + β².",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 5,
      options: [
        { label: "A", text: "8/3" },
        { label: "B", text: "4" },
        { label: "C", text: "10/3" },
        { label: "D", text: "32/9" },
      ],
      answer: "A",
      explanation: "By Vieta's: α+β = 6/3 = 2, αβ = 2/3. α²+β² = (α+β)² - 2αβ = 4 - 4/3 = 8/3.",
      subtopicId: quadratics.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },

    // =========================================================
    // Mathematics – Exponents and Surds (10 questions, diff 1-5)
    // =========================================================
    {
      content: "Any non-zero number raised to the power of zero equals 1.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "A",
      explanation: "a⁰ = 1 for any a ≠ 0.",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 10 },
    },
    {
      content: "√16 = 8",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "B",
      explanation: "√16 = 4, not 8.",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 10 },
    },
    {
      content: "Simplify: √50 - √18",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 2,
      options: [
        { label: "A", text: "2√2" },
        { label: "B", text: "√32" },
        { label: "C", text: "4√2" },
        { label: "D", text: "2√8" },
      ],
      answer: "A",
      explanation: "√50 = 5√2, √18 = 3√2, so 5√2 - 3√2 = 2√2.",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Evaluate: 8^(2/3)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 2,
      options: [
        { label: "A", text: "4" },
        { label: "B", text: "2" },
        { label: "C", text: "16" },
        { label: "D", text: "6" },
      ],
      answer: "A",
      explanation: "8^(2/3) = (∛8)² = 2² = 4.",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Simplify: (2³)² × 2⁻⁴",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 3,
      options: [
        { label: "A", text: "4" },
        { label: "B", text: "8" },
        { label: "C", text: "2" },
        { label: "D", text: "16" },
      ],
      answer: "A",
      explanation: "(2³)² = 2⁶, then 2⁶ × 2⁻⁴ = 2² = 4.",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Rationalise the denominator: 3 / (1 + √2)",
      type: QuestionType.SHORT_ANSWER,
      difficulty: 3,
      options: [],
      answer: "3(√2 - 1)",
      explanation: "Multiply numerator and denominator by (1 - √2): 3(1-√2)/((1)²-(√2)²) = 3(1-√2)/(1-2) = -3(1-√2) = 3(√2-1).",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Simplify: (√3 + √5)²",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 3,
      options: [
        { label: "A", text: "8 + 2√15" },
        { label: "B", text: "8" },
        { label: "C", text: "2√15" },
        { label: "D", text: "√8 + √10" },
      ],
      answer: "A",
      explanation: "(√3)² + 2·√3·√5 + (√5)² = 3 + 2√15 + 5 = 8 + 2√15.",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Solve for x: 2^(x+1) = 32",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 4,
      options: [
        { label: "A", text: "x = 4" },
        { label: "B", text: "x = 5" },
        { label: "C", text: "x = 3" },
        { label: "D", text: "x = 6" },
      ],
      answer: "A",
      explanation: "32 = 2⁵, so 2^(x+1) = 2⁵ → x+1 = 5 → x = 4.",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Simplify: (a²b⁻³)² ÷ (a⁻¹b²)³",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 4,
      options: [
        { label: "A", text: "a⁷b⁻¹²" },
        { label: "B", text: "a⁵b⁻¹²" },
        { label: "C", text: "a⁷b⁻⁶" },
        { label: "D", text: "a⁵b⁶" },
      ],
      answer: "A",
      explanation: "Numerator: a⁴b⁻⁶. Denominator: a⁻³b⁶. Division: a^(4-(-3)) × b^(-6-6) = a⁷b⁻¹².",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Solve for x: 9^x - 4·3^x + 3 = 0. (Hint: let k = 3^x)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 5,
      options: [
        { label: "A", text: "x = 0 or x = 1" },
        { label: "B", text: "x = 1 or x = 3" },
        { label: "C", text: "x = 0 or x = 2" },
        { label: "D", text: "x = -1 or x = 0" },
      ],
      answer: "A",
      explanation: "Let k = 3^x. Then k² - 4k + 3 = 0 → (k-1)(k-3) = 0 → k=1 or k=3 → 3^x=1 (x=0) or 3^x=3 (x=1).",
      subtopicId: exponents.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },

    // =========================================================
    // Mathematics – Derivatives (10 questions, diff 1-5)
    // =========================================================
    {
      content: "The derivative of a constant is always zero.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "A",
      explanation: "Constants have no rate of change, so their derivative is 0.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "The power rule states that d/dx [xⁿ] = nxⁿ⁻¹.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "A",
      explanation: "The power rule is a fundamental differentiation rule.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "Find f'(x) if f(x) = 3x² - 4x + 1",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 2,
      options: [
        { label: "A", text: "6x - 4" },
        { label: "B", text: "3x - 4" },
        { label: "C", text: "6x² - 4" },
        { label: "D", text: "6x + 4" },
      ],
      answer: "A",
      explanation: "Using power rule: f'(x) = 2·3x - 4 = 6x - 4.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "Differentiate: y = 5x³ - 2x + 7",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 2,
      options: [
        { label: "A", text: "15x² - 2" },
        { label: "B", text: "5x² - 2" },
        { label: "C", text: "15x² + 7" },
        { label: "D", text: "15x³ - 2" },
      ],
      answer: "A",
      explanation: "dy/dx = 3·5x² - 2 + 0 = 15x² - 2.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "Find the gradient of the tangent to y = x³ at x = 2.",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 4,
      options: [
        { label: "A", text: "12" },
        { label: "B", text: "8" },
        { label: "C", text: "6" },
        { label: "D", text: "3" },
      ],
      answer: "A",
      explanation: "y' = 3x². At x = 2: y' = 3(4) = 12.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "At a stationary point, the derivative of the function equals zero.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 2,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "A",
      explanation: "Stationary points occur where f'(x) = 0.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "Differentiate using the chain rule: y = (3x + 1)⁴",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 3,
      options: [
        { label: "A", text: "12(3x + 1)³" },
        { label: "B", text: "4(3x + 1)³" },
        { label: "C", text: "12(3x + 1)⁴" },
        { label: "D", text: "3(3x + 1)³" },
      ],
      answer: "A",
      explanation: "dy/dx = 4(3x+1)³ · 3 = 12(3x+1)³.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "State the x-value(s) where f(x) = x³ - 3x has a local minimum.",
      type: QuestionType.SHORT_ANSWER,
      difficulty: 3,
      options: [],
      answer: "x = 1",
      explanation: "f'(x) = 3x² - 3 = 0 → x = ±1. f''(1) = 6 > 0, so x = 1 is a local minimum.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "A cubic f(x) = x³ - 6x² + 9x - 4. Find the x-coordinates of all stationary points.",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 4,
      options: [
        { label: "A", text: "x = 1 and x = 3" },
        { label: "B", text: "x = 2 and x = 3" },
        { label: "C", text: "x = 0 and x = 3" },
        { label: "D", text: "x = 1 and x = 4" },
      ],
      answer: "A",
      explanation: "f'(x) = 3x² - 12x + 9 = 3(x² - 4x + 3) = 3(x-1)(x-3) = 0 → x = 1 or x = 3.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "Determine the equation of the tangent to f(x) = x² - 3x at x = 4.",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 5,
      options: [
        { label: "A", text: "y = 5x - 16" },
        { label: "B", text: "y = 5x - 4" },
        { label: "C", text: "y = 8x - 16" },
        { label: "D", text: "y = 5x + 16" },
      ],
      answer: "A",
      explanation: "f(4) = 16-12 = 4. f'(x) = 2x-3, f'(4) = 5. Tangent: y - 4 = 5(x - 4) → y = 5x - 16.",
      subtopicId: derivatives.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },

    // =========================================================
    // Physical Science – Newton's Laws (10 questions, diff 1-5)
    // =========================================================
    {
      content: "Newton's Third Law states that for every action there is an equal and opposite reaction.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "A",
      explanation: "This is the definition of Newton's Third Law of Motion.",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "An object at rest remains at rest unless acted upon by a net external force.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "A",
      explanation: "This is Newton's First Law (Law of Inertia).",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "A 5 kg object accelerates at 3 m/s². What is the net force acting on it?",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 2,
      options: [
        { label: "A", text: "15 N" },
        { label: "B", text: "8 N" },
        { label: "C", text: "1.67 N" },
        { label: "D", text: "0.6 N" },
      ],
      answer: "A",
      explanation: "F = ma = 5 × 3 = 15 N.",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Which quantity describes an object's resistance to changes in its motion?",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 2,
      options: [
        { label: "A", text: "Inertia" },
        { label: "B", text: "Momentum" },
        { label: "C", text: "Velocity" },
        { label: "D", text: "Acceleration" },
      ],
      answer: "A",
      explanation: "Inertia is the tendency of an object to resist changes in its state of motion, described by Newton's First Law.",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "A net force of 24 N acts on a 6 kg object. What is its acceleration?",
      type: QuestionType.SHORT_ANSWER,
      difficulty: 2,
      options: [],
      answer: "4 m/s²",
      explanation: "a = F/m = 24/6 = 4 m/s².",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "A 10 kg block is pushed with 50 N of force across a surface with friction coefficient μ = 0.3. What is the acceleration? (g = 9.8 m/s²)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 4,
      options: [
        { label: "A", text: "2.06 m/s²" },
        { label: "B", text: "5.00 m/s²" },
        { label: "C", text: "2.94 m/s²" },
        { label: "D", text: "3.50 m/s²" },
      ],
      answer: "A",
      explanation: "Friction = μmg = 0.3 × 10 × 9.8 = 29.4 N. Net force = 50 - 29.4 = 20.6 N. a = F/m = 20.6/10 = 2.06 m/s².",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "Two objects A (3 kg) and B (5 kg) are connected by a string over a frictionless pulley. What is the acceleration of the system? (g = 10 m/s²)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 3,
      options: [
        { label: "A", text: "2.5 m/s²" },
        { label: "B", text: "5.0 m/s²" },
        { label: "C", text: "1.25 m/s²" },
        { label: "D", text: "3.75 m/s²" },
      ],
      answer: "A",
      explanation: "Net force = (5-3)×10 = 20 N. Total mass = 8 kg. a = 20/8 = 2.5 m/s².",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "If a rocket expels gas downward with a force of 50 000 N, what is the upward thrust on the rocket?",
      type: QuestionType.SHORT_ANSWER,
      difficulty: 3,
      options: [],
      answer: "50 000 N",
      explanation: "Newton's Third Law: the reaction force equals 50 000 N upward.",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "An elevator of mass 800 kg moves upward at constant velocity. What is the tension in the cable? (g = 9.8 m/s²)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 4,
      options: [
        { label: "A", text: "7840 N" },
        { label: "B", text: "8000 N" },
        { label: "C", text: "9800 N" },
        { label: "D", text: "0 N" },
      ],
      answer: "A",
      explanation: "Constant velocity means net force = 0. T = mg = 800 × 9.8 = 7840 N.",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "A person of mass 60 kg stands on a scale inside an elevator accelerating downward at 2 m/s². What does the scale read? (g = 9.8 m/s²)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 5,
      options: [
        { label: "A", text: "468 N" },
        { label: "B", text: "588 N" },
        { label: "C", text: "708 N" },
        { label: "D", text: "120 N" },
      ],
      answer: "A",
      explanation: "N = m(g - a) = 60(9.8 - 2) = 60 × 7.8 = 468 N.",
      subtopicId: newtonLaws.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },

    // =========================================================
    // Physical Science – Stoichiometry (10 questions, diff 1-5)
    // =========================================================
    {
      content: "The molar mass of water (H₂O) is 18 g/mol.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "A",
      explanation: "H: 2×1 = 2, O: 16. Total = 18 g/mol.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "One mole of any substance contains 6.02 × 10²³ particles.",
      type: QuestionType.TRUE_FALSE,
      difficulty: 1,
      options: [
        { label: "A", text: "True" },
        { label: "B", text: "False" },
      ],
      answer: "A",
      explanation: "Avogadro's number (Nₐ = 6.02 × 10²³) is the number of entities per mole.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "How many moles are in 44 g of CO₂? (Molar mass of CO₂ = 44 g/mol)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 2,
      options: [
        { label: "A", text: "1 mol" },
        { label: "B", text: "2 mol" },
        { label: "C", text: "0.5 mol" },
        { label: "D", text: "44 mol" },
      ],
      answer: "A",
      explanation: "n = m/M = 44/44 = 1 mol.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "Calculate the mass of 0.5 mol of NaCl. (Molar mass of NaCl = 58.5 g/mol)",
      type: QuestionType.SHORT_ANSWER,
      difficulty: 2,
      options: [],
      answer: "29.25 g",
      explanation: "m = n × M = 0.5 × 58.5 = 29.25 g.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "In the reaction 2H₂ + O₂ → 2H₂O, how many moles of water are produced from 4 moles of H₂?",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 3,
      options: [
        { label: "A", text: "4 mol" },
        { label: "B", text: "2 mol" },
        { label: "C", text: "8 mol" },
        { label: "D", text: "1 mol" },
      ],
      answer: "A",
      explanation: "Mole ratio H₂:H₂O = 2:2 = 1:1, so 4 mol H₂ produces 4 mol H₂O.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "What volume does 2 moles of an ideal gas occupy at STP (0°C, 101.3 kPa)?",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 3,
      options: [
        { label: "A", text: "44.8 dm³" },
        { label: "B", text: "22.4 dm³" },
        { label: "C", text: "11.2 dm³" },
        { label: "D", text: "89.6 dm³" },
      ],
      answer: "A",
      explanation: "At STP, 1 mol of ideal gas = 22.4 dm³. So 2 mol = 44.8 dm³.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "What mass of CO₂ is produced when 12 g of carbon (C) is completely combusted? (C + O₂ → CO₂; Molar masses: C = 12, O = 16)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 3,
      options: [
        { label: "A", text: "44 g" },
        { label: "B", text: "28 g" },
        { label: "C", text: "12 g" },
        { label: "D", text: "32 g" },
      ],
      answer: "A",
      explanation: "12 g C = 1 mol C → 1 mol CO₂. Mass of CO₂ = 1 × 44 = 44 g.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "How many molecules are in 0.25 mol of O₂? (Nₐ = 6.02 × 10²³)",
      type: QuestionType.SHORT_ANSWER,
      difficulty: 3,
      options: [],
      answer: "1.505 × 10²³",
      explanation: "N = n × Nₐ = 0.25 × 6.02 × 10²³ = 1.505 × 10²³ molecules.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 11 },
    },
    {
      content: "In the reaction N₂ + 3H₂ → 2NH₃, how many grams of NH₃ are produced from 14 g of N₂? (Molar masses: N₂ = 28, NH₃ = 17)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 4,
      options: [
        { label: "A", text: "17 g" },
        { label: "B", text: "34 g" },
        { label: "C", text: "8.5 g" },
        { label: "D", text: "28 g" },
      ],
      answer: "A",
      explanation: "14 g N₂ = 0.5 mol N₂. Ratio N₂:NH₃ = 1:2, so 1 mol NH₃ produced. Mass = 1 × 17 = 17 g.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
    {
      content: "25 cm³ of 0.4 mol/dm³ HCl reacts with excess NaOH. How many moles of NaCl are formed? (HCl + NaOH → NaCl + H₂O)",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: 5,
      options: [
        { label: "A", text: "0.01 mol" },
        { label: "B", text: "0.4 mol" },
        { label: "C", text: "0.025 mol" },
        { label: "D", text: "0.04 mol" },
      ],
      answer: "A",
      explanation: "n(HCl) = c × V = 0.4 × 0.025 = 0.01 mol. 1:1 ratio → n(NaCl) = 0.01 mol.",
      subtopicId: stoichiometry.id,
      metadata: { curriculum: "CAPS", grade: 12 },
    },
  ];

  let created = 0;
  let skipped = 0;
  for (const q of questions) {
    const { wasCreated } = await upsertQuestion(q);
    if (wasCreated) {
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`Seed complete: ${created} questions created, ${skipped} already existed.`);
  console.log(`Total seed questions: ${questions.length} across 5 subtopics (2 subjects).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
