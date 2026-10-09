import { QuestionSeed } from './quant';

export const logicalQuestions: QuestionSeed[] = [
  // 1. Syllogisms
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Statements: 1. All cats are animals. 2. All animals are mammals.\nConclusions: I. All cats are mammals. II. Some mammals are cats.',
    options: [
      { key: 'A', text: 'Only conclusion I follows', isCorrect: false },
      { key: 'B', text: 'Only conclusion II follows', isCorrect: false },
      { key: 'C', text: 'Both conclusions I and II follow', isCorrect: true },
      { key: 'D', text: 'Neither conclusion follows', isCorrect: false },
    ],
    explanation:
      'From "All A are B" and "All B are C", we deduce "All A are C" (All cats are mammals). Since the set of cats is non-empty and contained in mammals, at least some mammals are cats. Both conclusions follow.',
    expectedTimeSeconds: 40,
    tags: ['syllogism', 'deductive-logic'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Statements: 1. Some pens are books. 2. All books are pencils.\nConclusions: I. Some pencils are pens. II. All pencils are books.',
    options: [
      { key: 'A', text: 'Only conclusion I follows', isCorrect: true },
      { key: 'B', text: 'Only conclusion II follows', isCorrect: false },
      { key: 'C', text: 'Both follow', isCorrect: false },
      { key: 'D', text: 'Neither follows', isCorrect: false },
    ],
    explanation:
      'Since Some Pens are Books, and All Books are Pencils, the intersection of Pens and Books is inside Pencils. Therefore, Some Pencils are Pens (Conclusion I is valid). Conclusion II does not follow as books are a subset of pencils, not necessarily equal.',
    expectedTimeSeconds: 45,
    tags: ['syllogism'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Statements: 1. No flower is a pot. 2. No pot is a garden.\nConclusions: I. No flower is a garden. II. Some gardens are pots.',
    options: [
      { key: 'A', text: 'Only I follows', isCorrect: false },
      { key: 'B', text: 'Only II follows', isCorrect: false },
      { key: 'C', text: 'Either I or II follows', isCorrect: false },
      { key: 'D', text: 'Neither follows', isCorrect: true },
    ],
    explanation:
      'Two negative universal premises yield no definite universal or particular relationship between flower and garden. Also, No pot is a garden contradicts Some gardens are pots. Hence neither follows.',
    expectedTimeSeconds: 50,
    tags: ['syllogism', 'fallacies'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Statements: 1. All doors are keys. 2. Some keys are locks. 3. All locks are cards.\nConclusions: I. Some cards are keys. II. Some locks are doors.',
    options: [
      { key: 'A', text: 'Only conclusion I follows', isCorrect: true },
      { key: 'B', text: 'Only conclusion II follows', isCorrect: false },
      { key: 'C', text: 'Both follow', isCorrect: false },
      { key: 'D', text: 'Neither follows', isCorrect: false },
    ],
    explanation:
      'Some keys are locks and all locks are cards => the keys that are locks are also cards. Thus, some cards are keys (Conclusion I follows). There is no guaranteed overlap between doors and locks, so Conclusion II does not follow.',
    expectedTimeSeconds: 60,
    tags: ['syllogism'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'Statements: 1. Only a few engineers are managers. 2. All managers are leaders.\nConclusions: I. Some engineers are leaders. II. All engineers can be leaders.',
    options: [
      { key: 'A', text: 'Only conclusion I follows', isCorrect: false },
      { key: 'B', text: 'Both conclusions I and II follow', isCorrect: true },
      { key: 'C', text: 'Only conclusion II follows', isCorrect: false },
      { key: 'D', text: 'Neither follows', isCorrect: false },
    ],
    explanation:
      '"Only a few engineers are managers" means some engineers are managers and some engineers are not managers. Since all managers are leaders, the engineers that are managers are definitely leaders (Conclusion I follows). Also, there is no restriction preventing all engineers from also being leaders (while still only a few are managers), so the possibility holds (Conclusion II follows).',
    expectedTimeSeconds: 60,
    tags: ['syllogism', 'possibility'],
  },

  // 2. Blood Relations
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Pointing to a photograph, Rohit said, "She is the daughter of my grandfather\'s only son." How is the woman in the photograph related to Rohit?',
    options: [
      { key: 'A', text: 'Mother', isCorrect: false },
      { key: 'B', text: 'Sister', isCorrect: true },
      { key: 'C', text: 'Cousin', isCorrect: false },
      { key: 'D', text: 'Aunt', isCorrect: false },
    ],
    explanation:
      "Rohit's grandfather's only son is Rohit's father. The daughter of Rohit's father is Rohit's sister.",
    expectedTimeSeconds: 30,
    tags: ['blood-relations'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "A is B's sister. C is B's mother. D is C's father. E is D's mother. How is A related to D?",
    options: [
      { key: 'A', text: 'Grandmother', isCorrect: false },
      { key: 'B', text: 'Granddaughter', isCorrect: true },
      { key: 'C', text: 'Daughter', isCorrect: false },
      { key: 'D', text: 'Great Granddaughter', isCorrect: false },
    ],
    explanation:
      'A is sister of B, so A is female. C is mother of B (and A). D is father of C. Therefore, A is the granddaughter of D.',
    expectedTimeSeconds: 40,
    tags: ['blood-relations'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'If P + Q means P is the husband of Q; P / Q means P is the sister of Q; and P * Q means P is the son of Q, which of the following shows that A is the nephew of B?',
    options: [
      { key: 'A', text: 'A * C / B', isCorrect: true },
      { key: 'B', text: 'B / C * A', isCorrect: false },
      { key: 'C', text: 'A + C / B', isCorrect: false },
      { key: 'D', text: 'A * B / C', isCorrect: false },
    ],
    explanation:
      "In A * C / B: C / B means C is the sister of B. A * C means A is the son of C. The son of B's sister is B's nephew. Thus A is the nephew of B.",
    expectedTimeSeconds: 60,
    tags: ['coded-relations', 'blood-relations'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Introducing a man, a woman says, "His wife is the only daughter of my father." How is the man related to the woman?',
    options: [
      { key: 'A', text: 'Brother', isCorrect: false },
      { key: 'B', text: 'Father-in-law', isCorrect: false },
      { key: 'C', text: 'Husband', isCorrect: true },
      { key: 'D', text: 'Maternal Uncle', isCorrect: false },
    ],
    explanation:
      "The woman speaking is the only daughter of her father. So the man's wife is the woman herself. Hence the man is her husband.",
    expectedTimeSeconds: 30,
    tags: ['blood-relations'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "In a family of six people (P, Q, R, S, T, U), there are two married couples. R is the brother of T's husband. U is the grandson of P. S is the daughter of Q. T is the mother of U. How is Q related to U?",
    options: [
      { key: 'A', text: 'Father', isCorrect: false },
      { key: 'B', text: 'Grandmother', isCorrect: true },
      { key: 'C', text: 'Grandfather', isCorrect: false },
      { key: 'D', text: 'Aunt', isCorrect: false },
    ],
    explanation:
      "U is grandson of P. T is mother of U, so T's husband is son of P and Q. Since there are 2 couples and S is daughter of Q, Q and P are grandparents. Q is the grandmother of U.",
    expectedTimeSeconds: 60,
    tags: ['blood-relations'],
  },

  // 3. Coding-Decoding
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If in a certain code language, "ROUTINE" is written as "VMRGFLI", how is "CRUELTY" written in that language?',
    options: [
      { key: 'A', text: 'VOCVPBW', isCorrect: true },
      { key: 'B', text: 'BPAVPOC', isCorrect: false },
      { key: 'C', text: 'WBCVPVO', isCorrect: false },
      { key: 'D', text: 'COVPVWB', isCorrect: false },
    ],
    explanation:
      'Observe the reverse pairs or shifted pattern: ROUTINE reversed is ENITUOR, each letter shifted +1: E->F, etc. Alternatively, check letter mapping: R(18)+4=V(22), O(15)-2=M(13), U(21)-3=R(18). Applying the consistent offset rule gives VOCVPBW.',
    expectedTimeSeconds: 60,
    tags: ['coding-decoding'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'In a code, "TEACHER" is written as "VGCEJGT". How is "CHILDREN" written in that same code?',
    options: [
      { key: 'A', text: 'EJKNFTGP', isCorrect: true },
      { key: 'B', text: 'EJKNFTHP', isCorrect: false },
      { key: 'C', text: 'EGKNFTEP', isCorrect: false },
      { key: 'D', text: 'FKLOHUQP', isCorrect: false },
    ],
    explanation:
      'Each letter is shifted forward by 2 positions (+2). C->E, H->J, I->K, L->N, D->F, R->T, E->G, N->P. Result is EJKNFTGP.',
    expectedTimeSeconds: 40,
    tags: ['coding-decoding'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If "RED" is coded as 27 and "BLUE" is coded as 40, what is the code for "GREEN"?',
    options: [
      { key: 'A', text: '49', isCorrect: true },
      { key: 'B', text: '51', isCorrect: false },
      { key: 'C', text: '53', isCorrect: false },
      { key: 'D', text: '55', isCorrect: false },
    ],
    explanation:
      'Sum of alphabetical positions: R(18) + E(5) + D(4) = 27. BLUE = 2 + 12 + 21 + 5 = 40. GREEN = 7 + 18 + 5 + 5 + 14 = 49.',
    expectedTimeSeconds: 45,
    tags: ['coding-decoding', 'alphanumeric'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'If "pit na som" means "bring me water", "na jo tod" means "water is life", and "tub od pit" means "give me food", which word represents "is"?',
    options: [
      { key: 'A', text: 'na', isCorrect: false },
      { key: 'B', text: 'jo or tod', isCorrect: true },
      { key: 'C', text: 'som', isCorrect: false },
      { key: 'D', text: 'pit', isCorrect: false },
    ],
    explanation:
      '"na" is common to first two phrases, corresponding to "water". In "na jo tod" ("water is life"), "jo" and "tod" represent "is" and "life", but cannot be uniquely separated without another statement. Thus, it is either "jo" or "tod".',
    expectedTimeSeconds: 50,
    tags: ['coding-decoding'],
  },

  // 4. Series & Sequences
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'Find the next number in the series: 3, 7, 15, 31, 63, ?',
    numericAnswer: 127,
    numericTolerance: 0,
    explanation:
      'Each term is generated by (2 * previous) + 1: 3*2+1=7, 7*2+1=15, 15*2+1=31, 31*2+1=63, 63*2+1=127.',
    expectedTimeSeconds: 30,
    tags: ['series', 'number-series'],
  },
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'What is the next number in the sequence: 2, 6, 12, 20, 30, 42, ?',
    numericAnswer: 56,
    numericTolerance: 0,
    explanation:
      'The differences between consecutive terms are +4, +6, +8, +10, +12. The next difference is +14. 42 + 14 = 56. (Alternatively, n*(n+1): 1*2, 2*3, 3*4, 4*5, 5*6, 6*7, 7*8=56).',
    expectedTimeSeconds: 35,
    tags: ['series', 'number-series'],
  },
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'Find the missing term in the sequence: 4, 9, 25, 49, 121, 169, ?',
    numericAnswer: 289,
    numericTolerance: 0,
    explanation:
      'These are the squares of prime numbers: 2^2=4, 3^2=9, 5^2=25, 7^2=49, 11^2=121, 13^2=169. The next prime number is 17, and 17^2 = 289.',
    expectedTimeSeconds: 40,
    tags: ['series', 'primes'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which letter comes next in the sequence: B, E, H, K, N, ?',
    options: [
      { key: 'A', text: 'P', isCorrect: false },
      { key: 'B', text: 'Q', isCorrect: true },
      { key: 'C', text: 'R', isCorrect: false },
      { key: 'D', text: 'S', isCorrect: false },
    ],
    explanation:
      'Letter positions are 2, 5, 8, 11, 14, adding 3 each step. 14 + 3 = 17, which corresponds to the letter Q.',
    expectedTimeSeconds: 20,
    tags: ['letter-series'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the next letter group in the series: AZ, CX, EV, GT, ?',
    options: [
      { key: 'A', text: 'IR', isCorrect: true },
      { key: 'B', text: 'HS', isCorrect: false },
      { key: 'C', text: 'JQ', isCorrect: false },
      { key: 'D', text: 'KP', isCorrect: false },
    ],
    explanation:
      'First letters advance by +2: A(1), C(3), E(5), G(7), so next is I(9). Second letters regress by -2: Z(26), X(24), V(22), T(20), so next is R(18). Hence IR.',
    expectedTimeSeconds: 30,
    tags: ['letter-series'],
  },

  // 5. Direction Sense
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A person walks 5 km North, turns right and walks 3 km, turns right again and walks 5 km. In which direction is the person from the starting point?',
    options: [
      { key: 'A', text: 'North', isCorrect: false },
      { key: 'B', text: 'South', isCorrect: false },
      { key: 'C', text: 'East', isCorrect: true },
      { key: 'D', text: 'West', isCorrect: false },
    ],
    explanation:
      'Walking 5 km North (+5y), turning right and walking 3 km (+3x), turning right and walking 5 km (-5y). Net displacement is (+3x, 0y), which is 3 km East.',
    expectedTimeSeconds: 30,
    tags: ['direction-sense'],
  },
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'Anita starts walking from her home. She walks 8 km South, turns West and walks 6 km, then turns North and walks 16 km. What is the shortest straight-line distance in km from her starting position?',
    numericAnswer: 10,
    numericTolerance: 0,
    explanation:
      'Net North-South displacement: -8 + 16 = +8 km (North). Net East-West displacement: -6 km (West). Shortest distance = sqrt(8^2 + 6^2) = sqrt(64 + 36) = sqrt(100) = 10 km.',
    expectedTimeSeconds: 45,
    tags: ['direction-sense', 'pythagoras'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'At 3:00 PM, the minute hand of a clock points towards North-East. In which direction does the hour hand point at the same time?',
    options: [
      { key: 'A', text: 'South-East', isCorrect: true },
      { key: 'B', text: 'North-West', isCorrect: false },
      { key: 'C', text: 'South-West', isCorrect: false },
      { key: 'D', text: 'East', isCorrect: false },
    ],
    explanation:
      'At 3:00 PM, normally the minute hand is at 12 (North) and the hour hand is at 3 (East), with an angle of 90 degrees clockwise. If North is rotated 45 degrees clockwise to North-East, East is also rotated 45 degrees clockwise to South-East.',
    expectedTimeSeconds: 45,
    tags: ['direction-sense', 'clocks'],
  },

  // 6. Seating Arrangements
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Five friends P, Q, R, S, and T are sitting in a row facing North. R is sitting immediately between P and T. Q is to the immediate right of T. S is at the extreme left. Who is sitting in the exact middle of the row?',
    options: [
      { key: 'A', text: 'P', isCorrect: false },
      { key: 'B', text: 'R', isCorrect: true },
      { key: 'C', text: 'T', isCorrect: false },
      { key: 'D', text: 'S', isCorrect: false },
    ],
    explanation:
      'S is at extreme left (position 1). R is between P and T. Since Q is immediately right of T, the order must be S, P, R, T, Q. Position 3 (middle) is R.',
    expectedTimeSeconds: 60,
    tags: ['seating-arrangement'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'Six people A, B, C, D, E, and F are sitting around a circular table facing the center. A is opposite D. B is to the immediate right of A. C is between A and E. Who is sitting to the immediate left of D?',
    options: [
      { key: 'A', text: 'E', isCorrect: false },
      { key: 'B', text: 'F', isCorrect: false },
      { key: 'C', text: 'B', isCorrect: false },
      { key: 'D', text: 'E or F', isCorrect: true },
    ],
    explanation:
      "Arrangement around circle: A at 12 o'clock, D at 6 o'clock. B is right of A (clockwise, 2 o'clock). C is between A and E, so C is at 10 o'clock and E is at 8 o'clock. That leaves F at 4 o'clock. Facing center, the immediate left of D (at 6 o'clock) is 4 o'clock (F) or depends on orientation definition. However, if left is clockwise (facing inward), 4 o'clock is left, but if counterclockwise, it is E. With exact standard inward orientation, left of D is F.",
    expectedTimeSeconds: 60,
    tags: ['seating-arrangement', 'circular'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Eight people are sitting in two parallel rows facing each other. Row 1 has A, B, C, D facing South. Row 2 has P, Q, R, S facing North. B is opposite R. P is at an extreme end and faces C. S is second to the left of P. Who faces D?',
    options: [
      { key: 'A', text: 'Q', isCorrect: true },
      { key: 'B', text: 'R', isCorrect: false },
      { key: 'C', text: 'S', isCorrect: false },
      { key: 'D', text: 'P', isCorrect: false },
    ],
    explanation:
      'From the given constraints, P faces C. B faces R. Since the remaining positions are matched, Q must be opposite D.',
    expectedTimeSeconds: 60,
    tags: ['seating-arrangement'],
  },

  // 7. Order & Ranking
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'In a class of students, Ravi ranks 13th from the top and 28th from the bottom. How many total students are there in the class?',
    numericAnswer: 40,
    numericTolerance: 0,
    explanation: 'Total students = (Rank from top) + (Rank from bottom) - 1 = 13 + 28 - 1 = 40.',
    expectedTimeSeconds: 20,
    tags: ['ranking'],
  },
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'In a row of boys, Deepak is 7th from the left and Madan is 12th from the right. If they interchange their positions, Deepak becomes 22nd from the left. How many total boys are there in the row?',
    numericAnswer: 33,
    numericTolerance: 0,
    explanation:
      "After swapping, Deepak occupies Madan's original spot, which was 12th from the right. Since Deepak is now 22nd from the left, Total = 22 + 12 - 1 = 33.",
    expectedTimeSeconds: 40,
    tags: ['ranking', 'order'],
  },

  // 8. Critical Reasoning & Assumptions
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Statement: "The municipal authority has decided to ban plastic bags less than 50 microns to reduce drainage clogging."\nAssumptions:\nI. People will comply with the new ban.\nII. Bags thinner than 50 microns were the primary cause of urban drainage clogging.',
    options: [
      { key: 'A', text: 'Only assumption I is implicit', isCorrect: true },
      { key: 'B', text: 'Only assumption II is implicit', isCorrect: false },
      { key: 'C', text: 'Both I and II are implicit', isCorrect: false },
      { key: 'D', text: 'Neither is implicit', isCorrect: false },
    ],
    explanation:
      'Any government policy decision implicitly assumes public compliance (I). However, it assumes plastic bags are a significant contributor, not necessarily the single "primary" cause. Thus only I is strictly implicit.',
    expectedTimeSeconds: 45,
    tags: ['critical-reasoning', 'assumptions'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'Statement: "Should companies mandate a 3-day work-from-office policy for all software engineers?"\nArguments:\nI. Yes, in-person collaboration fosters faster mentoring for junior developers and stronger team bonding.\nII. No, daily commutes increase employee stress, carbon footprint, and decrease net productive coding hours.',
    options: [
      { key: 'A', text: 'Only argument I is strong', isCorrect: false },
      { key: 'B', text: 'Only argument II is strong', isCorrect: false },
      { key: 'C', text: 'Both argument I and II are strong', isCorrect: true },
      { key: 'D', text: 'Neither is strong', isCorrect: false },
    ],
    explanation:
      'Both arguments address legitimate, empirically verified dimensions of engineering productivity and work culture. Both present strong logical points from opposing perspectives.',
    expectedTimeSeconds: 50,
    tags: ['arguments', 'critical-reasoning'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Course of Action: Statement: "A massive security vulnerability was discovered in a widely used open-source logging library."\nCourses of Action:\nI. The organization should immediately audit its dependency tree and patch affected services.\nII. All software deployments should be permanently suspended.',
    options: [
      { key: 'A', text: 'Only I follows', isCorrect: true },
      { key: 'B', text: 'Only II follows', isCorrect: false },
      { key: 'C', text: 'Both follow', isCorrect: false },
      { key: 'D', text: 'Neither follows', isCorrect: false },
    ],
    explanation:
      'Course I is practical, proportionate, and directly addresses the vulnerability. Course II is an extreme, disproportionate overreaction that halts business operations unnecessarily.',
    expectedTimeSeconds: 40,
    tags: ['course-of-action'],
  },

  // 9. Venn Diagrams
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which of the following diagrams best represents the relationship between: Engineers, Doctors, and Humans?',
    options: [
      { key: 'A', text: 'Two separate circles inside a large circle', isCorrect: true },
      { key: 'B', text: 'Three overlapping circles', isCorrect: false },
      { key: 'C', text: 'Three concentric circles', isCorrect: false },
      { key: 'D', text: 'Two overlapping circles inside a large circle', isCorrect: false },
    ],
    explanation:
      'Both Engineers and Doctors are Humans (subsets of Humans). By formal profession, an individual is practicing as either an engineer or a doctor in typical vocational taxonomy, represented as two mutually exclusive subsets within Humans.',
    expectedTimeSeconds: 30,
    tags: ['venn-diagrams'],
  },
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'In a group of 100 students, 60 like Python, 50 like Java, and 30 like both. How many students like neither Python nor Java?',
    numericAnswer: 20,
    numericTolerance: 0,
    explanation:
      '|P union J| = |P| + |J| - |P intersect J| = 60 + 50 - 30 = 80. Neither = Total - 80 = 100 - 80 = 20.',
    expectedTimeSeconds: 30,
    tags: ['venn-diagrams', 'sets'],
  },

  // 10. Clocks and Calendars
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the angle between the hour hand and the minute hand of a clock at 4:20?',
    options: [
      { key: 'A', text: '0 degrees', isCorrect: false },
      { key: 'B', text: '10 degrees', isCorrect: true },
      { key: 'C', text: '20 degrees', isCorrect: false },
      { key: 'D', text: '15 degrees', isCorrect: false },
    ],
    explanation:
      'Angle = |30 * H - 5.5 * M|. At 4:20: |30 * 4 - 5.5 * 20| = |120 - 110| = 10 degrees.',
    expectedTimeSeconds: 35,
    tags: ['clocks'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'If 15th August 2024 was a Thursday, which day of the week was 15th August 2025?',
    options: [
      { key: 'A', text: 'Thursday', isCorrect: false },
      { key: 'B', text: 'Friday', isCorrect: true },
      { key: 'C', text: 'Saturday', isCorrect: false },
      { key: 'D', text: 'Sunday', isCorrect: false },
    ],
    explanation:
      'The period from 15th Aug 2024 to 15th Aug 2025 is an ordinary non-leap year of 365 days (2024 leap day was in Feb 2024, before Aug 2024). 365 mod 7 = 1 odd day. Thursday + 1 day = Friday.',
    expectedTimeSeconds: 35,
    tags: ['calendars'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'How many times do the hands of a clock coincide in a 24-hour day?',
    options: [
      { key: 'A', text: '24', isCorrect: false },
      { key: 'B', text: '22', isCorrect: true },
      { key: 'C', text: '44', isCorrect: false },
      { key: 'D', text: '48', isCorrect: false },
    ],
    explanation:
      'In every 12 hours, the hands coincide 11 times (between 11 and 1, they coincide only once at 12:00). In 24 hours, they coincide 11 * 2 = 22 times.',
    expectedTimeSeconds: 30,
    tags: ['clocks'],
  },

  // 11. Data Sufficiency
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Question: Is x > y?\nStatement I: x + 2 > y + 2\nStatement II: 2x > 2y',
    options: [
      { key: 'A', text: 'Statement I alone is sufficient', isCorrect: false },
      { key: 'B', text: 'Statement II alone is sufficient', isCorrect: false },
      { key: 'C', text: 'Each statement alone is sufficient', isCorrect: true },
      { key: 'D', text: 'Neither statement is sufficient', isCorrect: false },
    ],
    explanation:
      'From Statement I: subtracting 2 gives x > y (sufficient). From Statement II: dividing by positive 2 gives x > y (sufficient). Hence each statement alone is sufficient.',
    expectedTimeSeconds: 40,
    tags: ['data-sufficiency'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'Question: Is integer n divisible by 6?\nStatement I: n is divisible by 2.\nStatement II: n is divisible by 3.',
    options: [
      { key: 'A', text: 'Statement I alone is sufficient', isCorrect: false },
      { key: 'B', text: 'Statement II alone is sufficient', isCorrect: false },
      { key: 'C', text: 'Both statements together are sufficient', isCorrect: true },
      { key: 'D', text: 'Statements together are NOT sufficient', isCorrect: false },
    ],
    explanation:
      'Since 2 and 3 are coprime (gcd(2,3)=1), a number divisible by both 2 and 3 is divisible by their product 6. Both statements together are sufficient.',
    expectedTimeSeconds: 40,
    tags: ['data-sufficiency', 'number-theory'],
  },

  // 12. Analogies & Classification
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Find the related word: Thermometer : Temperature :: Barometer : ?',
    options: [
      { key: 'A', text: 'Humidity', isCorrect: false },
      { key: 'B', text: 'Pressure', isCorrect: true },
      { key: 'C', text: 'Wind', isCorrect: false },
      { key: 'D', text: 'Rainfall', isCorrect: false },
    ],
    explanation:
      'A thermometer is an instrument used to measure temperature; a barometer is an instrument used to measure atmospheric pressure.',
    expectedTimeSeconds: 20,
    tags: ['analogy'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Find the odd one out: 27, 64, 125, 144, 216',
    options: [
      { key: 'A', text: '27', isCorrect: false },
      { key: 'B', text: '64', isCorrect: false },
      { key: 'C', text: '125', isCorrect: false },
      { key: 'D', text: '144', isCorrect: true },
    ],
    explanation:
      '27 = 3^3, 64 = 4^3, 125 = 5^3, 216 = 6^3 are all perfect cubes. 144 is 12^2, but not a perfect cube of an integer.',
    expectedTimeSeconds: 30,
    tags: ['classification', 'odd-one-out'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Find the odd one out among these computer terms: RAM, ROM, Cache, SSD, ALU',
    options: [
      { key: 'A', text: 'RAM', isCorrect: false },
      { key: 'B', text: 'ROM', isCorrect: false },
      { key: 'C', text: 'ALU', isCorrect: true },
      { key: 'D', text: 'SSD', isCorrect: false },
    ],
    explanation:
      'RAM, ROM, Cache, and SSD are all memory and storage storage units. ALU (Arithmetic Logic Unit) is a processing unit inside the CPU.',
    expectedTimeSeconds: 25,
    tags: ['classification'],
  },

  // 13. Logical Deduction & Puzzles
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Three boxes are labeled "Apples", "Oranges", and "Apples & Oranges", but all three boxes are incorrectly labeled. You are allowed to draw only ONE fruit from ONE box without looking inside. Which box should you pick from to correctly label all three boxes?',
    options: [
      { key: 'A', text: 'Apples', isCorrect: false },
      { key: 'B', text: 'Oranges', isCorrect: false },
      { key: 'C', text: 'Apples & Oranges', isCorrect: true },
      { key: 'D', text: 'Any box', isCorrect: false },
    ],
    explanation:
      'Pick from "Apples & Oranges". Since the label is wrong, it cannot contain both. If you pull an apple, the box is Apples. The box labeled "Oranges" must then be "Apples & Oranges", and the one labeled "Apples" must be "Oranges".',
    expectedTimeSeconds: 60,
    tags: ['puzzles', 'logic-puzzle'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In a group of 5 people, each person shakes hands with every other person exactly once. How many total handshakes occur?',
    options: [
      { key: 'A', text: '10', isCorrect: true },
      { key: 'B', text: '15', isCorrect: false },
      { key: 'C', text: '20', isCorrect: false },
      { key: 'D', text: '25', isCorrect: false },
    ],
    explanation: 'Total handshakes = n*(n-1)/2 = 5 * 4 / 2 = 10.',
    expectedTimeSeconds: 25,
    tags: ['combinations', 'logic'],
  },
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'A snail is at the bottom of a 30-meter deep well. Every day it climbs up 3 meters, but during the night it slips back 2 meters. On which day does the snail reach the top of the well?',
    numericAnswer: 28,
    numericTolerance: 0,
    explanation:
      'Each 24-hr cycle gives net progress of 1 meter. On day 27 evening, it reaches 27 meters. On day 28 morning, it climbs 3 meters, reaching 30 meters (the top) before having a chance to slip back. So it reaches the top on the 28th day.',
    expectedTimeSeconds: 45,
    tags: ['puzzles'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'If Monday was 3 days before yesterday, what day will tomorrow be?',
    options: [
      { key: 'A', text: 'Friday', isCorrect: false },
      { key: 'B', text: 'Saturday', isCorrect: true },
      { key: 'C', text: 'Sunday', isCorrect: false },
      { key: 'D', text: 'Thursday', isCorrect: false },
    ],
    explanation:
      'Monday was 3 days before yesterday => yesterday was Thursday (Mon + 3). Today is Friday. Tomorrow will be Saturday.',
    expectedTimeSeconds: 30,
    tags: ['calendars', 'deduction'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A dice is numbered 1 to 6. Two positions of the same dice are shown: Position 1 shows 1, 2, 3 (with 1 on top). Position 2 shows 1, 4, 5. What number is on the face opposite to 1?',
    options: [
      { key: 'A', text: '6', isCorrect: true },
      { key: 'B', text: '4', isCorrect: false },
      { key: 'C', text: '5', isCorrect: false },
      { key: 'D', text: '2', isCorrect: false },
    ],
    explanation:
      'The adjacent faces to 1 are 2, 3, 4, and 5. The only remaining face that is not adjacent to 1 must be opposite to it, which is 6.',
    expectedTimeSeconds: 30,
    tags: ['dice', 'spatial-reasoning'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Statements: A > B, B >= C, C = D, D < E.\nConclusions:\nI. A > D\nII. B >= D',
    options: [
      { key: 'A', text: 'Only I is true', isCorrect: false },
      { key: 'B', text: 'Only II is true', isCorrect: false },
      { key: 'C', text: 'Both I and II are true', isCorrect: true },
      { key: 'D', text: 'Neither is true', isCorrect: false },
    ],
    explanation:
      'Since C = D, B >= C implies B >= D (Conclusion II is true). Since A > B and B >= D, A > D (Conclusion I is true). Both are true.',
    expectedTimeSeconds: 30,
    tags: ['inequalities'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Statements: P <= Q < R = S > T.\nConclusions:\nI. P < S\nII. R > T',
    options: [
      { key: 'A', text: 'Only I is true', isCorrect: false },
      { key: 'B', text: 'Only II is true', isCorrect: false },
      { key: 'C', text: 'Both I and II are true', isCorrect: true },
      { key: 'D', text: 'Neither is true', isCorrect: false },
    ],
    explanation:
      'P <= Q < R = S => P < S (Conclusion I is true). R = S and S > T => R > T (Conclusion II is true). Both are true.',
    expectedTimeSeconds: 30,
    tags: ['inequalities'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In a code, "EARTH" is written as "GCTVJ". How is "MOON" written in that same code?',
    options: [
      { key: 'A', text: 'OQQP', isCorrect: true },
      { key: 'B', text: 'OPPQ', isCorrect: false },
      { key: 'C', text: 'NOOP', isCorrect: false },
      { key: 'D', text: 'OQPO', isCorrect: false },
    ],
    explanation: 'Each letter is shifted by +2: M->O, O->Q, O->Q, N->P. Thus MOON is OQQP.',
    expectedTimeSeconds: 20,
    tags: ['coding-decoding'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If South-East becomes North, North-East becomes West, and so on, what will West become?',
    options: [
      { key: 'A', text: 'South-East', isCorrect: true },
      { key: 'B', text: 'North-East', isCorrect: false },
      { key: 'C', text: 'South-West', isCorrect: false },
      { key: 'D', text: 'North-West', isCorrect: false },
    ],
    explanation:
      'South-East (135 deg) becomes North (0/360 deg), a rotation of 135 deg anti-clockwise (or 225 deg clockwise). Rotating West (270 deg) by 135 deg anti-clockwise gives 135 deg, which is South-East.',
    expectedTimeSeconds: 40,
    tags: ['direction-sense'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which word CANNOT be formed using the letters of the word "PREPARATION"?',
    options: [
      { key: 'A', text: 'RATION', isCorrect: false },
      { key: 'B', text: 'PARROT', isCorrect: true },
      { key: 'C', text: 'PATRON', isCorrect: false },
      { key: 'D', text: 'TRAIN', isCorrect: false },
    ],
    explanation:
      'In "PREPARATION", the letter counts are P:2, R:2, E:1, A:2, T:1, I:1, O:1, N:1. "PARROT" requires three Rs, but "PREPARATION" only contains two Rs.',
    expectedTimeSeconds: 25,
    tags: ['word-formation'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In a row of trees, a banyan tree is 7th from either end of the row. How many trees are there in the row?',
    options: [
      { key: 'A', text: '13', isCorrect: true },
      { key: 'B', text: '14', isCorrect: false },
      { key: 'C', text: '15', isCorrect: false },
      { key: 'D', text: '11', isCorrect: false },
    ],
    explanation: 'Total = (7 + 7) - 1 = 13 trees.',
    expectedTimeSeconds: 20,
    tags: ['ranking'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Pointing to a gentleman, Deepak said, "His only brother is the father of my daughter\'s father." How is the gentleman related to Deepak?',
    options: [
      { key: 'A', text: 'Father', isCorrect: false },
      { key: 'B', text: 'Uncle', isCorrect: true },
      { key: 'C', text: 'Grandfather', isCorrect: false },
      { key: 'D', text: 'Brother', isCorrect: false },
    ],
    explanation:
      "\"My daughter's father\" is Deepak himself. The father of Deepak is Deepak's father. So the gentleman's only brother is Deepak's father. The brother of Deepak's father is Deepak's paternal uncle.",
    expectedTimeSeconds: 40,
    tags: ['blood-relations'],
  },
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'Find the next number in the series: 1, 8, 27, 64, 125, ?',
    numericAnswer: 216,
    numericTolerance: 0,
    explanation:
      'These are cubes of positive integers: 1^3, 2^3, 3^3, 4^3, 5^3. Next is 6^3 = 216.',
    expectedTimeSeconds: 20,
    tags: ['series'],
  },
  {
    topicSlug: 'logical',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'What is the sum of opposite faces on a standard fair six-sided die?',
    numericAnswer: 7,
    numericTolerance: 0,
    explanation: 'On a standard die, opposite faces always sum to 7 (1+6, 2+5, 3+4).',
    expectedTimeSeconds: 15,
    tags: ['dice'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'If A is taller than B, B is taller than C, and D is taller than A, who is the shortest among them?',
    options: [
      { key: 'A', text: 'A', isCorrect: false },
      { key: 'B', text: 'B', isCorrect: false },
      { key: 'C', text: 'C', isCorrect: true },
      { key: 'D', text: 'D', isCorrect: false },
    ],
    explanation: 'Height ordering: D > A > B > C. Therefore, C is the shortest.',
    expectedTimeSeconds: 15,
    tags: ['order'],
  },
  {
    topicSlug: 'logical',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Statements: 1. All apples are red. 2. Some red fruits are sweet.\nConclusion: Can we conclude that all apples are sweet?',
    options: [
      { key: 'A', text: 'Yes, definitively', isCorrect: false },
      { key: 'B', text: 'No, does not follow', isCorrect: true },
      { key: 'C', text: 'Yes, if apples are red', isCorrect: false },
      { key: 'D', text: 'Only if sweet fruits are apples', isCorrect: false },
    ],
    explanation:
      'Apples are a subset of red fruits, but only some red fruits are sweet. The sweet red fruits might not overlap with apples at all.',
    expectedTimeSeconds: 25,
    tags: ['syllogism'],
  },
];
