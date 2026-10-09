# Understanding Your Placement Readiness Score & Topic Mastery

Welcome to CampusEdge's transparent preparation intelligence system. We believe students should always understand exactly how their metrics are calculated, why their preparation scores change, and what steps will yield the highest improvement.

> **Statutory Disclaimer**:
> _The Placement Readiness Score is a diagnostic preparation indicator designed to measure conceptual mastery and practice consistency. It does NOT constitute a guarantee, prediction, or legal assurance of employment or recruitment selection by CampusEdge or partner institutions._

---

## 1. Topic Mastery Formula

Topic mastery evaluates your conceptual proficiency on an individual topic (e.g., _Dynamic Programming_, _SQL Normalization_, or _Percentages_). Unlike a simple percentage of correct answers, our algorithm uses **adaptive difficulty weighting**, **recency decay**, and **Bayesian smoothing**.

### The Mathematical Formula

$$\text{Mastery} = \frac{\sum (w_i \cdot c_i) + K \cdot 0.5}{\sum w_i + K}$$

Where:

- $c_i \in \{0, 1\}$: $1$ if the question was answered correctly, $0$ if incorrect (skipped questions are excluded).
- $w_i = \text{DifficultyWeight}(d_i) \times 0.5^{\frac{\text{ageDays}_i}{30}}$: The effective weight of each question attempt.
  - **Difficulty Weights**:
    - Difficulty 1 (Foundational): $0.6$
    - Difficulty 2 (Elementary): $0.8$
    - Difficulty 3 (Intermediate): $1.0$
    - Difficulty 4 (Advanced): $1.2$
    - Difficulty 5 (Complex): $1.4$
  - **Recency Decay**: Has a half-life of 30 days. A question solved today has weight $1.0$, while a question solved 30 days ago has weight $0.5$, and 60 days ago has weight $0.25$.
- $K = 2$: Bayesian prior regularization weight centered at prior average accuracy ($0.5$). This prevents 1 lucky question from prematurely yielding 100% mastery.
- **Window**: The last 50 scored questions per topic are evaluated.

### Mastery Level Thresholds

- **Insufficient Data**: Fewer than 5 questions scored in this topic.
- **Strong**: Mastery $\ge 0.70$ (70%)
- **Moderate**: Mastery between $0.40$ and $0.70$ (40% - 70%)
- **Weak**: Mastery $< 0.40$ (< 40%)

---

### Worked Examples for Mastery

#### Example 1: Student Starting Out (Low Sample Size with Bayesian Smoothing)

- **Scenario**: A student answers 4 Level 3 questions today: 3 correct, 1 incorrect.
- **Calculation**:
  - $w_i = 1.0 \times 0.5^0 = 1.0$ for each question.
  - $\sum w_i = 4.0$.
  - $\sum (w_i \cdot c_i) = 3.0$.
  - With $K = 2$ prior:
    $$\text{Mastery} = \frac{3.0 + 2 \times 0.5}{4.0 + 2} = \frac{4.0}{6.0} = 0.6667 \ (66.7\%)$$
- **Level**: `INSUFFICIENT_DATA` because only 4 questions have been answered ($< 5$).

#### Example 2: Active Student Solving Advanced Questions (Strong Mastery)

- **Scenario**: A student solves 10 Level 4 questions today: 9 correct, 1 incorrect.
- **Calculation**:
  - $w_i = 1.2 \times 0.5^0 = 1.2$ per question.
  - $\sum w_i = 10 \times 1.2 = 12.0$.
  - $\sum (w_i \cdot c_i) = 9 \times 1.2 = 10.8$.
  - With $K = 2$ prior:
    $$\text{Mastery} = \frac{10.8 + 1.0}{12.0 + 2.0} = \frac{11.8}{14.0} = 0.8429 \ (84.3\%)$$
- **Level**: `STRONG` ($\ge 0.70$), recognizing high performance on challenging questions.

#### Example 3: Inactive Student Experiencing Recency Decay

- **Scenario**: A student scored 10 Level 3 questions correctly 60 days ago ($c_i = 1$), but scored 5 Level 3 questions incorrectly today ($c_i = 0$).
- **Calculation**:
  - Old questions (60 days ago): ageDays = 60, weight = $1.0 \times 0.5^{60/30} = 1.0 \times 0.25 = 0.25$.
    - Sum old weights = $10 \times 0.25 = 2.50$, sum old correct = $2.50$.
  - Today's questions: ageDays = 0, weight = $1.0 \times 0.5^0 = 1.0$.
    - Sum new weights = $5 \times 1.0 = 5.0$, sum new correct = $0.0$.
  - Total $\sum w_i = 2.50 + 5.0 = 7.50$.
  - Total $\sum (w_i \cdot c_i) = 2.50 + 0 = 2.50$.
  - With $K = 2$ prior:
    $$\text{Mastery} = \frac{2.50 + 1.0}{7.50 + 2.0} = \frac{3.50}{9.50} = 0.3684 \ (36.8\%)$$
- **Level**: `WEAK` ($< 0.40$), accurately reflecting that recent performance indicates decaying recall.

---

## 2. Placement Readiness Score Formula

The **Readiness Score** aggregates your preparation across multiple pillars into a single score out of 100.

### Readiness Components & Track Weights

| Component                | Software Track Weight | Non-Software Track Weight | Availability Rule                   |
| :----------------------- | :-------------------: | :-----------------------: | :---------------------------------- |
| **Aptitude Mastery**     |     30% ($0.30$)      |       55% ($0.55$)        | $\ge 15$ scored aptitude questions  |
| **Technical CS Mastery** |     35% ($0.35$)      |        0% ($0.00$)        | $\ge 20$ scored technical questions |
| **Mock Performance**     |     20% ($0.20$)      |       30% ($0.30$)        | $\ge 1$ completed full mock test    |
| **Practice Consistency** |     15% ($0.15$)      |       15% ($0.15$)        | Always available after diagnostic   |
| **Coding & Sandbox**     |     0% (Phase 5)      |       0% (Phase 5)        | Scheduled for Phase 5               |
| **Mock Interviews**      |     0% (Phase 6)      |       0% (Phase 6)        | Scheduled for Phase 6               |

### Calculation Algorithm

$$\text{Readiness Score} = 100 \times \frac{\sum_{c \in \text{Available}} (w_c \cdot v_c)}{\sum_{c \in \text{Available}} w_c}$$

Where:

- $v_c \in [0, 1]$ is the normalized component value.
- **Consistency Value**: $\min(1.0, \frac{\text{Active Days in Last 14 Days}}{10})$. Active on 10 or more days out of 14 yields a perfect consistency score of 100%.
- **Mock Performance Value**: Average percentage scored across up to your last 3 full mock or college test attempts.
- **Prerequisite**: You must complete the initial Diagnostic Test before any readiness score is calculated.

### Confidence Tiers & Readiness Bands

#### Confidence Tiers

- **Low**: $< 30$ total scored questions across all topics.
- **Medium**: $30 - 100$ total scored questions.
- **High**: $> 100$ total scored questions.

#### Readiness Bands

- **Getting Started** ($< 40$): Foundational phase; focus on core concepts and diagnostic practice.
- **Building** ($40 - 59.9$): Developing consistency; moderate mastery across foundational topics.
- **Competitive** ($60 - 79.9$): Strong placement test baseline; ready for campus screening rounds.
- **Strong** ($\ge 80$): Advanced preparation; highly consistent with mastery across hard topics.

---

### Worked Examples for Readiness

#### Example 1: Full-Stack Engineering Candidate (Software Track, All Components Available)

- **Profile**:
  - Aptitude Mastery: $76\%$ ($0.76$) with 25 questions.
  - Technical Mastery: $82\%$ ($0.82$) with 35 questions.
  - Mock Performance: $78\%$ ($0.78$) across last 2 mocks.
  - Consistency: Active on 8 of the last 14 days $\rightarrow \frac{8}{10} = 80\%$ ($0.80$).
  - Total Scored Questions: $60$ ($\rightarrow$ `MEDIUM` confidence).
- **Calculation**:
  $$\text{Score} = 100 \times \frac{0.30(0.76) + 0.35(0.82) + 0.20(0.78) + 0.15(0.80)}{0.30 + 0.35 + 0.20 + 0.15}$$
  $$\text{Score} = 100 \times [0.228 + 0.287 + 0.156 + 0.120] = 100 \times 0.791 = 79.1$$
- **Outcome**: **Score 79.1 / 100** | Band: `COMPETITIVE` | Confidence: `MEDIUM`.

#### Example 2: Early Stage Student (Technical Component Not Yet Unlocked)

- **Profile**:
  - Aptitude Mastery: $70\%$ with 18 questions (available).
  - Technical Mastery: Only 8 questions answered ($< 20$, NOT yet available).
  - Mock Performance: None taken yet (NOT yet available).
  - Consistency: Active 4 days $\rightarrow \frac{4}{10} = 40\%$ ($0.40$).
  - Total Scored Questions: $26$ ($\rightarrow$ `LOW` confidence).
- **Available Weights**: Aptitude ($0.30$) + Consistency ($0.15$) = $0.45$.
- **Calculation**:
  $$\text{Score} = 100 \times \frac{0.30(0.70) + 0.15(0.40)}{0.45} = 100 \times \frac{0.21 + 0.06}{0.45} = 100 \times \frac{0.27}{0.45} = 60.0$$
- **Outcome**: **Score 60.0 / 100** | Band: `COMPETITIVE` | Confidence: `LOW` (unlock Technical & Mocks to increase accuracy).

#### Example 3: Non-Technical Track Student (Core Business / Operations Track)

- **Profile**:
  - Track: `OTHER` (Technical weight is $0.0$, Aptitude is $55\%$, Mock is $30\%$, Consistency is $15\%$).
  - Aptitude Mastery: $85\%$ ($0.85$) with 40 questions.
  - Mock Performance: $80\%$ ($0.80$) across 3 mocks.
  - Consistency: Active 10 of 14 days $\rightarrow 100\%$ ($1.00$).
  - Total Scored Questions: $120$ ($\rightarrow$ `HIGH` confidence).
- **Calculation**:
  $$\text{Score} = 100 \times [0.55(0.85) + 0.30(0.80) + 0.15(1.00)] = 100 \times [0.4675 + 0.240 + 0.150] = 85.75$$
- **Outcome**: **Score 85.8 / 100** | Band: `STRONG` | Confidence: `HIGH`.

---

## 3. Personalized Roadmap Generation

Your personalized roadmap is a rolling **28-day plan** tailored to your weaknesses, target study hours, and upcoming college drives.

### Task Priority Formula

$$\text{Priority} = (1.0 - \text{Mastery}) \times \text{Importance}$$

Where:

- $\text{Mastery} \in [0, 1]$: Current mastery (defaults to $0.5$ if insufficient data).
- $\text{Importance} = 1.0 + \text{Boosts}$:
  - $+0.5$ if the topic appears in an upcoming eligible drive round within the next 30 days.
  - $+0.3$ if the topic is a recurring recruiter focus topic for your college.
  - $+0.2$ if the topic is a core computer science discipline on the Software track.

### Daily Structure

- **Question Budget**: $\text{Daily Questions} = \text{round}(\text{Study Hours} \times 20)$ (min 10, max 160).
- **Weekdays**: Targeted topic remediation based on highest priority.
- **Wednesdays**: Mid-week mistake notebook review.
- **Saturdays**: Timed full-length mock assessment.
- **Sundays**: Weekend mistake notebook review and rest.
- **Every 10 Days**: Concept retention maintenance task for a topic with Strong mastery.
- **Within 7 Days of a Drive**: Urgent `DRIVE_PREP` tasks focused on company-specific round topics.

---

### Worked Examples for Roadmap Priority

#### Example 1: Weak Topic with Upcoming Drive Round

- **Topic**: _Binary Trees_
- **Stats**: Mastery = $0.35$ (Weak).
- **Boosts**: Appears in round 1 of upcoming Amazon recruitment ($+0.5$), core CS track topic ($+0.2$).
- **Calculation**:
  $$\text{Importance} = 1.0 + 0.5 + 0.2 = 1.7$$
  $$\text{Priority} = (1.0 - 0.35) \times 1.7 = 0.65 \times 1.7 = 1.105$$
- **Schedule**: Ranked at the very top of daily weekday practice.

#### Example 2: Strong Topic Retained for Maintenance

- **Topic**: _SQL Joins & Group By_
- **Stats**: Mastery = $0.85$ (Strong).
- **Boosts**: Core CS topic ($+0.2$), no immediate drives.
- **Calculation**:
  $$\text{Importance} = 1.0 + 0.2 = 1.2$$
  $$\text{Priority} = (1.0 - 0.85) \times 1.2 = 0.15 \times 1.2 = 0.180$$
- **Schedule**: Scheduled as a 10-question retention maintenance task once every 10 days rather than heavy daily drilling.

#### Example 3: Unattempted Topic with Recruiter Frequency

- **Topic**: _Permutations & Combinations_
- **Stats**: Insufficient data (default mastery = $0.5$).
- **Boosts**: Recruiter frequent topic ($+0.3$).
- **Calculation**:
  $$\text{Importance} = 1.0 + 0.3 = 1.3$$
  $$\text{Priority} = (1.0 - 0.5) \times 1.3 = 0.5 \times 1.3 = 0.650$$
- **Schedule**: Scheduled as foundational diagnostic practice to establish baseline mastery.
