# BABC school MVP — walkthrough and school benefits

This portal coordinates a secondary school, where different teachers teach different subjects in the same class. A subject teacher can also be a class teacher under one personal login.

## What is now implemented

| Area | Everyday use | Manual problem addressed |
| --- | --- | --- |
| Role-based accounts | Principal, ICT, bursar, academic lead, teacher, student, and linked parent access | People no longer need the same access to every school record. Individual accounts identify who saved or approved a change. |
| Teacher assignments | ICT assigns each subject/class and each class teacher | A biology teacher can teach several classes without being responsible for every subject in those classes. |
| Attention queue | Staff see outstanding marks, class checks, academic approvals, support follow-ups, meetings, and relevant finance tasks | Less chasing colleagues in person or searching through messages to know what is outstanding. Reminders are in-app, not emailed or sent by SMS. |
| Midterm results | Teachers save or upload a score out of 100 | Midterm marks are separate from end-of-term marks. |
| End-of-term results | Teachers enter CA /40 and examination /60 | Totals are calculated consistently, instead of repeatedly copying and adding marks by hand. These are MVP defaults, not a claim about every school's grading policy. |
| Spreadsheet import | Download a CSV template, fill it in Excel, save as CSV, and upload | Teachers can enter a class in bulk. Admissions, duplicates, ranges, and the whole file are validated before anything changes. Native XLSX upload is not included. |
| Class result sheet and rankings | View all subjects for the same class, session, term, and assessment; export CSV | No manual joining of separate subject sheets. Missing marks are flagged. Incomplete classes are not ranked; equal totals share a position. |
| Results review | Subject teacher submits → class teacher checks → academic lead/principal approves → approved reports are published | Results no longer go directly from an unchecked draft to students. Submitted marks are locked. Reviewers can return a subject with a reason. |
| Published report revisions | Open a correction revision after publication | A correction does not silently rewrite the report a student already received. Prior published versions remain available. |
| Permanent history | Admission-linked session placements, published assessments, and dated attendance | Promotion does not erase the previous class. Earlier reports retain the name, admission, class, assessment, ranking, comment, and attendance summary captured at publication. Legacy reports are preserved and labelled when their original class was not recorded. |
| Promotion and leaving school | ICT/principal adds a later-session placement, or records graduation/withdrawal | Existing enrollments are not overwritten. Graduation/withdrawal suspend the student's login while retaining the records. This is an administrative action; the portal does not automatically decide promotion eligibility. |
| Attendance | Subject attendance and separate daily whole-class attendance | Class teachers can mark the school day once; subject teachers can still record their own lessons. Past dates remain attached to the student. |
| Fees and receipts | Bursar assigns fees, records payment evidence, verifies payment, and issues a fixed receipt | Pending payment claims do not reduce the balance. Duplicate references, overpayments, and repeat verification are checked. Published receipts preserve their original details. |
| School purse and payroll | Bursar requests an expense/salary; principal approves; bursar records the actual payment and voucher | A request cannot be paid before approval. Approved salary rates and the cashbook reduce repeated calculations. The app records transfers; it does not transfer real funds. |
| Parent portal | ICT verifies and links children to a parent email account | Parents can view only their linked children's published reports, placements, attendance, fee balances, and verified receipts. Confidential support notes and other children's results are excluded. |
| Student support | Authorized teachers/academic staff record a concern, agreed action, follow-up date, and resolution | Support actions are less likely to disappear in a notebook or an individual teacher's memory. Notes are confidential staff records. |
| Timetable and cover | Staff enter weekly lessons; leaders assign a dated substitute | Overlapping class, teacher, or room bookings are rejected. This is a manual planner with conflict checks, not an automatic timetable generator. |
| Shared meetings | Academic leadership schedules meetings, supplies a video link, and records shared minutes/action owners | Staff can review decisions without meeting physically. The video provider hosts the call; the portal does not provide native video or email invitations. |
| Password changes | Any signed-in user can change their own password using the current password | Testing credentials can be replaced with personal passwords. Passwords are salted/hashed, failed attempts are limited, and a password change revokes existing sessions. |
| Backups and recovery | Daily-on-use and manual snapshots; local SQLite recovery utility; private hosted JSON backup downloads | School records have a recovery path. Hosted backups can be validated and recovered to a local database. Backups need appropriate school retention and off-device controls. Hosted production restore is a supervised maintenance/migration task, not a browser button. |

## A teacher's day

1. Sign in with the account ICT created for that individual teacher.
2. Open **My subjects**, choose a class, and select **Enter scores**. The academic lead/principal must first create the assessment for that class/session/term.
3. Open the assigned subject. Enter marks manually, or download and upload its CSV template.
4. Save drafts as needed. Submit only after every student's mark is present.
5. A class teacher opens **Results & records**, checks that every subject teacher has submitted, saves report comments, and confirms the class check.
6. The academic lead approves the checked assessment and publishes reports. Students and linked parents see their own reports; staff can review the class sheet and rankings.

## A principal and ICT administrator's workflow

The principal starts with the attention queue, approves payment requests, reviews academic publication, and manages the active session. ICT maintains admissions, staff access, subject/class assignments, verified parent links, and later-session student placements. Operational tools remain behind menus instead of putting every setup form on the home screen.

## A student and parent's workflow

Students use their admission number. Their fees, receipts, attendance, and reports stay linked to the same admission record as they move through classes. Parents use their own verified email account and can switch only between children ICT linked to them. Neither account can change marks or approve payments.

## Technical issues corrected during development

- SQLite returns rows with null prototypes. Passing these directly from a Next.js Server Component into a Client Component caused a runtime error. Account and register data now cross that boundary as plain objects without password hashes.
- Saving attendance could reset visible inputs to “Unmarked” even though the server had saved them. The form now keeps the chosen values visible and shows confirmation; reload checks verified persistence.
- Same-day receipts and date-only payouts could appear in an unhelpful cashbook sequence. The cashbook and CSV now share the same calculation/order.
- The local server stopping made localhost unavailable. The development server was restarted in the background. A hosted deployment removes the requirement for each visitor to run a local development server.
- Promotion would previously have depended on one mutable current-class field. Enrollment history and fixed assessment rosters now preserve the old context.
- A local SQLite file would not provide durable shared storage in Netlify's function runtime. Hosting uses PostgreSQL with committed schema/data migrations, while local development retains SQLite. Private backup files are stored separately from transactional data.

## Running and recovering locally

Start: `npm run dev -- --port 3001`.

Create a local SQLite backup: `npm run backup`.

Restore a local SQLite backup after stopping the portal:

```powershell
node --env-file-if-exists=.env.local scripts/babc-backup.mjs --restore <filename-in-.data/backups> --confirm
```

Recover a downloaded hosted JSON backup to the local school database after stopping the portal:

```powershell
npm run restore:records -- C:\private-school-backups\backup.json --confirm
```

Recovery saves the previous local database first, validates the backup, restores records transactionally, and revokes old login sessions. Do not treat a hosted production restore as a routine deployment rollback.

## Limits before using real school data

The deployed initial dataset is fictional, with the requested trial accounts. Staff should change trial passwords and ICT should create individual accounts before a school rollout. The school must confirm grading rules, subject combinations/electives, retention, who may approve/publish, and parent relationships. The MVP uses common subjects per class; it does not yet handle individual elective subject combinations in rankings. Live payment collection, SMS/email delivery, automatic timetable generation, and native video calling are separate integrations.
