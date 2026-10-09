---
name: content-moderation
description: Multi-tier content moderation lifecycle, automated report threshold auto-flagging, Super Admin platform takedowns, and student anonymity projection rules.
---

# CampusEdge Content Moderation & Anonymity Engine

This skill governs the review, moderation, report handling, and privacy preservation for student interview experiences across CampusEdge.

## 1. Lifecycle State Machine

Interview experiences follow a strict state progression:

```
[DRAFT]
   │
   ▼ (Author submits)
[SUBMITTED] ◄──────────────┐
   │                       │ (Student updates)
   ├──► [CHANGES_REQUESTED]─┘
   │
   ├──► [REJECTED]
   │
   ▼ (TPO approves)
[APPROVED] ──► (>= 3 reports) ──► [UNDER_REVIEW]
   │                                  │
   │                                  ├──► [APPROVED] (TPO dismisses reports)
   │                                  └──► [REJECTED] (TPO upholds reports)
   ▼
[REMOVED] (Super Admin platform takedown)
```

### State Definitions

- `DRAFT`: Private to author.
- `SUBMITTED`: Awaiting Placement Cell review.
- `CHANGES_REQUESTED`: Returned to author with reviewer note.
- `APPROVED`: Publicly viewable within the college tenant and aggregated into recruiter intelligence.
- `UNDER_REVIEW`: Auto-flagged or manually flagged due to community reports; immediately hidden from public student feed.
- `REJECTED`: Denied publication by college TPO.
- `REMOVED`: Takedown by Super Admin across the entire platform.

---

## 2. Automated Reporting & Flagging Thresholds

### Peer Reporting

- Authenticated students in the same college tenant can submit an `ExperienceReport` specifying the reason for flagging.
- Unique constraint `(experienceId, reporterId)` prevents duplicate spam reporting.

### Auto-Flagging Threshold (>= 3 Reports)

- Upon report creation, the system counts total reports for the experience.
- When `reportsCount >= 3` and status is `APPROVED`:
  - System automatically transitions experience status to `UNDER_REVIEW`.
  - The experience is immediately removed from the active student feed to mitigate risk (e.g. NDA violations, leaked copyrighted assessments).
  - TPO dashboard surfaces the item in the high-priority moderation queue with total report counts and reasons.

---

## 3. Student Anonymity Projection

Student contributors often share authentic compensation, difficulty ratings, and round breakdowns only under anonymity.

### Projection Rules (`ExperiencesService.findById` & `findPublic`)

When an experience has `isAnonymous = true`:

1. **Peer Students**:
   - `author.userProfile.fullName` is projected as `"Anonymous Senior"`.
   - `author.userProfile.email` is stripped / set to `null`.
   - `author.enrollmentNumber` is stripped.
   - Non-identifying academic facts are retained: `author.branch.name`, `author.batchYear`.
2. **College Admins & Super Admins**:
   - Retain full access to the student profile for accountability, grievance redressal, and integrity audits.
