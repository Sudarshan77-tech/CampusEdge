import { assertNoAnswerLeakage, AttemptStatus } from '@campusedge/shared';

describe('Zero-Knowledge Student In-Attempt Leakage Contract Test', () => {
  it('verifies in-progress student attempt projection has zero forbidden fields', () => {
    // Simulated active attempt DTO delivered to student web client
    const inProgressStudentResponse = {
      id: 'attempt-1111',
      status: AttemptStatus.IN_PROGRESS,
      expiresAt: '2026-10-10T12:00:00.000Z',
      remainingSeconds: 3500,
      durationMinutes: 60,
      items: [
        {
          id: 'item-1',
          position: 1,
          questionId: 'q-101',
          selectedOptionIndex: null,
          isFlagged: false,
          question: {
            id: 'q-101',
            prompt: 'What is the worst-case time complexity of MergeSort?',
            codeSnippet: null,
            options: [
              { index: 0, text: 'O(n)' },
              { index: 1, text: 'O(n log n)' },
              { index: 2, text: 'O(n^2)' },
              { index: 3, text: 'O(2^n)' },
            ],
          },
        },
        {
          id: 'item-2',
          position: 2,
          questionId: 'q-102',
          selectedOptionIndex: 1,
          isFlagged: true,
          question: {
            id: 'q-102',
            prompt: 'Which normal form eliminates transitive functional dependencies?',
            codeSnippet: null,
            options: [
              { index: 0, text: '1NF' },
              { index: 1, text: '2NF' },
              { index: 2, text: '3NF' },
              { index: 3, text: 'BCNF' },
            ],
          },
        },
      ],
    };

    // Assert that the full payload passes zero leakage contract
    expect(() => assertNoAnswerLeakage(inProgressStudentResponse)).not.toThrow();
  });

  it('detects and flags answer key leakage across nested questions and options', () => {
    const maliciousPayloadWithCorrectIndex = {
      id: 'attempt-leaked-1',
      items: [
        {
          id: 'item-1',
          question: {
            prompt: 'Sample Question',
            correctOptionIndex: 2, // VIOLATION
            options: [
              { index: 0, text: 'A' },
              { index: 1, text: 'B' },
            ],
          },
        },
      ],
    };

    expect(() => assertNoAnswerLeakage(maliciousPayloadWithCorrectIndex)).toThrow(
      /CRITICAL SECURITY VIOLATION: Forbidden field "correctOptionIndex"/,
    );

    const maliciousPayloadWithExplanation = {
      id: 'attempt-leaked-2',
      items: [
        {
          id: 'item-1',
          question: {
            prompt: 'Sample Question',
            explanation: 'The solution is derived by induction', // VIOLATION
            options: [{ index: 0, text: 'A' }],
          },
        },
      ],
    };

    expect(() => assertNoAnswerLeakage(maliciousPayloadWithExplanation)).toThrow(
      /CRITICAL SECURITY VIOLATION: Forbidden field "explanation"/,
    );

    const maliciousPayloadWithOptionIsCorrect = {
      id: 'attempt-leaked-3',
      items: [
        {
          id: 'item-1',
          question: {
            prompt: 'Sample Question',
            options: [
              { index: 0, text: 'A', isCorrect: false },
              { index: 1, text: 'B', isCorrect: true }, // VIOLATION
            ],
          },
        },
      ],
    };

    expect(() => assertNoAnswerLeakage(maliciousPayloadWithOptionIsCorrect)).toThrow(
      /CRITICAL SECURITY VIOLATION: Forbidden field "isCorrect"/,
    );
  });
});
