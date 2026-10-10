# Understanding Company Match Scores & Preparation Priority Tiers

Welcome to CampusEdge's transparent company matching system. We believe students should always understand how their preparation alignment is evaluated, what inputs are considered, and why specific companies are highlighted for immediate focus.

> **Statutory Disclaimer**:
> _The CampusEdge Company Match Score and Priority Tier are indicative self-assessment tools designed solely to guide student preparation focus. They do NOT constitute an offer, interview shortlisting guarantee, or endorsement of hiring likelihood. Selection criteria are determined exclusively and independently by prospective recruiters._

---

## 1. Ethical AI & Scoring Whitelist Guarantee

CampusEdge guarantees that the Company Match Score and Preparation Priority Tier operate under **zero-proxy ethical governance**:

1. **Academic & Performance Factors Only**:
   - Technical & Domain Skills (Self-declared and verified)
   - Topic Mastery (Adaptive performance from practice questions and assessments)
   - Diagnostic Readiness Score (Overall benchmark across quantitative, reasoning, and technical tracks)
   - Timing & Recruitment Deadlines (Days remaining until drive registration or assessment)
   - Explicit Student Interest (Followed companies, active applications)

2. **Absolute Exclusion of Non-Merit Identifiers**:
   Under no circumstances do our algorithms ingest, process, or proxy:
   - Gender, sex, or marital status
   - Caste, reservation category, or socio-economic background
   - Religion, race, or ethnicity
   - Age, date of birth, or hometown
   - Photos, physical profile, or disability status

---

## 2. Company Match Score Formula

The Company Match Score evaluates your current preparation alignment against a target employer's published skill and domain requirements.

### Component Weights

$$\text{MatchScore} = 0.40 \times \text{SkillScore} + 0.35 \times \text{TopicScore} + 0.25 \times \text{ReadinessScore}$$

1. **Skill Score (Weight: 40%)**:
   - For each skill required by the company, student proficiency is scaled:
     - `BEGINNER`: $0.5$
     - `INTERMEDIATE`: $0.8$
     - `ADVANCED`: $1.0$
   - $\text{SkillScore} = \left(\frac{\sum \text{MatchedProficiencyWeight}}{\text{TotalRequiredSkills}}\right) \times 100$
   - Default baseline is $70$ if the company lists no specific required skills.

2. **Topic Mastery Score (Weight: 35%)**:
   - Evaluates your adaptive mastery ($0.0$ to $1.0$) across core curriculum topics required for the company's hiring pattern.
   - $\text{TopicScore} = \left(\frac{\sum \text{TopicMastery}}{\text{TotalRequiredTopics}}\right) \times 100$
   - Default baseline is $70$ if the company has not tagged specific topic prerequisites.
   - If required topics exist but the student has zero practice attempts, $\text{TopicScore}$ defaults to $20$.

3. **Readiness Score (Weight: 25%)**:
   - Incorporates your verified Diagnostic Placement Readiness Score ($0$ to $100$).
   - If no diagnostic readiness score is available yet, the calculation re-normalizes between Skill Score ($53.3\%$) and Topic Mastery ($46.7\%$).

---

## 3. Match Confidence Levels

- **HIGH**: Student has $\ge 5$ evaluated skill/topic data points AND a diagnostic readiness score snapshot.
- **MEDIUM**: Student has between $1$ and $4$ skill/topic data points, or a readiness snapshot.
- **LOW**: Zero skills or topics recorded; match score is rendered as `null` with a prompt to practice or complete profile.

---

## 4. Preparation Priority Tiers

The Priority Engine schedules which employers students should prioritize in their daily study plan:

| Tier             | Meaning                 | Qualification Criteria                                                                                               |
| :--------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **PREPARE NOW**  | Immediate High Priority | Drive scheduled within 14 days **OR** Priority Score $\ge 70$.                                                       |
| **PREPARE NEXT** | Upcoming Priority       | Drive scheduled within 30 days **OR** Priority Score $\ge 45$.                                                       |
| **ON RADAR**     | Future Horizon          | Eligible, but drive is $> 30$ days out or unscheduled, and moderate score.                                           |
| **NOT ELIGIBLE** | Academic / Policy Gate  | Student fails institutional eligibility gates (CGPA cut-off, active backlogs, branch restriction). Score set to $0$. |

### Priority Score Calculation

For eligible candidates:

$$\text{PriorityScore} = 0.35 \times \text{Timing} + 0.35 \times \text{MatchScore} + 0.15 \times \text{Interest} + 0.15 \times \text{ReadinessGap}$$

- **Timing Score (35%)**: $\le 7$ days: $100$ | $\le 14$ days: $85$ | $\le 30$ days: $65$ | $> 30$ days: $40$ | Unannounced: $30$.
- **Match Component (35%)**: Current Company Match Score.
- **Student Interest (15%)**: Active Application: $100$ | Followed Company: $80$ | Neither: $30$.
- **Readiness Gap (15%)**: Opportunity headroom $\max(0, 100 - \text{MatchScore})$.

---

## 5. Worked Examples

### Example 1: High Alignment, Upcoming Drive (Prepare Now)

- **Profile**: Student has `Python` (Advanced, 1.0), `SQL` (Advanced, 1.0), `React` (Intermediate, 0.8). Target Company requires `Python`, `SQL`, `Docker`. Docker is missing.
  - $\text{SkillScore} = \frac{1.0 + 1.0 + 0}{3} \times 100 = 66.7$.
- **Topics**: Required: Data Structures (Mastery 0.85), DBMS (Mastery 0.90).
  - $\text{TopicScore} = \frac{0.85 + 0.90}{2} \times 100 = 87.5$.
- **Readiness Score**: $82.0$.
- **Match Score**:
  $$\text{MatchScore} = (0.40 \times 66.7) + (0.35 \times 87.5) + (0.25 \times 82.0) = 26.68 + 30.625 + 20.5 = 77.8$$
- **Confidence**: `HIGH` ($\ge 5$ evidence points + readiness score).
- **Drive Timing**: Drive is in $10$ days ($\text{Timing} = 85$).
- **Followed**: Yes ($\text{Interest} = 80$).
- **Tier**: `PREPARE_NOW` (Drive is $\le 14$ days).

---

### Example 2: Ineligible Due to Academic Criteria (Not Eligible)

- **Profile**: Strong competitive programmer with 95% skill match and 90% topic mastery.
- **Academic Status**: Current CGPA is $6.8$, but company specifies strict campus cut-off of $7.5$.
- **Eligibility Gate**: `isEligible = false` (Reason: `CGPA 6.8 below required threshold 7.5`).
- **Priority Tier**: Immediately assigned `NOT_ELIGIBLE`.
- **Priority Score**: $0$.

---

### Example 3: Early-Stage Student, Unannounced Drive (On Radar)

- **Profile**: 1 Skill (`Java`, Beginner, 0.5) out of 4 required.
  - $\text{SkillScore} = \frac{0.5}{4} \times 100 = 12.5$.
- **Topics**: Required: OOP (Mastery 0.45).
  - $\text{TopicScore} = 45.0$.
- **Readiness Score**: Not yet attempted (`null`).
- **Match Calculation** (Re-normalized weights $0.40/0.75 \approx 0.533$ and $0.35/0.75 \approx 0.467$):
  $$\text{MatchScore} = (0.533 \times 12.5) + (0.467 \times 45.0) = 6.66 + 21.01 = 27.7$$
- **Confidence**: `MEDIUM` (2 data points, no readiness snapshot).
- **Timing**: Unannounced ($30$).
- **Interest**: Not followed ($30$).
- **Priority Score**: Low ($< 45$).
- **Tier**: `ON_RADAR`. Student is guided to build fundamentals first.
