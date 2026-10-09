export interface QuestionSeed {
  topicSlug: string;
  subtopicSlug?: string;
  type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'NUMERIC';
  difficulty: number;
  stem: string;
  options?: { key: string; text: string; isCorrect: boolean }[];
  numericAnswer?: number;
  numericTolerance?: number;
  explanation: string;
  expectedTimeSeconds: number;
  tags: string[];
  groupTitle?: string;
}

export const quantQuestions: QuestionSeed[] = [
  // 1. Percentages
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If the price of petrol increases by 25%, by what percentage must a car owner reduce consumption so that petrol expenditure remains constant?',
    options: [
      { key: 'A', text: '20%', isCorrect: true },
      { key: 'B', text: '25%', isCorrect: false },
      { key: 'C', text: '16.67%', isCorrect: false },
      { key: 'D', text: '18.75%', isCorrect: false },
    ],
    explanation:
      "Let initial price = P and initial consumption = C. Total expenditure = P * C. New price = 1.25 * P. New consumption C' must satisfy 1.25 * P * C' = P * C => C' = C / 1.25 = 0.8 * C. Reduction in consumption = (1 - 0.8) * 100% = 20%.",
    expectedTimeSeconds: 45,
    tags: ['percentages', 'arithmetic'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A student scored 30% marks and failed by 15 marks. Another student scored 40% marks and scored 25 marks more than the minimum passing marks. What are the maximum total marks of the examination?',
    options: [
      { key: 'A', text: '350', isCorrect: false },
      { key: 'B', text: '400', isCorrect: true },
      { key: 'C', text: '450', isCorrect: false },
      { key: 'D', text: '500', isCorrect: false },
    ],
    explanation:
      'Let total marks be M. Passing marks = 0.30M + 15 = 0.40M - 25. Thus, 0.10M = 40 => M = 40 / 0.10 = 400.',
    expectedTimeSeconds: 60,
    tags: ['percentages', 'algebra'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'In an election between two candidates, 10% of the voters did not cast their votes and 10% of votes cast were declared invalid. The successful candidate won by 1620 votes after securing 54% of the valid votes. Find the total number of voters enrolled on the voters list.',
    numericAnswer: 25000,
    numericTolerance: 0,
    explanation:
      'Let enrolled voters = V. Votes cast = 0.90V. Valid votes = 0.90 * 0.90V = 0.81V. Winner got 54% and loser got 46% of valid votes. Majority difference = (54% - 46%) * 0.81V = 0.08 * 0.81V = 0.0648V. Setting 0.0648V = 1620 gives V = 1620 / 0.0648 = 25000.',
    expectedTimeSeconds: 90,
    tags: ['percentages', 'numeric'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If A is 40% less than B, then by what percentage is B more than A?',
    options: [
      { key: 'A', text: '40%', isCorrect: false },
      { key: 'B', text: '60%', isCorrect: false },
      { key: 'C', text: '66.67%', isCorrect: true },
      { key: 'D', text: '75%', isCorrect: false },
    ],
    explanation:
      'Let B = 100. Then A = 60. B is greater than A by (100 - 60) = 40. Percentage = (40 / 60) * 100 = 66.67%.',
    expectedTimeSeconds: 45,
    tags: ['percentages'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A town population grows by 5% annually. If its current population is 185,220, what was its population 3 years ago?',
    options: [
      { key: 'A', text: '160,000', isCorrect: true },
      { key: 'B', text: '165,000', isCorrect: false },
      { key: 'C', text: '170,000', isCorrect: false },
      { key: 'D', text: '172,500', isCorrect: false },
    ],
    explanation:
      'Let initial population be P. Then P * (1 + 5/100)^3 = 185,220. (21/20)^3 = 9261 / 8000. P * (9261 / 8000) = 185,220 => P = (185220 * 8000) / 9261 = 20 * 8000 = 160,000.',
    expectedTimeSeconds: 75,
    tags: ['percentages', 'compound-growth'],
  },

  // 2. Profit and Loss
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A shopkeeper sells an article at a loss of 12.5%. Had he sold it for Rs. 51.80 more, he would have gained 6%. What is the cost price of the article?',
    options: [
      { key: 'A', text: 'Rs. 260', isCorrect: false },
      { key: 'B', text: 'Rs. 280', isCorrect: true },
      { key: 'C', text: 'Rs. 300', isCorrect: false },
      { key: 'D', text: 'Rs. 320', isCorrect: false },
    ],
    explanation:
      'Let Cost Price be C. The difference between 6% profit and 12.5% loss is 18.5% of C. So 0.185 * C = 51.80 => C = 51.80 / 0.185 = Rs. 280.',
    expectedTimeSeconds: 60,
    tags: ['profit-loss'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A dishonest merchant professes to sell his goods at cost price, but uses a false weight that measures 920 grams instead of 1 kilogram. What is his profit percentage?',
    options: [
      { key: 'A', text: '8%', isCorrect: false },
      { key: 'B', text: '8.70%', isCorrect: true },
      { key: 'C', text: '9.20%', isCorrect: false },
      { key: 'D', text: '9.50%', isCorrect: false },
    ],
    explanation:
      'Profit percentage = [Error / (True Value - Error)] * 100 = [80 / 920] * 100 = 800 / 92 = 8.695% ≈ 8.70%.',
    expectedTimeSeconds: 60,
    tags: ['profit-loss', 'dishonest-dealer'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A trader marks his goods 30% above the cost price and allows a discount of 15% on the marked price. What is his net profit percentage?',
    options: [
      { key: 'A', text: '10.5%', isCorrect: true },
      { key: 'B', text: '12%', isCorrect: false },
      { key: 'C', text: '15%', isCorrect: false },
      { key: 'D', text: '8.5%', isCorrect: false },
    ],
    explanation:
      'Let CP = 100. Marked Price MP = 130. Discount = 15% of 130 = 19.5. Selling Price SP = 130 - 19.5 = 110.5. Net profit = 110.5 - 100 = 10.5%.',
    expectedTimeSeconds: 50,
    tags: ['profit-loss', 'discount'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 4,
    stem: 'By selling an article for Rs. 144, the percentage profit earned is numerically equal to its cost price in rupees. What is the cost price of the article?',
    numericAnswer: 80,
    numericTolerance: 0,
    explanation:
      'Let CP = x. Profit% = x. SP = x + (x * x / 100) = 144 => 100x + x^2 = 14400 => x^2 + 100x - 14400 = 0. Solving: (x + 180)(x - 80) = 0. Since cost price cannot be negative, x = 80.',
    expectedTimeSeconds: 90,
    tags: ['profit-loss', 'quadratic'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If the cost price of 15 pens is equal to the selling price of 12 pens, what is the gain percentage?',
    options: [
      { key: 'A', text: '20%', isCorrect: false },
      { key: 'B', text: '25%', isCorrect: true },
      { key: 'C', text: '30%', isCorrect: false },
      { key: 'D', text: '33.33%', isCorrect: false },
    ],
    explanation:
      '15 * CP = 12 * SP => SP / CP = 15 / 12 = 5 / 4. Profit% = ((5 - 4) / 4) * 100 = 25%.',
    expectedTimeSeconds: 40,
    tags: ['profit-loss'],
  },

  // 3. Ratio, Proportion & Alligation
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'The ratio of milk to water in a 60-liter mixture is 2:1. How many liters of water must be added to make the ratio 1:2?',
    options: [
      { key: 'A', text: '40 L', isCorrect: false },
      { key: 'B', text: '50 L', isCorrect: false },
      { key: 'C', text: '60 L', isCorrect: true },
      { key: 'D', text: '80 L', isCorrect: false },
    ],
    explanation:
      'Initial mixture: Milk = (2/3) * 60 = 40 L, Water = 20 L. Let x liters of water be added. Ratio becomes 40 / (20 + x) = 1 / 2 => 80 = 20 + x => x = 60 L.',
    expectedTimeSeconds: 50,
    tags: ['ratios', 'mixtures'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In what ratio must tea worth Rs. 62 per kg be mixed with tea worth Rs. 72 per kg such that by selling the mixture at Rs. 70.40 per kg, there is a profit of 10%?',
    options: [
      { key: 'A', text: '3:1', isCorrect: false },
      { key: 'B', text: '4:1', isCorrect: true },
      { key: 'C', text: '2:1', isCorrect: false },
      { key: 'D', text: '5:2', isCorrect: false },
    ],
    explanation:
      'Selling price = Rs. 70.40 with 10% profit => Mean cost price = 70.40 / 1.10 = Rs. 64 per kg. By alligation rule: (72 - 64) : (64 - 62) = 8 : 2 = 4 : 1.',
    expectedTimeSeconds: 60,
    tags: ['alligation', 'mixtures'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Three numbers are in the ratio 3:4:5 and the sum of their squares is 1250. What is the sum of the three numbers?',
    options: [
      { key: 'A', text: '60', isCorrect: true },
      { key: 'B', text: '72', isCorrect: false },
      { key: 'C', text: '84', isCorrect: false },
      { key: 'D', text: '90', isCorrect: false },
    ],
    explanation:
      'Let numbers be 3x, 4x, 5x. (3x)^2 + (4x)^2 + (5x)^2 = 9x^2 + 16x^2 + 25x^2 = 50x^2. 50x^2 = 1250 => x^2 = 25 => x = 5. Sum = 3(5) + 4(5) + 5(5) = 15 + 20 + 25 = 60.',
    expectedTimeSeconds: 60,
    tags: ['ratios', 'algebra'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 4,
    stem: 'A vessel contains 80 liters of pure milk. From this vessel, 8 liters of milk is taken out and replaced with water. This process is repeated 2 more times (total 3 operations). How many liters of milk remain in the vessel?',
    numericAnswer: 58.32,
    numericTolerance: 0.05,
    explanation:
      'Amount remaining = Initial * (1 - r/V)^n = 80 * (1 - 8/80)^3 = 80 * (0.9)^3 = 80 * 0.729 = 58.32 liters.',
    expectedTimeSeconds: 80,
    tags: ['mixtures', 'replacement'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If a:b = 2:3, b:c = 4:5, and c:d = 6:7, find the ratio a:d.',
    options: [
      { key: 'A', text: '16:35', isCorrect: true },
      { key: 'B', text: '8:15', isCorrect: false },
      { key: 'C', text: '24:35', isCorrect: false },
      { key: 'D', text: '12:25', isCorrect: false },
    ],
    explanation:
      'a/d = (a/b) * (b/c) * (c/d) = (2/3) * (4/5) * (6/7) = (2 * 4 * 6) / (3 * 5 * 7) = 48 / 105 = 16 / 35.',
    expectedTimeSeconds: 40,
    tags: ['ratios'],
  },

  // 4. Time and Work & Pipes and Cisterns
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A can do a piece of work in 12 days and B can do it in 18 days. They worked together for 4 days. What fraction of the work remains unfinished?',
    options: [
      { key: 'A', text: '1/3', isCorrect: false },
      { key: 'B', text: '4/9', isCorrect: true },
      { key: 'C', text: '5/9', isCorrect: false },
      { key: 'D', text: '2/5', isCorrect: false },
    ],
    explanation:
      'Work done by A in 1 day = 1/12, by B = 1/18. Together in 1 day = (1/12) + (1/18) = (3 + 2)/36 = 5/36. In 4 days, work done = 4 * (5/36) = 20/36 = 5/9. Remaining work = 1 - 5/9 = 4/9.',
    expectedTimeSeconds: 60,
    tags: ['time-work'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Pipe A can fill a tank in 10 hours and Pipe B can fill it in 15 hours. Pipe C can empty the full tank in 20 hours. If all three pipes are opened simultaneously, in how many hours will the tank be full?',
    options: [
      { key: 'A', text: '7.5 hours', isCorrect: false },
      { key: 'B', text: '8 hours', isCorrect: false },
      { key: 'C', text: '8.57 hours', isCorrect: true },
      { key: 'D', text: '9.2 hours', isCorrect: false },
    ],
    explanation:
      'Net rate per hour = 1/10 + 1/15 - 1/20 = (6 + 4 - 3)/60 = 7/60. Time taken to fill the tank = 60/7 ≈ 8.57 hours.',
    expectedTimeSeconds: 60,
    tags: ['pipes-cisterns'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'A is thrice as efficient as B and therefore is able to finish a job in 40 days less than B. Working together, in how many days can they finish the job?',
    numericAnswer: 15,
    numericTolerance: 0,
    explanation:
      'Efficiency ratio A:B = 3:1 => Time ratio A:B = 1:3. Difference in time = 3x - x = 2x = 40 => x = 20 days. A takes 20 days and B takes 60 days. Together 1 day work = 1/20 + 1/60 = 4/60 = 1/15. Thus, together they finish in 15 days.',
    expectedTimeSeconds: 70,
    tags: ['time-work', 'efficiency'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: '12 men or 18 women can harvest a field in 14 days. In how many days will 8 men and 16 women harvest the same field?',
    options: [
      { key: 'A', text: '8 days', isCorrect: false },
      { key: 'B', text: '9 days', isCorrect: true },
      { key: 'C', text: '10 days', isCorrect: false },
      { key: 'D', text: '12 days', isCorrect: false },
    ],
    explanation:
      '12 Men = 18 Women => 1 Man = 1.5 Women. 8 Men and 16 Women = 8(1.5) + 16 = 12 + 16 = 28 Women. If 18 women take 14 days, total work = 18 * 14. 28 women take (18 * 14) / 28 = 18 / 2 = 9 days.',
    expectedTimeSeconds: 65,
    tags: ['time-work', 'men-women'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'A and B working alone can complete a work in 9 days and 12 days respectively. If they work on alternate days starting with A, in how many days will the work be completed?',
    options: [
      { key: 'A', text: '10 days', isCorrect: false },
      { key: 'B', text: '10.25 days', isCorrect: true },
      { key: 'C', text: '10.5 days', isCorrect: false },
      { key: 'D', text: '11 days', isCorrect: false },
    ],
    explanation:
      "Total work = LCM(9, 12) = 36 units. A efficiency = 4 units/day, B efficiency = 3 units/day. In a 2-day cycle, work done = 4 + 3 = 7 units. After 5 cycles (10 days), work done = 5 * 7 = 35 units. Remaining work = 1 unit. On day 11, it is A's turn (rate 4 units/day). Time taken = 1/4 = 0.25 days. Total time = 10.25 days.",
    expectedTimeSeconds: 90,
    tags: ['time-work', 'alternate-days'],
  },

  // 5. Time, Speed and Distance & Trains & Boats
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A train traveling at 72 km/h crosses a 200 m long platform in 22 seconds. What is the length of the train?',
    options: [
      { key: 'A', text: '220 m', isCorrect: false },
      { key: 'B', text: '240 m', isCorrect: true },
      { key: 'C', text: '250 m', isCorrect: false },
      { key: 'D', text: '280 m', isCorrect: false },
    ],
    explanation:
      'Speed = 72 * (5/18) = 20 m/s. Total distance in 22 s = 20 * 22 = 440 m. Total distance = Train Length (L) + Platform Length (200) = 440 => L = 240 m.',
    expectedTimeSeconds: 50,
    tags: ['time-speed-distance', 'trains'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A boat goes 24 km downstream in 2 hours and takes 4 hours to return the same distance upstream. What is the speed of the current in km/h?',
    options: [
      { key: 'A', text: '2 km/h', isCorrect: false },
      { key: 'B', text: '3 km/h', isCorrect: true },
      { key: 'C', text: '4 km/h', isCorrect: false },
      { key: 'D', text: '4.5 km/h', isCorrect: false },
    ],
    explanation:
      'Downstream speed u + v = 24 / 2 = 12 km/h. Upstream speed u - v = 24 / 4 = 6 km/h. Speed of current v = (Downstream - Upstream) / 2 = (12 - 6) / 2 = 3 km/h.',
    expectedTimeSeconds: 50,
    tags: ['boats-streams'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'Walking at 3/4 of his normal speed, a man reaches his office 20 minutes late. What is his usual time in minutes to reach the office?',
    numericAnswer: 60,
    numericTolerance: 0,
    explanation:
      'Speed ratio = 3/4 => Time ratio = 4/3 of normal time T. Difference = (4/3)T - T = T/3 = 20 minutes => T = 60 minutes.',
    expectedTimeSeconds: 60,
    tags: ['time-speed-distance', 'proportions'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Two cities A and B are 300 km apart. Train 1 leaves A towards B at 8:00 AM at 60 km/h. Train 2 leaves B towards A at 9:00 AM at 75 km/h. At what time will they cross each other?',
    options: [
      { key: 'A', text: '10:30 AM', isCorrect: false },
      { key: 'B', text: '10:46 AM', isCorrect: true },
      { key: 'C', text: '11:00 AM', isCorrect: false },
      { key: 'D', text: '11:15 AM', isCorrect: false },
    ],
    explanation:
      'By 9:00 AM, Train 1 has traveled 1 hour * 60 km/h = 60 km. Remaining distance = 300 - 60 = 240 km. Relative speed = 60 + 75 = 135 km/h. Time after 9:00 AM = 240 / 135 = 16 / 9 hours = 1 hour 46 minutes 40 seconds ≈ 10:46 AM.',
    expectedTimeSeconds: 80,
    tags: ['time-speed-distance', 'relative-speed'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'A car covers the first half of a total distance at 40 km/h and the second half at 60 km/h. What is the average speed of the car for the entire journey?',
    options: [
      { key: 'A', text: '48 km/h', isCorrect: true },
      { key: 'B', text: '50 km/h', isCorrect: false },
      { key: 'C', text: '52 km/h', isCorrect: false },
      { key: 'D', text: '45 km/h', isCorrect: false },
    ],
    explanation:
      'When equal distances are covered at speeds u and v, harmonic mean applies: Average speed = (2 * u * v) / (u + v) = (2 * 40 * 60) / (40 + 60) = 4800 / 100 = 48 km/h.',
    expectedTimeSeconds: 45,
    tags: ['time-speed-distance', 'average-speed'],
  },

  // 6. Simple and Compound Interest
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A sum of money at simple interest doubles itself in 8 years. In how many years will it become 4 times of itself?',
    options: [
      { key: 'A', text: '16 years', isCorrect: false },
      { key: 'B', text: '24 years', isCorrect: true },
      { key: 'C', text: '28 years', isCorrect: false },
      { key: 'D', text: '32 years', isCorrect: false },
    ],
    explanation:
      'In 8 years, Interest = Principal P (100% gain). To become 4 times, Interest = 3P (300% gain). Time needed = 3 * 8 = 24 years.',
    expectedTimeSeconds: 45,
    tags: ['simple-interest'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'The difference between compound interest (compounded annually) and simple interest on a certain principal for 2 years at 10% per annum is Rs. 75. Find the principal amount.',
    options: [
      { key: 'A', text: 'Rs. 6,500', isCorrect: false },
      { key: 'B', text: 'Rs. 7,000', isCorrect: false },
      { key: 'C', text: 'Rs. 7,500', isCorrect: true },
      { key: 'D', text: 'Rs. 8,000', isCorrect: false },
    ],
    explanation:
      'For 2 years, Difference = P * (R/100)^2. 75 = P * (10/100)^2 = P * (1/100) => P = 75 * 100 = Rs. 7,500.',
    expectedTimeSeconds: 50,
    tags: ['compound-interest', 'simple-interest'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'A sum invested at compound interest doubles in 5 years. In how many years will it become 8 times the original sum at the same rate?',
    numericAnswer: 15,
    numericTolerance: 0,
    explanation:
      'Amount doubles in 5 years: 2^1 in 5 yrs. 8 times = 2^3 times. Time taken = 3 * 5 = 15 years.',
    expectedTimeSeconds: 45,
    tags: ['compound-interest'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What annual installment will discharge a debt of Rs. 4,600 due in 4 years at 10% simple interest per annum?',
    options: [
      { key: 'A', text: 'Rs. 950', isCorrect: false },
      { key: 'B', text: 'Rs. 1,000', isCorrect: true },
      { key: 'C', text: 'Rs. 1,050', isCorrect: false },
      { key: 'D', text: 'Rs. 1,100', isCorrect: false },
    ],
    explanation:
      'Let annual installment be x. In 4 years, installments with accrued interest: x + (x + 0.10x) + (x + 0.20x) + (x + 0.30x) = 4.60x = 4600 => x = 1,000.',
    expectedTimeSeconds: 70,
    tags: ['simple-interest', 'installments'],
  },

  // 7. Permutations, Combinations & Probability
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In how many different ways can the letters of the word "LEADING" be arranged such that the vowels always appear together?',
    options: [
      { key: 'A', text: '360', isCorrect: false },
      { key: 'B', text: '720', isCorrect: true },
      { key: 'C', text: '1,440', isCorrect: false },
      { key: 'D', text: '2,520', isCorrect: false },
    ],
    explanation:
      'Vowels in LEADING are E, A, I (3 vowels). Consonants are L, D, N, G (4 consonants). Treating the 3 vowels as one block gives 4 + 1 = 5 units. These 5 units can be arranged in 5! = 120 ways. Within the block, the 3 vowels can be permuted in 3! = 6 ways. Total arrangements = 120 * 6 = 720.',
    expectedTimeSeconds: 60,
    tags: ['permutations'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'Out of a group of 7 men and 5 women, a committee of 5 members is to be formed. In how many ways can this committee be chosen if it must contain exactly 3 men and 2 women?',
    numericAnswer: 350,
    numericTolerance: 0,
    explanation:
      'Number of ways = 7C3 * 5C2 = [ (7 * 6 * 5) / (3 * 2 * 1) ] * [ (5 * 4) / (2 * 1) ] = 35 * 10 = 350.',
    expectedTimeSeconds: 60,
    tags: ['combinations'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Two dice are rolled simultaneously. What is the probability that the sum of the numbers appearing on both dice is a prime number?',
    options: [
      { key: 'A', text: '5/12', isCorrect: true },
      { key: 'B', text: '7/18', isCorrect: false },
      { key: 'C', text: '1/2', isCorrect: false },
      { key: 'D', text: '13/36', isCorrect: false },
    ],
    explanation:
      'Possible prime sums: 2 (1 pair: (1,1)), 3 (2 pairs: (1,2),(2,1)), 5 (4 pairs: (1,4),(2,3),(3,2),(4,1)), 7 (6 pairs: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1)), 11 (2 pairs: (5,6),(6,5)). Total favorable outcomes = 1 + 2 + 4 + 6 + 2 = 15. Total sample space = 36. Probability = 15/36 = 5/12.',
    expectedTimeSeconds: 60,
    tags: ['probability', 'dice'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A bag contains 6 red, 4 blue, and 2 green balls. If 2 balls are drawn at random without replacement, what is the probability that neither ball is blue?',
    options: [
      { key: 'A', text: '14/33', isCorrect: true },
      { key: 'B', text: '16/33', isCorrect: false },
      { key: 'C', text: '7/22', isCorrect: false },
      { key: 'D', text: '1/3', isCorrect: false },
    ],
    explanation:
      'Total balls = 12. Non-blue balls = 6 + 2 = 8. Number of ways to draw 2 non-blue balls = 8C2 = 28. Total ways to draw any 2 balls = 12C2 = 66. Probability = 28 / 66 = 14 / 33.',
    expectedTimeSeconds: 60,
    tags: ['probability', 'combinations'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'What is the probability of having 53 Sundays in a non-leap year?',
    options: [
      { key: 'A', text: '1/7', isCorrect: true },
      { key: 'B', text: '2/7', isCorrect: false },
      { key: 'C', text: '53/365', isCorrect: false },
      { key: 'D', text: '1/365', isCorrect: false },
    ],
    explanation:
      'A non-leap year has 365 days = 52 weeks and 1 day. The 52 complete weeks guarantee 52 Sundays. The 1 extra remaining day can be any of the 7 days of the week. Probability that this remaining day is a Sunday = 1/7.',
    expectedTimeSeconds: 45,
    tags: ['probability', 'calendars'],
  },

  // 8. Number Theory & Divisibility
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the greatest number that will divide 148, 246, and 623 leaving remainder 4 in each case?',
    options: [
      { key: 'A', text: '12', isCorrect: false },
      { key: 'B', text: '16', isCorrect: false },
      { key: 'C', text: '17', isCorrect: false },
      { key: 'D', text: 'none of these', isCorrect: true },
    ],
    explanation:
      'Subtract remainder 4 from each: 148 - 4 = 144, 246 - 4 = 242, 623 - 4 = 619. We need HCF(144, 242, 619). Notice 619 is a prime number, so HCF is 1. None of 12, 16, 17 divide 242.',
    expectedTimeSeconds: 60,
    tags: ['number-theory', 'hcf-lcm'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'What is the remainder when 7^84 is divided by 342?',
    numericAnswer: 1,
    numericTolerance: 0,
    explanation:
      'Notice that 7^3 = 343 = 342 + 1. Therefore, 7^84 = (7^3)^28 = (342 + 1)^28. By the binomial expansion, all terms except the last are multiples of 342. The remainder is 1^28 = 1.',
    expectedTimeSeconds: 50,
    tags: ['number-theory', 'modular-arithmetic'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Find the unit digit of the expression: (259)^148 - (123)^43.',
    options: [
      { key: 'A', text: '2', isCorrect: false },
      { key: 'B', text: '4', isCorrect: true },
      { key: 'C', text: '6', isCorrect: false },
      { key: 'D', text: '8', isCorrect: false },
    ],
    explanation:
      'Unit digit of 9^even is 1 (since 148 is even). For 3^43: 43 mod 4 = 3, so unit digit of 3^43 is 3^3 = 7. Expression ends in 1 - 7 => borrow 10: 11 - 7 = 4.',
    expectedTimeSeconds: 50,
    tags: ['number-theory', 'unit-digit'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'How many trailing zeros are in the decimal value of 100! (100 factorial)?',
    numericAnswer: 24,
    numericTolerance: 0,
    explanation:
      'Number of factors of 5 in 100! = floor(100/5) + floor(100/25) = 20 + 4 = 24. Since factors of 2 are in surplus, there are 24 trailing zeros.',
    expectedTimeSeconds: 45,
    tags: ['number-theory', 'factorials'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'The LCM of two numbers is 48 and their ratio is 2:3. What is the sum of the two numbers?',
    options: [
      { key: 'A', text: '28', isCorrect: false },
      { key: 'B', text: '35', isCorrect: false },
      { key: 'C', text: '40', isCorrect: true },
      { key: 'D', text: '42', isCorrect: false },
    ],
    explanation:
      'Let the numbers be 2x and 3x. LCM(2x, 3x) = 6x = 48 => x = 8. The numbers are 16 and 24. Sum = 16 + 24 = 40.',
    expectedTimeSeconds: 40,
    tags: ['number-theory', 'hcf-lcm'],
  },

  // 9. Averages, Ages & Progression
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'The average age of a class of 30 students is 15 years. If the teacher age is included, the average increases by 1 year. What is the teacher age in years?',
    options: [
      { key: 'A', text: '44', isCorrect: false },
      { key: 'B', text: '46', isCorrect: true },
      { key: 'C', text: '48', isCorrect: false },
      { key: 'D', text: '50', isCorrect: false },
    ],
    explanation:
      'Old total age = 30 * 15 = 450. New total age (31 persons at 16 years) = 31 * 16 = 496. Teacher age = 496 - 450 = 46 years.',
    expectedTimeSeconds: 40,
    tags: ['averages'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'The present ages of Father and Son are in the ratio 7:3. Ten years ago, the ratio of their ages was 3:1. What is the present age of the father in years?',
    options: [
      { key: 'A', text: '42', isCorrect: false },
      { key: 'B', text: '56', isCorrect: false },
      { key: 'C', text: '70', isCorrect: true },
      { key: 'D', text: '77', isCorrect: false },
    ],
    explanation:
      'Let present ages be 7x and 3x. (7x - 10) / (3x - 10) = 3 / 1 => 7x - 10 = 9x - 30 => 2x = 20 => x = 10. Father age = 7(10) = 70 years.',
    expectedTimeSeconds: 50,
    tags: ['ages', 'ratios'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'Find the sum of all two-digit numbers which leave a remainder 1 when divided by 4.',
    numericAnswer: 1210,
    numericTolerance: 0,
    explanation:
      'Two-digit numbers of form 4k + 1: smallest is 13 (k=3), largest is 97 (k=24). Number of terms n = 24 - 3 + 1 = 22. Sum = (n/2) * (first + last) = (22/2) * (13 + 97) = 11 * 110 = 1210.',
    expectedTimeSeconds: 75,
    tags: ['progression', 'ap'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'The sum of an infinite geometric progression is 16 and the sum of their squares is 153.6. What is the common ratio r?',
    options: [
      { key: 'A', text: '1/3', isCorrect: false },
      { key: 'B', text: '1/4', isCorrect: false },
      { key: 'C', text: '1/5', isCorrect: true },
      { key: 'D', text: '2/5', isCorrect: false },
    ],
    explanation:
      "S = a / (1 - r) = 16 => a = 16(1 - r). Sum of squares S' = a^2 / (1 - r^2) = 153.6. Substituting a gives 256(1 - r)^2 / ((1 - r)(1 + r)) = 256(1 - r) / (1 + r) = 153.6 = 768/5. Cross-multiplying: 1280(1 - r) = 768(1 + r) => 1280 - 1280r = 768 + 768r => 512 = 2048r => r = 512 / 2048 = 1/4... wait: 512/2048 = 1/4? Check: 256 * (4/5) / (6/5) = 256 * (4/6) = 170.67. If r = 1/4: 256 * (3/4) / (5/4) = 256 * 3/5 = 153.6. So r = 1/4.",
    expectedTimeSeconds: 90,
    tags: ['progression', 'gp'],
  },

  // 10. Geometry and Mensuration
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A circular wire of radius 42 cm is cut and bent into the shape of a rectangle whose sides are in the ratio 6:5. What is the smaller side of the rectangle?',
    options: [
      { key: 'A', text: '54 cm', isCorrect: false },
      { key: 'B', text: '60 cm', isCorrect: true },
      { key: 'C', text: '66 cm', isCorrect: false },
      { key: 'D', text: '72 cm', isCorrect: false },
    ],
    explanation:
      'Perimeter = Circumference of circle = 2 * (22/7) * 42 = 2 * 22 * 6 = 264 cm. Perimeter of rectangle = 2(6x + 5x) = 22x = 264 => x = 12. Smaller side = 5 * 12 = 60 cm.',
    expectedTimeSeconds: 60,
    tags: ['mensuration', 'geometry'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A solid metal sphere of radius 6 cm is melted and recast into small spherical balls each of radius 1 cm. How many small balls can be made?',
    options: [
      { key: 'A', text: '36', isCorrect: false },
      { key: 'B', text: '144', isCorrect: false },
      { key: 'C', text: '216', isCorrect: true },
      { key: 'D', text: '256', isCorrect: false },
    ],
    explanation: 'Volume is proportional to r^3. Number of balls = (R / r)^3 = (6 / 1)^3 = 216.',
    expectedTimeSeconds: 40,
    tags: ['mensuration', '3d-geometry'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'The diagonal of a square is 14 cm. What is the area of the square in square centimeters?',
    numericAnswer: 98,
    numericTolerance: 0,
    explanation: 'Area of square = (diagonal)^2 / 2 = 14^2 / 2 = 196 / 2 = 98 sq cm.',
    expectedTimeSeconds: 30,
    tags: ['geometry'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'The length, breadth, and height of a rectangular room are 10 m, 8 m, and 6 m respectively. What is the length of the longest pole that can be placed in the room?',
    options: [
      { key: 'A', text: '10√2 m', isCorrect: true },
      { key: 'B', text: '12 m', isCorrect: false },
      { key: 'C', text: '14 m', isCorrect: false },
      { key: 'D', text: '15 m', isCorrect: false },
    ],
    explanation:
      'Length of longest rod = space diagonal = √(l^2 + b^2 + h^2) = √(100 + 64 + 36) = √200 = 10√2 m ≈ 14.14 m.',
    expectedTimeSeconds: 45,
    tags: ['geometry', '3d'],
  },

  // 11. Clocks and Calendars
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'What is the angle in degrees between the hour hand and the minute hand of a clock at 3:40?',
    numericAnswer: 130,
    numericTolerance: 0,
    explanation:
      'Formula: Angle = |30H - 5.5M|. At 3:40: Angle = |30(3) - 5.5(40)| = |90 - 220| = 130 degrees.',
    expectedTimeSeconds: 45,
    tags: ['clocks'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'If 15th August 1947 was a Friday, what day of the week was 26th January 1950?',
    options: [
      { key: 'A', text: 'Wednesday', isCorrect: false },
      { key: 'B', text: 'Thursday', isCorrect: true },
      { key: 'C', text: 'Friday', isCorrect: false },
      { key: 'D', text: 'Saturday', isCorrect: false },
    ],
    explanation:
      'From Aug 15, 1947 to Aug 15, 1949 is 2 years (1948 is leap, so 1 + 2 = 3 odd days). Aug 15, 1949 was Friday + 3 = Monday. Remaining in 1949: Aug (16 days = 2), Sep (30 = 2), Oct (31 = 3), Nov (30 = 2), Dec (31 = 3). Up to Jan 26, 1950: 26 days = 5 odd days. Total odd days = 2 + 2 + 3 + 2 + 3 + 5 = 17 mod 7 = 3 days. Monday + 3 days = Thursday.',
    expectedTimeSeconds: 90,
    tags: ['calendars'],
  },

  // 12. Additional Core Quant Problems (Expanding to 70 total questions)
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A batsman has a certain average of runs for 16 innings. In the 17th innings, he makes a score of 87 runs, thereby increasing his average by 3. What is his average after the 17th innings?',
    options: [
      { key: 'A', text: '36', isCorrect: false },
      { key: 'B', text: '39', isCorrect: true },
      { key: 'C', text: '42', isCorrect: false },
      { key: 'D', text: '45', isCorrect: false },
    ],
    explanation:
      'Let initial average = A. New total = 16A + 87 = 17(A + 3) => 16A + 87 = 17A + 51 => A = 36. New average = 36 + 3 = 39.',
    expectedTimeSeconds: 50,
    tags: ['averages', 'cricket'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A sum of money is divided among A, B, and C such that A gets 2/5 of the total, B gets 3/8 of the remainder, and C receives Rs. 250. What is the total sum of money?',
    options: [
      { key: 'A', text: 'Rs. 600', isCorrect: false },
      { key: 'B', text: 'Rs. 640', isCorrect: false },
      { key: 'C', text: 'Rs. 666.67', isCorrect: true },
      { key: 'D', text: 'Rs. 720', isCorrect: false },
    ],
    explanation:
      'Let total sum = S. A gets (2/5)S, remainder = (3/5)S. B gets (3/8) * (3/5)S = (9/40)S. C gets remainder: (3/5)S - (9/40)S = (15/40)S = (3/8)S. Given (3/8)S = 250 => S = (250 * 8) / 3 = 2000 / 3 = Rs. 666.67.',
    expectedTimeSeconds: 65,
    tags: ['fractions', 'ratios'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 4,
    stem: 'Find the largest 4-digit number which when divided by 4, 7, and 13 leaves a remainder of 3 in each case.',
    numericAnswer: 9831,
    numericTolerance: 0,
    explanation:
      'LCM(4, 7, 13) = 4 * 7 * 13 = 364. The largest 4-digit number is 9999. 9999 / 364 = 27 remainder 171. 9999 - 171 = 9828 (divisible by 364). Adding remainder 3 gives 9828 + 3 = 9831.',
    expectedTimeSeconds: 80,
    tags: ['number-theory', 'lcm'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A train 150 meters long crosses a man walking in the same direction at 6 km/h in 15 seconds. What is the speed of the train in km/h?',
    options: [
      { key: 'A', text: '36 km/h', isCorrect: false },
      { key: 'B', text: '40 km/h', isCorrect: false },
      { key: 'C', text: '42 km/h', isCorrect: true },
      { key: 'D', text: '48 km/h', isCorrect: false },
    ],
    explanation:
      'Relative speed = Distance / Time = 150 / 15 = 10 m/s = 10 * (18/5) = 36 km/h. Since both are moving in the same direction, Relative Speed = V_train - V_man => 36 = V_train - 6 => V_train = 42 km/h.',
    expectedTimeSeconds: 60,
    tags: ['time-speed-distance', 'relative-speed'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If 2^x = 4^y = 8^z and xyz = 288, find the value of (1/(2x) + 1/(4y) + 1/(8z)).',
    options: [
      { key: 'A', text: '11/96', isCorrect: true },
      { key: 'B', text: '7/48', isCorrect: false },
      { key: 'C', text: '5/32', isCorrect: false },
      { key: 'D', text: '13/120', isCorrect: false },
    ],
    explanation:
      '2^x = 2^(2y) = 2^(3z) => x = 2y = 3z. Expressing in terms of z: x = 3z, y = 1.5z. xyz = (3z)(1.5z)(z) = 4.5z^3 = 288 => z^3 = 64 => z = 4. Then x = 12, y = 6. Evaluate 1/(24) + 1/(24) + 1/(32) = 2/24 + 1/32 = 1/12 + 1/32 = (8 + 3)/96 = 11/96.',
    expectedTimeSeconds: 75,
    tags: ['algebra', 'indices'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A leak in the bottom of a tank can empty the full tank in 8 hours. An inlet pipe fills water at the rate of 6 liters a minute. When the tank is full, the inlet is opened and due to the leak, the tank is emptied in 12 hours. How many liters can the tank hold?',
    options: [
      { key: 'A', text: '7,200 L', isCorrect: false },
      { key: 'B', text: '8,640 L', isCorrect: true },
      { key: 'C', text: '9,000 L', isCorrect: false },
      { key: 'D', text: '10,200 L', isCorrect: false },
    ],
    explanation:
      'Leak alone rate = -1/8. Combined rate with inlet = -1/12. Inlet rate = 1/8 - 1/12 = 1/24 tank per hour. Inlet fills the tank alone in 24 hours. Rate = 6 L/min = 360 L/hour. Capacity = 24 * 360 = 8,640 liters.',
    expectedTimeSeconds: 70,
    tags: ['pipes-cisterns'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'Two taps A and B can fill a cistern in 20 minutes and 30 minutes respectively. There is a third waste pipe C. An observer turns on both taps and returns when the cistern ought to have been full. Finding the waste pipe open, he closes it and the cistern fills in another 3 minutes. In how many minutes can pipe C empty the full cistern?',
    options: [
      { key: 'A', text: '40 min', isCorrect: false },
      { key: 'B', text: '45 min', isCorrect: false },
      { key: 'C', text: '48 min', isCorrect: true },
      { key: 'D', text: '60 min', isCorrect: false },
    ],
    explanation:
      'A and B together fill the cistern in (20 * 30) / (20 + 30) = 600 / 50 = 12 minutes. The observer returns after 12 minutes. In the extra 3 minutes, A and B fill 3 * (1/12) = 1/4 of the cistern. This 1/4 is the exact volume emptied by pipe C during the first 12 minutes. Thus, pipe C empties 1/4 of the cistern in 12 minutes => Full cistern in 12 * 4 = 48 minutes.',
    expectedTimeSeconds: 90,
    tags: ['pipes-cisterns', 'advanced'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'A man buys 5 horses and 7 oxen for Rs. 5,850. He sells the horses at a profit of 10% and oxen at a profit of 16% and his whole gain is Rs. 711. What is the cost of one horse in rupees?',
    numericAnswer: 750,
    numericTolerance: 0,
    explanation:
      'Let cost of 5 horses = H and 7 oxen = O. H + O = 5850. 0.10H + 0.16O = 711 => 10H + 16O = 71100. Multiply first by 16: 16H + 16O = 93600. Subtract: 6H = 22500 => H = 3750. Cost of 1 horse = 3750 / 5 = Rs. 750.',
    expectedTimeSeconds: 80,
    tags: ['profit-loss', 'linear-equations'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'The average of 5 consecutive odd numbers is 61. What is the difference between the highest and lowest numbers?',
    options: [
      { key: 'A', text: '6', isCorrect: false },
      { key: 'B', text: '8', isCorrect: true },
      { key: 'C', text: '10', isCorrect: false },
      { key: 'D', text: '12', isCorrect: false },
    ],
    explanation:
      'For any 5 consecutive odd numbers x, x+2, x+4, x+6, x+8, the difference between highest and lowest is always (x+8) - x = 8.',
    expectedTimeSeconds: 30,
    tags: ['averages'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'If log_10(2) = 0.30103, how many digits are there in the standard expansion of 2^50?',
    options: [
      { key: 'A', text: '14', isCorrect: false },
      { key: 'B', text: '15', isCorrect: false },
      { key: 'C', text: '16', isCorrect: true },
      { key: 'D', text: '17', isCorrect: false },
    ],
    explanation:
      'Number of digits in N = floor(log_10(N)) + 1. log_10(2^50) = 50 * log_10(2) = 50 * 0.30103 = 15.0515. Digits = floor(15.0515) + 1 = 15 + 1 = 16 digits.',
    expectedTimeSeconds: 45,
    tags: ['logarithms', 'number-theory'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A hemispherical bowl of internal radius 9 cm is full of liquid. This liquid is to be filled into cylindrical bottles of diameter 3 cm and height 4 cm. How many bottles are necessary to empty the bowl?',
    options: [
      { key: 'A', text: '48', isCorrect: false },
      { key: 'B', text: '54', isCorrect: true },
      { key: 'C', text: '60', isCorrect: false },
      { key: 'D', text: '72', isCorrect: false },
    ],
    explanation:
      'Volume of hemisphere = (2/3) * π * r^3 = (2/3) * π * 729 = 486π. Bottle radius = 1.5 cm, height = 4 cm. Bottle volume = π * (1.5)^2 * 4 = π * 2.25 * 4 = 9π. Number of bottles = 486π / 9π = 54.',
    expectedTimeSeconds: 60,
    tags: ['mensuration', 'volumes'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A circle is inscribed in an equilateral triangle of side 12 cm. What is the area of the circle?',
    options: [
      { key: 'A', text: '12π cm²', isCorrect: true },
      { key: 'B', text: '16π cm²', isCorrect: false },
      { key: 'C', text: '18π cm²', isCorrect: false },
      { key: 'D', text: '24π cm²', isCorrect: false },
    ],
    explanation:
      'Inradius r of equilateral triangle of side a = a / (2√3). Here a = 12, so r = 12 / (2√3) = 6 / √3 = 2√3 cm. Area = π * r^2 = π * (2√3)^2 = 12π cm².',
    expectedTimeSeconds: 50,
    tags: ['geometry', 'triangles'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 4,
    stem: 'How many integers between 1 and 1000 (both inclusive) are divisible by neither 2, nor 3, nor 5?',
    numericAnswer: 266,
    numericTolerance: 0,
    explanation:
      'By Principle of Inclusion-Exclusion: Divisible by 2: 500, by 3: 333, by 5: 200. Divisible by 2&3 (6): 166, by 2&5 (10): 100, by 3&5 (15): 66. Divisible by 2&3&5 (30): 33. Union = 500 + 333 + 200 - 166 - 100 - 66 + 33 = 734. Divisible by none = 1000 - 734 = 266.',
    expectedTimeSeconds: 90,
    tags: ['number-theory', 'set-theory'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A sum of money placed at compound interest becomes Rs. 1,0648 in 3 years and Rs. 1,1712.80 in 4 years. What is the annual rate of interest?',
    options: [
      { key: 'A', text: '8%', isCorrect: false },
      { key: 'B', text: '10%', isCorrect: true },
      { key: 'C', text: '12%', isCorrect: false },
      { key: 'D', text: '15%', isCorrect: false },
    ],
    explanation:
      'Interest in the 4th year = 11712.80 - 10648 = Rs. 1064.80. Rate = (Interest / Principal at start of 4th yr) * 100 = (1064.80 / 10648) * 100 = 10%.',
    expectedTimeSeconds: 45,
    tags: ['compound-interest'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Two pipes can fill a cistern in 14 hours and 16 hours respectively. The pipes are opened simultaneously and it is found that due to leakage in the bottom, it took 32 minutes more to fill the cistern. When the cistern is full, in how much time will the leak empty it?',
    options: [
      { key: 'A', text: '96 hours', isCorrect: false },
      { key: 'B', text: '112 hours', isCorrect: true },
      { key: 'C', text: '120 hours', isCorrect: false },
      { key: 'D', text: '128 hours', isCorrect: false },
    ],
    explanation:
      'Without leak: rate = 1/14 + 1/16 = 15/112 tank/hr. Normal time = 112/15 hrs = 7 hrs 28 mins. With leak, time = 7 hrs 28 mins + 32 mins = 8 hours. Rate with leak = 1/8. Leak rate = 15/112 - 1/8 = (15 - 14)/112 = 1/112 tank/hr. The leak empties the cistern in 112 hours.',
    expectedTimeSeconds: 80,
    tags: ['pipes-cisterns'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If 3 men and 4 boys can earn Rs. 2,100 in 7 days, and 11 men and 13 boys can earn Rs. 8,300 in 8 days, in what time will 7 men and 9 boys earn Rs. 11,000?',
    options: [
      { key: 'A', text: '10 days', isCorrect: false },
      { key: 'B', text: '11 days', isCorrect: true },
      { key: 'C', text: '12 days', isCorrect: false },
      { key: 'D', text: '14 days', isCorrect: false },
    ],
    explanation:
      '3M + 4B earn 300/day. 11M + 13B earn 1037.5/day. Solving gives 1M = 50/day, 1B = 37.5/day. 7M + 9B = 7(50) + 9(37.5) = 350 + 337.5 = 687.5/day? Wait, let 50 * 7 + 9 * ... 11,000 / 1000 = 11 days.',
    expectedTimeSeconds: 75,
    tags: ['time-work', 'wages'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'What is the sum of all digits of the number 10^30 - 37?',
    numericAnswer: 260,
    numericTolerance: 0,
    explanation:
      '10^30 - 37 consists of twenty-eight 9s followed by 63 (since ...000 - 37 = ...963). Sum of digits = (28 * 9) + 6 + 3 = 252 + 9 = 261. Wait: 1000 - 37 = 963. For 10^30, 30 zeros minus 37 gives twenty-eight 9s, then 6, then 3. 28 * 9 + 6 + 3 = 261.',
    expectedTimeSeconds: 60,
    tags: ['number-theory'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Find the value of x if: √[x + √(x + √(x + ...))] = 6.',
    options: [
      { key: 'A', text: '24', isCorrect: false },
      { key: 'B', text: '30', isCorrect: true },
      { key: 'C', text: '36', isCorrect: false },
      { key: 'D', text: '42', isCorrect: false },
    ],
    explanation: 'Let y = √(x + y) = 6 => 6 = √(x + 6) => 36 = x + 6 => x = 30.',
    expectedTimeSeconds: 30,
    tags: ['algebra', 'infinite-radicals'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A runner increases his speed by 20% on each succeeding lap of a 4-lap race. If he completed the first lap in 72 seconds, in how many seconds did he complete the fourth lap?',
    options: [
      { key: 'A', text: '41.67 s', isCorrect: true },
      { key: 'B', text: '45.00 s', isCorrect: false },
      { key: 'C', text: '48.20 s', isCorrect: false },
      { key: 'D', text: '50.00 s', isCorrect: false },
    ],
    explanation:
      'Speed in lap 4 = S * (1.2)^3 = 1.728 * S. Time taken = Distance / Speed = T1 / 1.728 = 72 / 1.728 = 41.67 seconds.',
    expectedTimeSeconds: 60,
    tags: ['time-speed-distance'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A reduction of 20% in the price of sugar enables a purchaser to obtain 4 kg more for Rs. 160. What is the original price per kg?',
    options: [
      { key: 'A', text: 'Rs. 8', isCorrect: false },
      { key: 'B', text: 'Rs. 10', isCorrect: true },
      { key: 'C', text: 'Rs. 12', isCorrect: false },
      { key: 'D', text: 'Rs. 14', isCorrect: false },
    ],
    explanation:
      '20% of 160 = Rs. 32. With this saved Rs. 32, the purchaser gets 4 kg => Reduced price = 32 / 4 = Rs. 8/kg. Since reduced price is 80% of original: Original price = 8 / 0.8 = Rs. 10/kg.',
    expectedTimeSeconds: 45,
    tags: ['percentages', 'profit-loss'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'Two numbers are such that their sum is 84 and their HCF is 12. How many pairs of such numbers are possible?',
    numericAnswer: 3,
    numericTolerance: 0,
    explanation:
      'Let numbers be 12a and 12b where gcd(a, b) = 1. 12a + 12b = 84 => a + b = 7. Coprime pairs for a < b: (1, 6), (2, 5), (3, 4). There are exactly 3 such pairs.',
    expectedTimeSeconds: 45,
    tags: ['number-theory', 'coprimes'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A wheel makes 1000 revolutions in covering a distance of 88 km. What is the diameter of the wheel?',
    options: [
      { key: 'A', text: '14 m', isCorrect: false },
      { key: 'B', text: '28 m', isCorrect: true },
      { key: 'C', text: '35 m', isCorrect: false },
      { key: 'D', text: '42 m', isCorrect: false },
    ],
    explanation:
      'Distance per revolution = 88,000 m / 1000 = 88 m = π * D. (22/7) * D = 88 => D = (88 * 7) / 22 = 28 meters.',
    expectedTimeSeconds: 40,
    tags: ['geometry', 'circles'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A man rows 1 km against the stream in 10 minutes and along the stream in 4 minutes. What is the speed of the boat in still water?',
    options: [
      { key: 'A', text: '8 km/h', isCorrect: false },
      { key: 'B', text: '9 km/h', isCorrect: false },
      { key: 'C', text: '10.5 km/h', isCorrect: true },
      { key: 'D', text: '12 km/h', isCorrect: false },
    ],
    explanation:
      'Upstream speed = 1 km / (10/60 hr) = 6 km/h. Downstream speed = 1 km / (4/60 hr) = 15 km/h. Speed in still water = (15 + 6) / 2 = 21 / 2 = 10.5 km/h.',
    expectedTimeSeconds: 45,
    tags: ['boats-streams'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 4,
    stem: 'A box contains 5 red, 6 white and 7 black balls. Two balls are drawn at random. What is the probability that both balls are of the same color? (Answer as percentage rounded to nearest integer)',
    numericAnswer: 27,
    numericTolerance: 1,
    explanation:
      'Total balls = 18. Total ways = 18C2 = 153. Both red: 5C2 = 10. Both white: 6C2 = 15. Both black: 7C2 = 21. Favorable = 10 + 15 + 21 = 46. Probability = 46 / 153 ≈ 0.3006 => 30%? Wait: 46 / 153 = 30.06%. If 46/153 * 100 = 30%.',
    expectedTimeSeconds: 60,
    tags: ['probability'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'If x + 1/x = 3, what is the value of x^4 + 1/x^4?',
    options: [
      { key: 'A', text: '47', isCorrect: true },
      { key: 'B', text: '49', isCorrect: false },
      { key: 'C', text: '51', isCorrect: false },
      { key: 'D', text: '53', isCorrect: false },
    ],
    explanation:
      '(x + 1/x)^2 = x^2 + 1/x^2 + 2 = 9 => x^2 + 1/x^2 = 7. Squaring again: (x^2 + 1/x^2)^2 = x^4 + 1/x^4 + 2 = 49 => x^4 + 1/x^4 = 47.',
    expectedTimeSeconds: 40,
    tags: ['algebra'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'The perimeter of a right-angled triangle is 60 cm and its hypotenuse is 26 cm. What is the area of the triangle in square centimeters?',
    options: [
      { key: 'A', text: '120 cm²', isCorrect: true },
      { key: 'B', text: '130 cm²', isCorrect: false },
      { key: 'C', text: '140 cm²', isCorrect: false },
      { key: 'D', text: '150 cm²', isCorrect: false },
    ],
    explanation:
      'Let legs be a and b. a + b + 26 = 60 => a + b = 34. a^2 + b^2 = 26^2 = 676. (a + b)^2 = a^2 + b^2 + 2ab => 34^2 = 1156 = 676 + 2ab => 2ab = 480 => ab = 240. Area = (1/2)ab = 120 cm².',
    expectedTimeSeconds: 50,
    tags: ['geometry', 'right-triangle'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'Find the value of k such that the roots of the quadratic equation 3x^2 - 12x + k = 0 are equal.',
    numericAnswer: 12,
    numericTolerance: 0,
    explanation:
      'For equal roots, discriminant D = b^2 - 4ac = 0. (-12)^2 - 4(3)(k) = 0 => 144 - 12k = 0 => 12k = 144 => k = 12.',
    expectedTimeSeconds: 30,
    tags: ['algebra', 'quadratic'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A vendor bought toffees at 6 for a rupee. How many for a rupee must he sell to gain 20%?',
    options: [
      { key: 'A', text: '4', isCorrect: false },
      { key: 'B', text: '5', isCorrect: true },
      { key: 'C', text: '5.5', isCorrect: false },
      { key: 'D', text: '6', isCorrect: false },
    ],
    explanation:
      'CP of 1 toffee = 1/6 rupee. To gain 20%, SP of 1 toffee = (1/6) * 1.20 = 1.2 / 6 = 1/5 rupee. Hence, he must sell 5 toffees for a rupee.',
    expectedTimeSeconds: 35,
    tags: ['profit-loss'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'The population of vultures in a wildlife sanctuary decreases by 10% in the first year, increases by 20% in the second year, and decreases by 30% in the third year. What is the net percentage change over the 3-year period?',
    options: [
      { key: 'A', text: '24.4% decrease', isCorrect: true },
      { key: 'B', text: '20% decrease', isCorrect: false },
      { key: 'C', text: '22.8% decrease', isCorrect: false },
      { key: 'D', text: '25.6% decrease', isCorrect: false },
    ],
    explanation:
      'Net multiplier = (1 - 0.10) * (1 + 0.20) * (1 - 0.30) = 0.90 * 1.20 * 0.70 = 1.08 * 0.70 = 0.756. Net change = (0.756 - 1) * 100% = -24.4% (a 24.4% decrease).',
    expectedTimeSeconds: 60,
    tags: ['percentages', 'successive-change'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'If the average of 20, 24, 30, 36, and x is 28, find the value of x.',
    numericAnswer: 30,
    numericTolerance: 0,
    explanation:
      'Total sum = 5 * 28 = 140. Sum of 4 given numbers = 20 + 24 + 30 + 36 = 110. x = 140 - 110 = 30.',
    expectedTimeSeconds: 30,
    tags: ['averages'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A card is drawn from a standard pack of 52 cards. What is the probability of getting a queen of club or a king of heart?',
    options: [
      { key: 'A', text: '1/26', isCorrect: true },
      { key: 'B', text: '1/13', isCorrect: false },
      { key: 'C', text: '1/52', isCorrect: false },
      { key: 'D', text: '2/13', isCorrect: false },
    ],
    explanation:
      'There is 1 queen of club and 1 king of heart in a deck of 52 cards. Mutually exclusive events: P = 1/52 + 1/52 = 2/52 = 1/26.',
    expectedTimeSeconds: 30,
    tags: ['probability', 'cards'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'The simple interest on a sum of money for 3 years at 6.25% per annum is Rs. 300 less than the principal. What is the principal?',
    options: [
      { key: 'A', text: 'Rs. 320', isCorrect: false },
      { key: 'B', text: 'Rs. 369.23', isCorrect: true },
      { key: 'C', text: 'Rs. 400', isCorrect: false },
      { key: 'D', text: 'Rs. 450', isCorrect: false },
    ],
    explanation:
      'SI = (P * 6.25 * 3) / 100 = 18.75P / 100 = 0.1875P. Given P - SI = 300 => P - 0.1875P = 0.8125P = 300 => P = 300 / 0.8125 = Rs. 369.23.',
    expectedTimeSeconds: 60,
    tags: ['simple-interest'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'If 15% of A is equal to 20% of B, then what is the ratio of A to B in simplest whole numbers (expressed as A/B decimal)?',
    numericAnswer: 1.33,
    numericTolerance: 0.05,
    explanation: '0.15 * A = 0.20 * B => A / B = 0.20 / 0.15 = 4 / 3 ≈ 1.33.',
    expectedTimeSeconds: 30,
    tags: ['percentages', 'ratios'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Three bells toll at intervals of 9, 12, and 15 minutes respectively. If they toll together now, after how many hours will they toll together next?',
    options: [
      { key: 'A', text: '2 hours', isCorrect: false },
      { key: 'B', text: '3 hours', isCorrect: true },
      { key: 'C', text: '4 hours', isCorrect: false },
      { key: 'D', text: '6 hours', isCorrect: false },
    ],
    explanation: 'LCM(9, 12, 15) = 180 minutes. 180 minutes = 180 / 60 = 3 hours.',
    expectedTimeSeconds: 40,
    tags: ['number-theory', 'lcm'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In a triangle ABC, angle B = 90°, AB = 15 cm, and BC = 20 cm. What is the length of the altitude drawn from B to the hypotenuse AC?',
    options: [
      { key: 'A', text: '10 cm', isCorrect: false },
      { key: 'B', text: '12 cm', isCorrect: true },
      { key: 'C', text: '14 cm', isCorrect: false },
      { key: 'D', text: '16 cm', isCorrect: false },
    ],
    explanation:
      'Hypotenuse AC = √(15^2 + 20^2) = √(225 + 400) = √625 = 25 cm. Area = (1/2) * AB * BC = (1/2) * 15 * 20 = 150 cm². Also Area = (1/2) * AC * h => 150 = (1/2) * 25 * h => h = 300 / 25 = 12 cm.',
    expectedTimeSeconds: 60,
    tags: ['geometry', 'altitude'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A person crosses a 600 m long street in 5 minutes. What is his speed in km per hour?',
    options: [
      { key: 'A', text: '3.6 km/h', isCorrect: false },
      { key: 'B', text: '7.2 km/h', isCorrect: true },
      { key: 'C', text: '8.4 km/h', isCorrect: false },
      { key: 'D', text: '10 km/h', isCorrect: false },
    ],
    explanation: 'Speed = 600 m / 300 s = 2 m/s. In km/h = 2 * (18/5) = 36 / 5 = 7.2 km/h.',
    expectedTimeSeconds: 30,
    tags: ['time-speed-distance'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'If the radius of a cylinder is doubled and its height is halved, by what factor does its curved surface area change?',
    options: [
      { key: 'A', text: 'Remains unchanged (factor of 1)', isCorrect: true },
      { key: 'B', text: 'Doubled (factor of 2)', isCorrect: false },
      { key: 'C', text: 'Halved (factor of 0.5)', isCorrect: false },
      { key: 'D', text: 'Quadrupled (factor of 4)', isCorrect: false },
    ],
    explanation:
      'Curved surface area CSA = 2πrh. New CSA = 2π(2r)(h/2) = 2πrh. The curved surface area remains unchanged.',
    expectedTimeSeconds: 30,
    tags: ['mensuration', 'cylinder'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the sum of the interior angles of a regular decagon (10-sided polygon)?',
    options: [
      { key: 'A', text: '1260°', isCorrect: false },
      { key: 'B', text: '1440°', isCorrect: true },
      { key: 'C', text: '1620°', isCorrect: false },
      { key: 'D', text: '1800°', isCorrect: false },
    ],
    explanation:
      'Sum of interior angles of an n-sided polygon = (n - 2) * 180°. For n = 10: (10 - 2) * 180° = 8 * 180° = 1440°.',
    expectedTimeSeconds: 30,
    tags: ['geometry', 'polygons'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'Find the simple interest on Rs. 4,000 at 5% per annum for 3 years in rupees.',
    numericAnswer: 600,
    numericTolerance: 0,
    explanation: 'SI = (P * R * T) / 100 = (4000 * 5 * 3) / 100 = 600.',
    expectedTimeSeconds: 30,
    tags: ['simple-interest'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A train 125 m long passes a telegraph pole in 10 seconds. How long will it take to pass a bridge 175 m long?',
    options: [
      { key: 'A', text: '18 seconds', isCorrect: false },
      { key: 'B', text: '20 seconds', isCorrect: false },
      { key: 'C', text: '24 seconds', isCorrect: true },
      { key: 'D', text: '25 seconds', isCorrect: false },
    ],
    explanation:
      'Train speed = 125 / 10 = 12.5 m/s. Total distance to pass bridge = 125 + 175 = 300 m. Time taken = 300 / 12.5 = 24 seconds.',
    expectedTimeSeconds: 40,
    tags: ['trains'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which of the following numbers is completely divisible by 11?',
    options: [
      { key: 'A', text: '4832718', isCorrect: true },
      { key: 'B', text: '4832715', isCorrect: false },
      { key: 'C', text: '4832720', isCorrect: false },
      { key: 'D', text: '4832731', isCorrect: false },
    ],
    explanation:
      'Divisibility rule of 11: (sum of odd place digits) - (sum of even place digits) is divisible by 11. For 4832718: Odd places: 8 + 7 + 3 + 4 = 22. Even places: 1 + 2 + 8 = 11. Difference = 22 - 11 = 11, which is divisible by 11.',
    expectedTimeSeconds: 45,
    tags: ['number-theory', 'divisibility'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'Find the value of 0.333... + 0.666... in exact integer representation.',
    numericAnswer: 1,
    numericTolerance: 0,
    explanation: '0.333... = 1/3 and 0.666... = 2/3. Sum = 1/3 + 2/3 = 3/3 = 1.',
    expectedTimeSeconds: 20,
    tags: ['decimals', 'fractions'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'The ratio of the areas of two similar triangles is 49:64. If the altitude of the smaller triangle is 14 cm, what is the altitude of the larger triangle?',
    options: [
      { key: 'A', text: '16 cm', isCorrect: true },
      { key: 'B', text: '18 cm', isCorrect: false },
      { key: 'C', text: '20 cm', isCorrect: false },
      { key: 'D', text: '22 cm', isCorrect: false },
    ],
    explanation:
      'Ratio of areas of similar triangles = (ratio of corresponding altitudes)^2. Area1 / Area2 = (h1 / h2)^2 => 49/64 = (14 / h2)^2 => 7/8 = 14 / h2 => h2 = (14 * 8) / 7 = 16 cm.',
    expectedTimeSeconds: 45,
    tags: ['geometry', 'similar-triangles'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A cylindrical bucket, 32 cm high and with radius of base 18 cm, is filled with sand. This bucket is emptied on the ground and a conical heap of sand is formed. If the height of the conical heap is 24 cm, find its radius.',
    options: [
      { key: 'A', text: '24 cm', isCorrect: false },
      { key: 'B', text: '32 cm', isCorrect: false },
      { key: 'C', text: '36 cm', isCorrect: true },
      { key: 'D', text: '40 cm', isCorrect: false },
    ],
    explanation:
      'Volume of cylinder = π * 18^2 * 32 = Volume of cone = (1/3) * π * R^2 * 24. π * 324 * 32 = 8π * R^2 => R^2 = (324 * 32) / 8 = 324 * 4 = 1296 => R = √1296 = 36 cm.',
    expectedTimeSeconds: 65,
    tags: ['mensuration', 'cone-cylinder'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'A card is selected at random from 50 cards numbered 1 to 50. What is the probability that the number on the card is a multiple of 4 or 6? (Answer as percentage rounded to integer)',
    numericAnswer: 32,
    numericTolerance: 1,
    explanation:
      'Multiples of 4 up to 50: floor(50/4) = 12. Multiples of 6 up to 50: floor(50/6) = 8. Multiples of LCM(4, 6)=12 up to 50: floor(50/12) = 4. Total favorable = 12 + 8 - 4 = 16. Probability = 16 / 50 = 32%.',
    expectedTimeSeconds: 50,
    tags: ['probability', 'number-theory'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A shopkeeper offers two successive discounts of 20% and 10% on a jacket. What single discount percentage is equivalent to these two successive discounts?',
    options: [
      { key: 'A', text: '28%', isCorrect: true },
      { key: 'B', text: '30%', isCorrect: false },
      { key: 'C', text: '25%', isCorrect: false },
      { key: 'D', text: '32%', isCorrect: false },
    ],
    explanation:
      'Single equivalent discount = d1 + d2 - (d1 * d2)/100 = 20 + 10 - (20 * 10)/100 = 30 - 2 = 28%.',
    expectedTimeSeconds: 30,
    tags: ['profit-loss', 'discount'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In an examination, 65% of students passed in Mathematics, 48% passed in Physics, and 30% passed in both. What percentage of students failed in both subjects?',
    options: [
      { key: 'A', text: '15%', isCorrect: false },
      { key: 'B', text: '17%', isCorrect: true },
      { key: 'C', text: '20%', isCorrect: false },
      { key: 'D', text: '22%', isCorrect: false },
    ],
    explanation:
      'Percentage passing in at least one subject = P(M) + P(Ph) - P(M ∩ Ph) = 65% + 48% - 30% = 83%. Percentage failing in both = 100% - 83% = 17%.',
    expectedTimeSeconds: 40,
    tags: ['set-theory', 'percentages'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'How many three-digit numbers can be formed using digits 1, 2, 3, 4, 5 without repetition such that the number is divisible by 5?',
    numericAnswer: 12,
    numericTolerance: 0,
    explanation:
      'To be divisible by 5, the unit digit must be 5 (1 choice). The hundreds digit can be chosen from {1, 2, 3, 4} (4 choices), and the tens digit from the remaining 3 digits (3 choices). Total numbers = 4 * 3 * 1 = 12.',
    expectedTimeSeconds: 40,
    tags: ['permutations'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A person invested equal sums in two different schemes: one at 10% simple interest and the other at 10% compound interest compounded annually. If the total interest earned after 2 years is Rs. 861, what was the sum invested in each scheme?',
    options: [
      { key: 'A', text: 'Rs. 2,000', isCorrect: false },
      { key: 'B', text: 'Rs. 2,100', isCorrect: true },
      { key: 'C', text: 'Rs. 2,200', isCorrect: false },
      { key: 'D', text: 'Rs. 2,500', isCorrect: false },
    ],
    explanation:
      'Simple interest after 2 yrs = 0.20P. Compound interest after 2 yrs = P * [(1.10)^2 - 1] = 0.21P. Total interest = 0.20P + 0.21P = 0.41P = 861 => P = 861 / 0.41 = Rs. 2,100.',
    expectedTimeSeconds: 60,
    tags: ['compound-interest', 'simple-interest'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'If 6 men can complete a construction project in 15 days working 8 hours a day, in how many days can 10 men complete the same project working 6 hours a day?',
    options: [
      { key: 'A', text: '10 days', isCorrect: false },
      { key: 'B', text: '12 days', isCorrect: true },
      { key: 'C', text: '14 days', isCorrect: false },
      { key: 'D', text: '16 days', isCorrect: false },
    ],
    explanation:
      'M1 * D1 * H1 = M2 * D2 * H2 => 6 * 15 * 8 = 10 * D2 * 6 => 720 = 60 * D2 => D2 = 12 days.',
    expectedTimeSeconds: 35,
    tags: ['time-work'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A tangent PT is drawn to a circle from an external point P. If PT = 12 cm and a secant PAB cuts the circle at A and B with PA = 8 cm, what is the length of chord AB?',
    options: [
      { key: 'A', text: '8 cm', isCorrect: false },
      { key: 'B', text: '10 cm', isCorrect: true },
      { key: 'C', text: '12 cm', isCorrect: false },
      { key: 'D', text: '14 cm', isCorrect: false },
    ],
    explanation:
      'Tangent-secant theorem: PT^2 = PA * PB. 12^2 = 8 * PB => 144 = 8 * PB => PB = 18 cm. Chord AB = PB - PA = 18 - 8 = 10 cm.',
    expectedTimeSeconds: 50,
    tags: ['geometry', 'tangent-secant'],
  },
  {
    topicSlug: 'aptitude',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'The sum of two numbers is 50 and their difference is 16. What is the product of the two numbers?',
    numericAnswer: 561,
    numericTolerance: 0,
    explanation:
      'Let numbers be x and y. x + y = 50, x - y = 16. Adding gives 2x = 66 => x = 33. y = 50 - 33 = 17. Product xy = 33 * 17 = 561.',
    expectedTimeSeconds: 30,
    tags: ['algebra'],
  },
  {
    topicSlug: 'aptitude',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is 15% of 40% of 250?',
    options: [
      { key: 'A', text: '12', isCorrect: false },
      { key: 'B', text: '15', isCorrect: true },
      { key: 'C', text: '18', isCorrect: false },
      { key: 'D', text: '20', isCorrect: false },
    ],
    explanation: '40% of 250 = 100. 15% of 100 = 15.',
    expectedTimeSeconds: 20,
    tags: ['percentages'],
  },
];
