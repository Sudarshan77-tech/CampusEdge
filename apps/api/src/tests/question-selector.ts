/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 * Produces consistent pseudo-random sequences for a given integer seed.
 */
export function createPrng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic Fisher-Yates shuffle using provided PRNG.
 */
export function deterministicShuffle<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

export interface CandidateQuestion {
  id: string;
  topicId: string;
  subtopicId?: string | null;
  difficulty: number;
  expectedTimeSeconds: number;
}

export interface SectionRuleInput {
  topicId: string;
  subtopicId?: string | null;
  count: number;
  difficultyMin: number;
  difficultyMax: number;
}

/**
 * Selects questions for a section rule enforcing:
 * 1. Topic & Subtopic match
 * 2. Difficulty in [difficultyMin, difficultyMax]
 * 3. 30-day anti-repeat pool avoidance per student:
 *    Questions attempted in the last 30 days are deprioritized.
 * 4. Deterministic pseudo-random selection seeded by student attempt seed.
 */
export function selectQuestionsForRule(
  rule: SectionRuleInput,
  candidatePool: CandidateQuestion[],
  recentQuestionIds: Set<string>,
  prng: () => number,
): CandidateQuestion[] {
  // Filter matching candidates
  const matching = candidatePool.filter((q) => {
    if (q.topicId !== rule.topicId) return false;
    if (rule.subtopicId && q.subtopicId !== rule.subtopicId) return false;
    if (q.difficulty < rule.difficultyMin || q.difficulty > rule.difficultyMax) return false;
    return true;
  });

  if (matching.length === 0) {
    return [];
  }

  // Partition into fresh (unattempted in last 30d) vs recent (attempted in last 30d)
  const fresh = matching.filter((q) => !recentQuestionIds.has(q.id));
  const recent = matching.filter((q) => recentQuestionIds.has(q.id));

  const shuffledFresh = deterministicShuffle(fresh, prng);
  const shuffledRecent = deterministicShuffle(recent, prng);

  // Take from fresh first, then fallback to recent if fresh is insufficient
  const selected: CandidateQuestion[] = [];
  for (const q of shuffledFresh) {
    if (selected.length >= rule.count) break;
    selected.push(q);
  }

  if (selected.length < rule.count) {
    for (const q of shuffledRecent) {
      if (selected.length >= rule.count) break;
      selected.push(q);
    }
  }

  return selected;
}

/**
 * Computes a permutation of option indices [0, 1, ..., N-1] deterministically
 * using attemptSeed and question position.
 */
export function generateOptionOrder(
  optionCount: number,
  attemptSeed: number,
  position: number,
): number[] {
  const seed = (attemptSeed + position * 31) >>> 0;
  const prng = createPrng(seed);
  const indices = Array.from({ length: optionCount }, (_, i) => i);
  return deterministicShuffle(indices, prng);
}
