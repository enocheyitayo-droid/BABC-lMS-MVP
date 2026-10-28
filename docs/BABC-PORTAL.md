# BABC secondary school portal

The portal entry is `/portal/login`. The BABC school application has two connected areas:

- **School administration and students:** server-saved finance, authentication, admissions, accounts, student fees, receipts, attendance, and academic reporting.
- **Teaching collaboration preview:** the earlier `/portal` teaching dashboard with browser-saved lesson reviews, tasks, and meeting notes. It is linked from the staff administration workspace and remains a preview.

The original Teamville application remains available under `/demo`; its records and database are separate.

## Running locally

Use `npm run dev` or `npm run dev -- --port 3001` when port 3000 is occupied. At `/portal/login`, choose a demo role and select Explore demo. The school demonstration uses fictional records and does not move money. Demo login requires `ENABLE_DEMO=true` (development defaults to enabled unless explicitly disabled).

BABC uses Node SQLite at `.data/babc-school.sqlite`, separate from Teamville. `BABC_DB_DIRECTORY` can select another directory. Records persist across browser reloads and can be shared by accounts accessing the same running school server. This requires a persistent Node host and persistent disk; the BABC SQLite application is not a serverless/Netlify database implementation.

## Roles and implemented workflows

- **Principal:** school overview, finances, debtor balances, expense/salary approval, payroll rates, result publication, student registry, school announcements, and audit trail. The principal cannot record or verify fee payments or pay their own requests.
- **Bursar:** fee schedules by class or student, opening debts, offline payment records and verification, receipts, debtor lists, funding, school cashbook, expense and salary requests, approved payout records, vouchers, and payslips.
- **ICT administrator:** admissions, expiring activation codes, registered-student approval, staff account creation, account suspension and session revocation, and teacher/subject/class assignments. ICT does not approve school expenditure or verify payments.
- **Subject teachers:** server-backed registers for their assigned subject classes using actual enrolled students. CA/exam marks are 40/60. Attendance is scoped by student, subject assignment, and date. The earlier lesson and meeting preview is also accessible.
- **Academic lead:** subject registers, review of saved marks, report publication, announcements, and student registry.
- **Student:** own profile, fee statement, payment-reference submission, verified receipts, published reports, subject attendance, and school announcements. Student routes cannot open other students’ receipts or financial records.

All administrative mutations check the authenticated role on the server. Financial changes are transactional, use integer kobo, and write audit records. Pending payments do not reduce balances. Verification is idempotent, blocks overpayments against the current ledger, and creates an immutable receipt snapshot. Expense and salary payouts require principal approval, sufficient funds, and a unique payment reference. Salary amounts come from approved payroll rates and cannot be submitted twice for the same staff member/month unless the previous request was rejected.

## Student signup and staff access

Students need an existing admission number and a single-use activation code from ICT. Codes expire after seven days and are stored as hashes. Signup creates a pending student account using the admission record’s name and class; form input cannot grant a staff role. ICT checks and activates the account before sign-in. Students sign in with their admission number and the surname on their admission record in CAPITAL LETTERS. Activation asks for no email or chosen password. Names are entered surname first (for example, `Balogun, Damilola` gives `BALOGUN`). Existing student accounts receive this password once when upgraded; active student sessions are revoked, staff credentials and account approval/suspension states are preserved. A migration marker prevents later database restarts from resetting passwords. Passwords remain salted and hashed; the five-attempt limit still applies. Surnames are predictable, so this is a school-selected convenience policy rather than a strong secret.

For the fictional demonstration, admission `BABC/26/002` initially has activation code `BABC-DEMO-002`. This code works once; if it has already been used, ICT can generate a new code for another unclaimed admission. Browser verification used this admission, so it may already have an activated test account in the local database.

Staff accounts are provisioned by ICT. Passwords use salted scrypt hashes. Sessions use random tokens in HttpOnly cookies, with token hashes stored in the database and an eight-hour expiry. Sign-in is throttled after five failed attempts per identifier in 15 minutes. Account suspension invalidates sessions.

For a non-demo installation, use a fresh persistent `BABC_DB_DIRECTORY`, set `ENABLE_DEMO=false`, start the application once to create the schema, then create the first ICT account from the local environment:

```powershell
# Set BABC_ICT_EMAIL and BABC_ICT_PASSWORD in the environment first.
# BABC_ICT_NAME is optional. Password length: 12–128 characters.
node scripts/babc-ict.mjs
```

The command prints no password and does not overwrite an existing account. ICT can then provision the principal, bursar, academic leads, and teachers from the portal. Disabling demos also blocks previously issued demo sessions.

## Payments and documents

This implementation records and reconciles offline payments. It does not collect funds, publish bank details, or connect a payment gateway. A student submits a reference for a payment already made using school-approved instructions. The bursar checks the actual bank/cash evidence before verification.

Only verified payments have receipts. Receipt and voucher pages support browser print/save-to-PDF. Demonstration documents are labelled as fictional. Fee accounts, debtors, and the cashbook export as CSV with spreadsheet-formula protection.

Published student reports are immutable snapshots; later changes to draft subject scores do not change the published report. The demonstration grade scale is labelled on the report. School-specific grading and full report-card signoff policy should be configured before using real academic records.

## Remaining boundary

The lesson reviews, illustrative timetable, and meeting preview still use the earlier browser store. They have not been migrated to shared staff records. Video meetings open a provider link; the portal does not host video calls or send calendar invitations. Connected payment processing and production deployment are not configured.

## Verification

`npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Tests cover cross-student access, role restrictions, pending/verified payments, immutable receipts, duplicate references, overpayments, class-charge rollback, approval and payout sequencing, payroll rates, duplicate salaries, insufficient funds, signup activation, password hashing, sessions, login throttling, result snapshots, and the earlier demonstration stores.

## Simple daily workspaces

Staff now sign in to `/portal/office` rather than the older collaboration preview. Everyday navigation is limited to the relevant role; occasional tools remain under **More tools**.

- Subject teachers see their assigned subjects directly on Home. Each class has **Take attendance** and **Enter scores** actions, without a setup form or several filters first.
- A teacher may also be a class teacher under the same login. ICT assigns that responsibility in **Staff & access → Teachers & classes → Choose a class teacher**. **My class** appears only for teachers with a class assignment.
- Class teachers record daily whole-class attendance, with **Mark all present** and individual corrections. This uses `class_attendance`, independently of subject/lesson attendance. Class teachers can also check how many students have marks entered in each subject; that does not grant permission to edit other teachers’ marks.
- Principal, ICT, bursar, and academic-lead home screens each offer three focused starting tasks. Payroll, debtors, audit history, and the earlier meeting/lesson preview remain accessible under **More tools**.
- ICT setup is split into **Student access**, **Staff accounts**, and **Teachers & classes**. Extra setup forms open only when selected.

The demo teacher is also class teacher for JSS 1A. The migration adds the class-teacher tables without replacing existing school records. Tests cover class ownership, immediate access changes after reassignment, plain-object client data, transactional attendance saving, and restricted navigation.

Development also permits the loopback origin `127.0.0.1` so isolated browser tests can use a separate session without changing the user's selected role on `localhost`. This setting applies only to development.

## Blue and gold dashboard

The staff and student workspaces share a blue, gold, and pale-blue interface based on the supplied dashboard reference. Administration home includes saved enrollment counts, junior/senior enrollment, role-specific task shortcuts, notices, and a month-navigation calendar using the Lagos school date. Principal and bursar charts show six months of verified student fees and recorded expenses; ICT and academic staff see class enrollment instead. Class attendance charts use saved whole-class registers, with an empty state when none exist. Calendar browsing does not schedule meetings or send invitations.

`/portal` now routes signed-in users to their role's home, and unsigned users to login. The original browser-only lesson and meeting workspace is retained at `/portal/collaboration` under More tools.
