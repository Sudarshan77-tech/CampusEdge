import { QuestionSeed } from './quant';

export const verbalQuestions: QuestionSeed[] = [
  // 1. Sentence Correction & Grammar
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Select the grammatically correct sentence:',
    options: [
      {
        key: 'A',
        text: 'Neither the manager nor the employees was present at the conference.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Neither the manager nor the employees were present at the conference.',
        isCorrect: true,
      },
      {
        key: 'C',
        text: 'Neither the manager or the employees were present at the conference.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Neither of the manager nor the employees were present at the conference.',
        isCorrect: false,
      },
    ],
    explanation:
      'In a "neither... nor" construction with compound subjects differing in number, the verb agrees with the closer subject ("employees", plural), requiring "were".',
    expectedTimeSeconds: 30,
    tags: ['grammar', 'subject-verb-agreement'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Identify the error in the underlined segment: "Each of the participants (A) have submitted (B) their proposal (C) before the deadline (D)."',
    options: [
      { key: 'A', text: 'Each of the participants', isCorrect: false },
      { key: 'B', text: 'have submitted', isCorrect: true },
      { key: 'C', text: 'their proposal', isCorrect: false },
      { key: 'D', text: 'before the deadline', isCorrect: false },
    ],
    explanation:
      '"Each" is a singular pronoun and takes a singular verb ("has submitted", not "have submitted").',
    expectedTimeSeconds: 35,
    tags: ['error-spotting', 'grammar'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Choose the correct preposition: "The committee agreed ______ the recommendations proposed by the auditor."',
    options: [
      { key: 'A', text: 'with', isCorrect: false },
      { key: 'B', text: 'to', isCorrect: true },
      { key: 'C', text: 'on', isCorrect: false },
      { key: 'D', text: 'for', isCorrect: false },
    ],
    explanation: 'One agrees *with* a person, but agrees *to* a proposal, plan, or recommendation.',
    expectedTimeSeconds: 20,
    tags: ['prepositions'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Identify the sentence with correct modifier placement:',
    options: [
      {
        key: 'A',
        text: 'Walking through the server room, the loud hum of cooling fans disturbed the engineer.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Walking through the server room, the engineer was disturbed by the loud hum of cooling fans.',
        isCorrect: true,
      },
      {
        key: 'C',
        text: 'The loud hum disturbed walking through the server room the engineer.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'The engineer was walking through the server room loud hum of fans.',
        isCorrect: false,
      },
    ],
    explanation:
      'In A, the participial phrase "Walking through the server room" modifies "the loud hum" (dangling modifier). In B, it correctly modifies "the engineer".',
    expectedTimeSeconds: 40,
    tags: ['modifiers', 'grammar'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Choose the grammatically sound sentence with subjunctive mood:',
    options: [
      {
        key: 'A',
        text: 'The architect recommended that the database was partitioned immediately.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'The architect recommended that the database be partitioned immediately.',
        isCorrect: true,
      },
      {
        key: 'C',
        text: 'The architect recommended that the database is partitioned immediately.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'The architect recommended that the database to be partitioned immediately.',
        isCorrect: false,
      },
    ],
    explanation:
      'Mandative subjunctive clauses following verbs like recommend, insist, or mandate require the bare subjunctive form ("be partitioned").',
    expectedTimeSeconds: 35,
    tags: ['subjunctive', 'grammar'],
  },

  // 2. Vocabulary in Context & Synonyms/Antonyms
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the closest synonym for "EPHEMERAL"?',
    options: [
      { key: 'A', text: 'Permanent', isCorrect: false },
      { key: 'B', text: 'Transitory', isCorrect: true },
      { key: 'C', text: 'Eternal', isCorrect: false },
      { key: 'D', text: 'Unbreakable', isCorrect: false },
    ],
    explanation: '"Ephemeral" means lasting for a very short time; fleeting or transitory.',
    expectedTimeSeconds: 20,
    tags: ['vocabulary', 'synonyms'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the antonym of "PRAGMATIC"?',
    options: [
      { key: 'A', text: 'Practical', isCorrect: false },
      { key: 'B', text: 'Idealistic', isCorrect: true },
      { key: 'C', text: 'Sensible', isCorrect: false },
      { key: 'D', text: 'Realistic', isCorrect: false },
    ],
    explanation:
      '"Pragmatic" means dealing with matters realistically and practically. Its opposite is "idealistic" or visionary without regard to practical realities.',
    expectedTimeSeconds: 25,
    tags: ['vocabulary', 'antonyms'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Choose the word that best fills the blank: "The distributed consensus algorithm is designed to remain ______ even when multiple network partitions occur."',
    options: [
      { key: 'A', text: 'tenuous', isCorrect: false },
      { key: 'B', text: 'resilient', isCorrect: true },
      { key: 'C', text: 'precarious', isCorrect: false },
      { key: 'D', text: 'fragile', isCorrect: false },
    ],
    explanation:
      '"Resilient" means able to withstand or recover quickly from difficult conditions, which fits network partition tolerance.',
    expectedTimeSeconds: 25,
    tags: ['vocabulary', 'sentence-completion'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the term "AMBIGUOUS" mean?',
    options: [
      { key: 'A', text: 'Crystal clear and definitive', isCorrect: false },
      { key: 'B', text: 'Open to more than one interpretation', isCorrect: true },
      { key: 'C', text: 'Extremely ambitious', isCorrect: false },
      { key: 'D', text: 'Completely incorrect', isCorrect: false },
    ],
    explanation: '"Ambiguous" means having more than one possible meaning; unclear or indefinite.',
    expectedTimeSeconds: 20,
    tags: ['vocabulary'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'What is the meaning of the word "EQUIVOCAL"?',
    options: [
      { key: 'A', text: 'Unequivocal and straightforward', isCorrect: false },
      { key: 'B', text: 'Intentionally vague or ambiguous', isCorrect: true },
      { key: 'C', text: 'Equally balanced', isCorrect: false },
      { key: 'D', text: 'Excessively vocal and loud', isCorrect: false },
    ],
    explanation:
      '"Equivocal" means open to two or more interpretations and usually used to mislead or confuse; ambiguous.',
    expectedTimeSeconds: 25,
    tags: ['vocabulary'],
  },

  // 3. Idioms & Phrasal Verbs
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What does the idiom "bite the bullet" mean?',
    options: [
      { key: 'A', text: 'To engage in dangerous combat', isCorrect: false },
      {
        key: 'B',
        text: 'To face an unavoidable, difficult situation with fortitude',
        isCorrect: true,
      },
      { key: 'C', text: 'To consume food hurriedly', isCorrect: false },
      { key: 'D', text: 'To make an irreversible mistake', isCorrect: false },
    ],
    explanation:
      '"Bite the bullet" means to endure a painful or undesirable situation that is seen as unavoidable.',
    expectedTimeSeconds: 20,
    tags: ['idioms'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the meaning of the phrasal verb "call off"?',
    options: [
      { key: 'A', text: 'To postpone', isCorrect: false },
      { key: 'B', text: 'To cancel', isCorrect: true },
      { key: 'C', text: 'To summon', isCorrect: false },
      { key: 'D', text: 'To review', isCorrect: false },
    ],
    explanation: '"Call off" means to cancel an event or arrangement.',
    expectedTimeSeconds: 15,
    tags: ['phrasal-verbs'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the idiom "burn the midnight oil" mean?',
    options: [
      { key: 'A', text: 'To waste resources recklessly', isCorrect: false },
      { key: 'B', text: 'To work or study late into the night', isCorrect: true },
      { key: 'C', text: 'To start a fire accidentally', isCorrect: false },
      { key: 'D', text: 'To arrive late for an appointment', isCorrect: false },
    ],
    explanation: '"Burn the midnight oil" means to read, study, or work late into the night.',
    expectedTimeSeconds: 15,
    tags: ['idioms'],
  },

  // 4. Para Jumbles (Sentence Rearrangement)
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Arrange the following sentences in a coherent logical paragraph:\n1. This microservices architecture allows autonomous deployment.\n2. In recent years, enterprise systems have migrated from monoliths to decoupled services.\n3. However, it introduces significant challenges in distributed transaction management.\n4. Each service is organized around specific business capabilities.',
    options: [
      { key: 'A', text: '2, 4, 1, 3', isCorrect: true },
      { key: 'B', text: '1, 2, 4, 3', isCorrect: false },
      { key: 'C', text: '2, 1, 3, 4', isCorrect: false },
      { key: 'D', text: '4, 2, 1, 3', isCorrect: false },
    ],
    explanation:
      'Sentence 2 introduces the transition from monoliths to decoupled services. Sentence 4 describes how each service is structured. Sentence 1 details the deployment benefit. Sentence 3 contrasts with the associated challenge using "However". Thus 2-4-1-3 is the logical flow.',
    expectedTimeSeconds: 60,
    tags: ['para-jumbles'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Arrange the sentences into a logical sequence:\nP. Cloud computing offers on-demand availability of computing system resources.\nQ. Without direct active management by the user, functions are maintained by providers.\nR. This eliminates the upfront capital expenditure for high-end server racks.\nS. Consequently, startups can achieve rapid time-to-market.',
    options: [
      { key: 'A', text: 'P, Q, R, S', isCorrect: true },
      { key: 'B', text: 'Q, P, S, R', isCorrect: false },
      { key: 'C', text: 'R, P, Q, S', isCorrect: false },
      { key: 'D', text: 'P, R, Q, S', isCorrect: false },
    ],
    explanation:
      'P introduces cloud computing. Q elaborates on its managed nature. R highlights the financial saving. S concludes with the business impact for startups.',
    expectedTimeSeconds: 45,
    tags: ['para-jumbles'],
  },

  // 5. Reading Comprehension & Inference
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Passage: "Open source software development relies on peer review and distributed collaboration. While proprietary vendors claim security through obscurity, Linus\'s Law posits that given enough eyeballs, all bugs are shallow. Yet, recent supply chain incidents like Heartbleed and Log4Shell proved that widespread usage does not guarantee continuous auditing."\nAccording to the passage, what is the main critique against the assumption in Linus\'s Law?',
    options: [
      { key: 'A', text: 'Proprietary software is inherently free of bugs', isCorrect: false },
      {
        key: 'B',
        text: 'Many people using software does not mean they are actively scrutinizing its code for flaws',
        isCorrect: true,
      },
      { key: 'C', text: 'Open source projects do not allow peer reviews', isCorrect: false },
      {
        key: 'D',
        text: 'Obscurity is proven to be the superior security paradigm',
        isCorrect: false,
      },
    ],
    explanation:
      'The passage explicitly notes that despite widespread usage, recent incidents showed that usage does not guarantee continuous auditing or inspection of the code.',
    expectedTimeSeconds: 60,
    tags: ['reading-comprehension', 'inference'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Based on the previous passage, what does the author imply by mentioning "Log4Shell"?',
    options: [
      { key: 'A', text: 'It was an obscure proprietary software', isCorrect: false },
      {
        key: 'B',
        text: 'It serves as empirical evidence that severe vulnerabilities can persist in ubiquitous open-source code',
        isCorrect: true,
      },
      { key: 'C', text: 'It had no effect on supply chain security', isCorrect: false },
      { key: 'D', text: "Linus's law was verified by it", isCorrect: false },
    ],
    explanation:
      "Log4Shell is cited as a supply chain incident demonstrating that bugs can linger undetected in widely used libraries despite Linus's Law.",
    expectedTimeSeconds: 45,
    tags: ['reading-comprehension'],
  },

  // 6. Cloze Test / Fill in the Blanks
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Choose the most appropriate pair of words: "The tech giant\'s decision to ______ its carbon emissions was ______ by environmentalists worldwide."',
    options: [
      { key: 'A', text: 'curb, lauded', isCorrect: true },
      { key: 'B', text: 'expand, condemned', isCorrect: false },
      { key: 'C', text: 'ignore, praised', isCorrect: false },
      { key: 'D', text: 'eliminate, criticized', isCorrect: false },
    ],
    explanation:
      '"Curb" (meaning reduce or restrain) emissions logically aligns with being "lauded" (praised) by environmentalists.',
    expectedTimeSeconds: 30,
    tags: ['cloze-test', 'vocabulary'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Select the option that correctly completes the sentence: "Despite working under ______ deadlines, the development team delivered an ______ software release."',
    options: [
      { key: 'A', text: 'lenient, mediocre', isCorrect: false },
      { key: 'B', text: 'stringent, impeccable', isCorrect: true },
      { key: 'C', text: 'flexible, defective', isCorrect: false },
      { key: 'D', text: 'moderate, faulty', isCorrect: false },
    ],
    explanation:
      '"Despite" indicates contrast. "Stringent" (strict/tight) deadlines contrasted with an "impeccable" (flawless) release creates the intended coherent meaning.',
    expectedTimeSeconds: 30,
    tags: ['cloze-test'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Choose the correct word: "The candidate spoke with such ______ that the entire selection panel was impressed by her clarity."',
    options: [
      { key: 'A', text: 'eloquence', isCorrect: true },
      { key: 'B', text: 'hesitance', isCorrect: false },
      { key: 'C', text: 'verbosity', isCorrect: false },
      { key: 'D', text: 'ambivalence', isCorrect: false },
    ],
    explanation:
      '"Eloquence" refers to fluent or persuasive speaking, which matches impressiveness and clarity.',
    expectedTimeSeconds: 20,
    tags: ['vocabulary'],
  },

  // Additional Verbal Questions across Core Placement Competencies
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Select the option with the correct active voice equivalent: "The critical security vulnerability was patched by the infrastructure engineering team."',
    options: [
      {
        key: 'A',
        text: 'The infrastructure engineering team patched the critical security vulnerability.',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'The infrastructure engineering team had patched the critical security vulnerability.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'The infrastructure engineering team has been patching the vulnerability.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'The vulnerability was being patched by the infrastructure team.',
        isCorrect: false,
      },
    ],
    explanation:
      'Simple past passive ("was patched") converts to simple past active ("patched") with the agent ("infrastructure engineering team") as the grammatical subject.',
    expectedTimeSeconds: 25,
    tags: ['active-passive-voice'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Select the correct indirect speech form of: He said, "I have been testing the payment gateway since morning."',
    options: [
      {
        key: 'A',
        text: 'He said that he was testing the payment gateway since morning.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'He said that he had been testing the payment gateway since morning.',
        isCorrect: true,
      },
      {
        key: 'C',
        text: 'He says that he had been testing the payment gateway since morning.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'He said that he is testing the payment gateway since morning.',
        isCorrect: false,
      },
    ],
    explanation:
      'In reported speech with past reporting verb ("said"), present perfect continuous ("have been testing") shifts to past perfect continuous ("had been testing").',
    expectedTimeSeconds: 30,
    tags: ['direct-indirect-speech'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Choose the word that is spelled correctly among the variants of "accommodation":',
    options: [
      { key: 'A', text: 'Accomodation', isCorrect: false },
      { key: 'B', text: 'Accommodation', isCorrect: true },
      { key: 'C', text: 'Acommodation', isCorrect: false },
      { key: 'D', text: 'Accommadation', isCorrect: false },
    ],
    explanation: "\"Accommodation\" is spelled with double 'c' and double 'm'.",
    expectedTimeSeconds: 15,
    tags: ['spelling'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Choose the word that is spelled correctly among the variants of "maintenance":',
    options: [
      { key: 'A', text: 'Maintanance', isCorrect: false },
      { key: 'B', text: 'Maintenance', isCorrect: true },
      { key: 'C', text: 'Maintenence', isCorrect: false },
      { key: 'D', text: 'Maintinence', isCorrect: false },
    ],
    explanation: 'The correct spelling is "Maintenance" (note the "ten" rather than "tain").',
    expectedTimeSeconds: 15,
    tags: ['spelling'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the meaning of the word "UBIQUITOUS"?',
    options: [
      { key: 'A', text: 'Extremely rare and endangered', isCorrect: false },
      { key: 'B', text: 'Present, appearing, or found everywhere', isCorrect: true },
      { key: 'C', text: 'Highly toxic and lethal', isCorrect: false },
      { key: 'D', text: 'Uncertain and dubious', isCorrect: false },
    ],
    explanation: '"Ubiquitous" means present or existing everywhere simultaneously.',
    expectedTimeSeconds: 20,
    tags: ['vocabulary'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Select the word that best completes the sentence: "The lead architect gave a ______ overview that covered both high-level design and low-level concurrency primitives."',
    options: [
      { key: 'A', text: 'superficial', isCorrect: false },
      { key: 'B', text: 'cursory', isCorrect: false },
      { key: 'C', text: 'comprehensive', isCorrect: true },
      { key: 'D', text: 'perfunctory', isCorrect: false },
    ],
    explanation:
      '"Comprehensive" means complete, including all or nearly all elements or aspects of something.',
    expectedTimeSeconds: 25,
    tags: ['vocabulary'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Choose the correct antonym for "METICULOUS":',
    options: [
      { key: 'A', text: 'Thorough', isCorrect: false },
      { key: 'B', text: 'Careless', isCorrect: true },
      { key: 'C', text: 'Diligent', isCorrect: false },
      { key: 'D', text: 'Precise', isCorrect: false },
    ],
    explanation:
      '"Meticulous" means showing great attention to detail; careful and precise. Its opposite is "careless" or sloppy.',
    expectedTimeSeconds: 15,
    tags: ['antonyms'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Identify the part of speech of the word "rapidly" in the sentence: "The microservice scaled rapidly during peak traffic."',
    options: [
      { key: 'A', text: 'Noun', isCorrect: false },
      { key: 'B', text: 'Adjective', isCorrect: false },
      { key: 'C', text: 'Adverb', isCorrect: true },
      { key: 'D', text: 'Verb', isCorrect: false },
    ],
    explanation:
      '"Rapidly" modifies the verb "scaled", describing how the scaling occurred. Hence it is an adverb.',
    expectedTimeSeconds: 15,
    tags: ['parts-of-speech'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Select the sentence that avoids tautology (needless repetition):',
    options: [
      { key: 'A', text: 'In my personal opinion, the latency is too high.', isCorrect: false },
      { key: 'B', text: 'The latency is too high in my opinion.', isCorrect: true },
      { key: 'C', text: 'They reverted back to the previous deployment.', isCorrect: false },
      { key: 'D', text: 'We gathered together for the daily standup.', isCorrect: false },
    ],
    explanation:
      '"Personal opinion", "revert back", and "gather together" are redundant redundancies. "The latency is too high in my opinion" is clean and non-tautological.',
    expectedTimeSeconds: 30,
    tags: ['tautology', 'style'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the meaning of the idiom "spill the beans"?',
    options: [
      { key: 'A', text: 'To waste food carelessly', isCorrect: false },
      { key: 'B', text: 'To disclose a secret prematurely', isCorrect: true },
      { key: 'C', text: 'To confess to a criminal act in court', isCorrect: false },
      { key: 'D', text: 'To drop fragile hardware', isCorrect: false },
    ],
    explanation:
      '"Spill the beans" is an idiom that means to reveal confidential information or a secret unintentionally or prematurely.',
    expectedTimeSeconds: 15,
    tags: ['idioms'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Choose the word that means "a person who opposes official policy, especially that of an authoritarian state":',
    options: [
      { key: 'A', text: 'Dissident', isCorrect: true },
      { key: 'B', text: 'Conformist', isCorrect: false },
      { key: 'C', text: 'Philanthropist', isCorrect: false },
      { key: 'D', text: 'Diplomat', isCorrect: false },
    ],
    explanation:
      'A dissident is a person who actively challenges or opposes official policy or the prevailing authority.',
    expectedTimeSeconds: 20,
    tags: ['one-word-substitution'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Select the option that best expresses the meaning of "tacit":',
    options: [
      { key: 'A', text: 'Understood or implied without being stated', isCorrect: true },
      { key: 'B', text: 'Explicitly declared in writing', isCorrect: false },
      { key: 'C', text: 'Loud and vociferous', isCorrect: false },
      { key: 'D', text: 'Highly tactical in gameplay', isCorrect: false },
    ],
    explanation:
      '"Tacit" means understood or implied without being stated directly (e.g., tacit agreement).',
    expectedTimeSeconds: 20,
    tags: ['vocabulary'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Identify the word with the correct spelling:',
    options: [
      { key: 'A', text: 'Privilege', isCorrect: true },
      { key: 'B', text: 'Priviledge', isCorrect: false },
      { key: 'C', text: 'Prevelege', isCorrect: false },
      { key: 'D', text: 'Privilige', isCorrect: false },
    ],
    explanation: 'The correct spelling is "Privilege" (no "d").',
    expectedTimeSeconds: 15,
    tags: ['spelling'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Choose the correct form to complete the conditional sentence: "If the load balancer ______ properly configured, the outage would not have occurred."',
    options: [
      { key: 'A', text: 'had been', isCorrect: true },
      { key: 'B', text: 'was', isCorrect: false },
      { key: 'C', text: 'has been', isCorrect: false },
      { key: 'D', text: 'would be', isCorrect: false },
    ],
    explanation:
      'Third conditional (counterfactual past): "If + past perfect (had been), ... would have + past participle".',
    expectedTimeSeconds: 25,
    tags: ['grammar', 'conditionals'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Select the synonym for "ANOMALOUS":',
    options: [
      { key: 'A', text: 'Abnormal', isCorrect: true },
      { key: 'B', text: 'Standard', isCorrect: false },
      { key: 'C', text: 'Typical', isCorrect: false },
      { key: 'D', text: 'Routine', isCorrect: false },
    ],
    explanation: '"Anomalous" means deviating from what is standard, normal, or expected.',
    expectedTimeSeconds: 20,
    tags: ['synonyms'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Choose the correct antonym for "BENEVOLENT":',
    options: [
      { key: 'A', text: 'Malevolent', isCorrect: true },
      { key: 'B', text: 'Generous', isCorrect: false },
      { key: 'C', text: 'Magnanimous', isCorrect: false },
      { key: 'D', text: 'Altruistic', isCorrect: false },
    ],
    explanation:
      '"Benevolent" means well-meaning and kindly. Its antonym is "Malevolent" (wishing or doing evil to others).',
    expectedTimeSeconds: 20,
    tags: ['antonyms'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which of the following sentences uses the semicolon correctly?',
    options: [
      {
        key: 'A',
        text: 'The microservices were deployed independently; therefore, downtime was minimized.',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'The microservices were deployed independently; and downtime was minimized.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Because the microservices were deployed; downtime was minimized.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Although the team worked hard; the deadline was missed.',
        isCorrect: false,
      },
    ],
    explanation:
      'A semicolon correctly links two independent clauses joined by a conjunctive adverb like "therefore" followed by a comma.',
    expectedTimeSeconds: 30,
    tags: ['punctuation'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Choose the word that best completes the sentence: "The developer showed an ______ ability to debug cryptic distributed trace failures within minutes."',
    options: [
      { key: 'A', text: 'uncanny', isCorrect: true },
      { key: 'B', text: 'untoward', isCorrect: false },
      { key: 'C', text: 'unwieldy', isCorrect: false },
      { key: 'D', text: 'untenable', isCorrect: false },
    ],
    explanation:
      '"Uncanny" means strange or mysterious, especially in an extraordinary or astonishingly perceptive way.',
    expectedTimeSeconds: 25,
    tags: ['vocabulary'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What does "to cut corners" mean?',
    options: [
      {
        key: 'A',
        text: 'To do something perfunctorily or badly to save money or time',
        isCorrect: true,
      },
      { key: 'B', text: 'To drive around corners safely', isCorrect: false },
      { key: 'C', text: 'To take the longest route possible', isCorrect: false },
      { key: 'D', text: 'To measure accurately', isCorrect: false },
    ],
    explanation:
      '"Cut corners" means to skip steps or compromise quality to complete a task faster or more cheaply.',
    expectedTimeSeconds: 20,
    tags: ['idioms'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Identify the error in the underlined segment: "No sooner had the cluster restarted (A) when (B) traffic spiked (C) unexpectedly (D)."',
    options: [
      { key: 'A', text: 'No sooner had the cluster restarted', isCorrect: false },
      { key: 'B', text: 'when', isCorrect: true },
      { key: 'C', text: 'traffic spiked', isCorrect: false },
      { key: 'D', text: 'unexpectedly', isCorrect: false },
    ],
    explanation:
      'The correlative conjunction for "No sooner" is "than", not "when" ("Scarcely... when", "Hardly... when", but "No sooner... than").',
    expectedTimeSeconds: 30,
    tags: ['error-spotting', 'conjunctions'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Choose the correct word: "The server room temperature remained ______ throughout the stress test."',
    options: [
      { key: 'A', text: 'stationary', isCorrect: false },
      { key: 'B', text: 'stationery', isCorrect: false },
      { key: 'C', text: 'stable', isCorrect: true },
      { key: 'D', text: 'staticity', isCorrect: false },
    ],
    explanation: '"Stable" correctly describes temperature that does not fluctuate or degrade.',
    expectedTimeSeconds: 20,
    tags: ['vocabulary'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Choose the correct homophone: "The security team conducted an in-depth audit of the ______ of the breach."',
    options: [
      { key: 'A', text: 'site', isCorrect: true },
      { key: 'B', text: 'sight', isCorrect: false },
      { key: 'C', text: 'cite', isCorrect: false },
      { key: 'D', text: 'citee', isCorrect: false },
    ],
    explanation:
      '"Site" refers to a location or place. "Sight" refers to vision. "Cite" means to quote or mention.',
    expectedTimeSeconds: 15,
    tags: ['homophones'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the antonym of "LUCID"?',
    options: [
      { key: 'A', text: 'Obscure', isCorrect: true },
      { key: 'B', text: 'Intelligible', isCorrect: false },
      { key: 'C', text: 'Luminous', isCorrect: false },
      { key: 'D', text: 'Articulate', isCorrect: false },
    ],
    explanation: '"Lucid" means clear and easy to understand. Its opposite is "obscure" or vague.',
    expectedTimeSeconds: 20,
    tags: ['antonyms'],
  },
  {
    topicSlug: 'verbal',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Choose the correct sentence:',
    options: [
      {
        key: 'A',
        text: 'Whom should I contact regarding the technical specification?',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Who should I contact regarding the technical specification?',
        isCorrect: false,
      },
      { key: 'C', text: 'Whomever is available should contact me.', isCorrect: false },
      { key: 'D', text: 'Whom is responsible for this deploy?', isCorrect: false },
    ],
    explanation:
      '"Whom" is the objective pronoun serving as the direct object of the verb "contact" ("I should contact whom").',
    expectedTimeSeconds: 30,
    tags: ['grammar', 'pronouns'],
  },
];
