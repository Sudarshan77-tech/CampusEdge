import {
  createPrng,
  deterministicShuffle,
  selectQuestionsForRule,
  generateOptionOrder,
  CandidateQuestion,
  SectionRuleInput,
} from './question-selector';

describe('QuestionSelector', () => {
  it('PRNG produces identical deterministic sequence for same seed', () => {
    const prng1 = createPrng(12345);
    const prng2 = createPrng(12345);

    const seq1 = Array.from({ length: 10 }, () => prng1());
    const seq2 = Array.from({ length: 10 }, () => prng2());

    expect(seq1).toEqual(seq2);
  });

  it('deterministicShuffle produces stable permutations for same seed', () => {
    const items = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
    const shuffled1 = deterministicShuffle(items, createPrng(42));
    const shuffled2 = deterministicShuffle(items, createPrng(42));

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1.sort()).toEqual(items.sort());
  });

  it('selects fresh questions first and enforces anti-repeat avoidance', () => {
    const candidatePool: CandidateQuestion[] = [
      { id: 'q1', topicId: 'top-1', difficulty: 3, expectedTimeSeconds: 60 },
      { id: 'q2', topicId: 'top-1', difficulty: 3, expectedTimeSeconds: 60 },
      { id: 'q3', topicId: 'top-1', difficulty: 3, expectedTimeSeconds: 60 },
      { id: 'q4', topicId: 'top-1', difficulty: 3, expectedTimeSeconds: 60 },
      { id: 'q5', topicId: 'top-1', difficulty: 3, expectedTimeSeconds: 60 },
    ];

    const recentIds = new Set(['q1', 'q2']); // q1 and q2 attempted in last 30d
    const rule: SectionRuleInput = {
      topicId: 'top-1',
      count: 3,
      difficultyMin: 2,
      difficultyMax: 4,
    };

    const selected = selectQuestionsForRule(rule, candidatePool, recentIds, createPrng(999));

    expect(selected).toHaveLength(3);
    const selectedIds = selected.map((q) => q.id);

    // q3, q4, q5 are fresh, so they should be selected rather than q1 and q2
    expect(selectedIds).toContain('q3');
    expect(selectedIds).toContain('q4');
    expect(selectedIds).toContain('q5');
    expect(selectedIds).not.toContain('q1');
    expect(selectedIds).not.toContain('q2');
  });

  it('falls back to recent questions when fresh candidate pool is insufficient', () => {
    const candidatePool: CandidateQuestion[] = [
      { id: 'q1', topicId: 'top-1', difficulty: 3, expectedTimeSeconds: 60 },
      { id: 'q2', topicId: 'top-1', difficulty: 3, expectedTimeSeconds: 60 },
      { id: 'q3', topicId: 'top-1', difficulty: 3, expectedTimeSeconds: 60 },
    ];

    const recentIds = new Set(['q1', 'q2', 'q3']); // all 3 were attempted
    const rule: SectionRuleInput = {
      topicId: 'top-1',
      count: 2,
      difficultyMin: 1,
      difficultyMax: 5,
    };

    const selected = selectQuestionsForRule(rule, candidatePool, recentIds, createPrng(888));
    expect(selected).toHaveLength(2);
  });

  it('generates valid option index permutations', () => {
    const order = generateOptionOrder(4, 12345, 1);
    expect(order).toHaveLength(4);
    expect([...order].sort()).toEqual([0, 1, 2, 3]);
  });
});
