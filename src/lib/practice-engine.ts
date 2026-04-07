const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;
const STREAK_THRESHOLD = 3; // consecutive correct/incorrect to trigger adjustment

// Spaced repetition constants
const MASTERY_REVIEW_THRESHOLD = 70; // below this score, topic needs review
const DECAY_HALF_LIFE_DAYS = 7; // mastery halves every 7 days without practice

/**
 * Adjusts difficulty based on the current streak of correct/incorrect answers.
 * Positive streak = consecutive correct, negative = consecutive incorrect.
 */
export function adjustDifficulty(
  currentDifficulty: number,
  streak: number
): number {
  if (streak >= STREAK_THRESHOLD) {
    return Math.min(currentDifficulty + 1, MAX_DIFFICULTY);
  }
  if (streak <= -STREAK_THRESHOLD) {
    return Math.max(currentDifficulty - 1, MIN_DIFFICULTY);
  }
  return currentDifficulty;
}

/**
 * Updates the streak counter after an answer.
 * Resets to ±1 on direction change, otherwise increments.
 */
export function updateStreak(currentStreak: number, isCorrect: boolean): number {
  if (isCorrect) {
    return currentStreak > 0 ? currentStreak + 1 : 1;
  }
  return currentStreak < 0 ? currentStreak - 1 : -1;
}

/**
 * Calculates a mastery score (0-100) for a subtopic using recent accuracy and time decay.
 * A score below MASTERY_REVIEW_THRESHOLD means the topic needs review.
 *
 * @param recentAccuracy - average accuracy (0-100) over last few completed sessions
 * @param daysSinceLastPractice - days elapsed since the most recent completed session
 */
export function calculateMasteryScore(
  recentAccuracy: number,
  daysSinceLastPractice: number
): number {
  const decayFactor = Math.pow(0.5, daysSinceLastPractice / DECAY_HALF_LIFE_DAYS);
  return Math.round(recentAccuracy * decayFactor);
}

/**
 * Returns true if a subtopic needs review based on its mastery score.
 */
export function needsReview(masteryScore: number): boolean {
  return masteryScore < MASTERY_REVIEW_THRESHOLD;
}
