# CampusEdge — Pre-Launch Verification Checklist (With Owners)

| Item                                   | Category      | Description                                                                                                | Owner                  | Status               |
| :------------------------------------- | :------------ | :--------------------------------------------------------------------------------------------------------- | :--------------------- | :------------------- |
| **1. Seeded Question Bank Audit**      | Content       | Human peer review of all 455 starter questions for technical accuracy, ambiguity, and answer key validity  | Head of Curriculum     | Pending Sign-off     |
| **2. Legal & Privacy Policy Review**   | Legal / DPDP  | External counsel review of DPDP Privacy Policy, Terms of Service, and Candidate Data Processing Agreements | Legal Counsel / DPO    | Pending Review       |
| **3. Pilot College Agreement**         | Institutional | Formal institutional memorandum & SLA signed by Principal / TPO at pilot institution                       | Institutional Director | Pending Sign-off     |
| **4. Transactional SMTP Verification** | DevOps        | Production transactional email provider (Resend / AWS SES) configured with SPF, DKIM, and DMARC records    | Lead DevOps Engineer   | Pending Config       |
| **5. Database PITR & Backups**         | Database      | Automated daily PostgreSQL backups with Point-in-Time Recovery (PITR) verified via restore drill           | Database Administrator | Pending Verification |
| **6. Secret & Credential Scan**        | Security      | Git history and working tree scanned for hardcoded API keys, tokens, or private credentials                | Security Engineer      | Completed            |
| **7. Production Migration Deploy**     | Database      | Zero-downtime Prisma migrations applied through authorized CI deploy pipeline                              | Database Administrator | Completed            |
| **8. Synthetic Concurrency Benchmark** | Performance   | 2,000 concurrent attempt simulation verified with $< 150\text{ms}$ submission latency                      | Lead Backend Engineer  | Completed            |
| **9. Zero Answer Leakage Contract**    | Security      | Automated contract test confirming zero answer keys or explanations sent during in-progress tests          | QA / Test Engineer     | Completed            |
| **10. Differential Privacy Gate**      | Privacy       | ADR 0004 small cohort masking verified for groups $< 3$ students                                           | Lead Backend Engineer  | Completed            |
