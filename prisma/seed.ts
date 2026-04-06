import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const QuestionType = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE" as const,
  TRUE_FALSE: "TRUE_FALSE" as const,
  SHORT_ANSWER: "SHORT_ANSWER" as const,
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
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
  const questions = [
    // Mathematics - Quadratic Equations
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
    // Mathematics - Exponents and Surds
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
    // Mathematics - Derivatives
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
    // Physical Science - Newton's Laws
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
    // Physical Science - Stoichiometry
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
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log(`Seeded ${questions.length} questions across 2 subjects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
