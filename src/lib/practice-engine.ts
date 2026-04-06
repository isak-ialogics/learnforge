const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;
const STREAK_THRESHOLD = 3; // consecutive correct/incorrect to trigger adjustment

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
