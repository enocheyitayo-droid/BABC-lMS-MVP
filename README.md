# BABC secondary school MVP

See [the full school walkthrough](docs/MVP-WALKTHROUGH.md) for roles, result review, permanent records, finance, parents, support, coordination, and recovery. [Portal operations documentation](docs/BABC-PORTAL.md) covers the earlier build and local setup.

Run `npm run dev -- --port 3001`, then open `/portal`. Tests: `npm test`; checks: `npm run lint`, `npm run typecheck`, and `npm run build`.

Hosting uses Netlify Database (PostgreSQL), committed migrations under `netlify/database/migrations`, and private Netlify Blobs backups. Local development uses SQLite under the ignored `.data` directory. `.env.local`, `.data`, and `.netlify` are never committed.

The initial hosted dataset is fictional. Trial accounts use the school-requested initial password; change passwords and create individual staff accounts before using real school records. No live payment transfer or email/SMS integration is connected.

---

# BABC secondary school portal

The new Bodija-Ashi Baptist College portal opens at `/portal/login`, with an interactive staff demonstration at `/portal`. Start it with `npm run dev` (or `npm run dev -- --port 3001` if port 3000 is occupied). It includes principal, ICT, bursar, teacher, academic lead, and student access; student signup/sign-in; fees, verified payments, receipts, school purse, payroll, and academic registers, using the supplied BABC crest.

**The BABC administration and student portals now have working authentication and a shared local SQLite backend.** Demo login uses fictional records; payment gateway collection is not connected. The earlier teaching collaboration preview retains its browser-saved records. See [BABC implementation and rollout notes](docs/BABC-PORTAL.md).

The original Teamville implementation is retained below and remains available at `/demo/start`.

## Teamville Montessori School — presentation MVP

A working local demonstration for the head of school in Ibadan. The interface uses navy, purple and gold from the supplied school screenshot. The school logo supplied by the user is included unchanged at public/brand/teamville-logo.png.

## Run the presentation

Requires Node.js **24.13 or newer in the 24 series** and npm. The local demo uses Node's experimental built-in SQLite module.

```powershell
npm ci
npm run dev
```

Open http://localhost:3000 and choose **Open demonstration**. No account, Supabase setup, or payment provider is required for the local presentation. The included, Git-ignored `.env.local` enables the demo locally. After a fresh clone, copy `.env.example` to `.env.local` and set `ENABLE_DEMO=true`.

For a presentation without development controls:

```powershell
npm run build
npm start
```

Stop the dev server before starting the production server on the same port. The demo entry point is `/demo/start`; the in-app walkthrough is `/demo/presentation`. A fresh walkthrough creates its own database workspace. **Do not enter real pupil information.**

## What you can demonstrate

- **Overview:** pupil counts, current attendance, verified collections, outstanding balances and charts calculated from stored records.
- **Admissions:** search and class filters, saved pupil admission, generated admission number, duplicate checks, pupil profiles.
- **Attendance:** class/date selection, mark all present, per-pupil statuses, persistence, corrections and audit entries.
- **Results:** separate mid-term and examination entry/CSV uploads, validated marks, draft → teacher publication, immutable snapshots and printable reports.
- **Fees:** assigned demo charges, fee accounts, partial offline payments, pending/verified distinction, idempotent verification and printable receipts.
- **Debtors:** class/status filters, opening arrears charges, printable and exportable outstanding lists.
- **School purse:** salary/expense debts, independent approval, recorded payouts, vouchers, funding and a printable cashbook.
- **Salary slips:** private teacher in-app notices and printable payslips.
- **Notices:** create and view school announcements.
- **Accountability:** activity log for saved school operations.
- **Role views:** administrator, Primary 3 teacher, bursar, and a guardian linked to Fikayo. Switching roles is an explicit demo capability, never a production authentication mechanism.

Seed: **20 fictional pupils**, eight classes, three fee categories and sample academic/attendance records. The first term of 2026/2027 is a fixed demonstration session; attendance uses the current date in `Africa/Lagos`. The first guardian is linked to `pupil-1`. Published results are available for that pupil. Tomiwa (`pupil-3`) starts with draft results; Zara (`pupil-2`) starts with ₦40,000 outstanding.

Use the browser's print dialog to print reports and receipts or save PDFs. Demo documents are labelled as fictional and receipts are not proof of real payment.

## Demo storage and isolation

SQLite lives in `.data/teamville-demo.sqlite`, outside version control. Every table is scoped to a workspace. The browser stores a random, HttpOnly token; only its SHA-256 hash is stored in the database. Workspaces expire after seven days and expired rows are removed when a fresh walkthrough starts. Each mutation checks the role on the server and operates on the workspace from that verified token. Teacher and guardian pupil access is additionally scoped.

This is a **local MVP**, not a production school system. Demo roles, school-year defaults, assessment weights and guardian links are intentionally fixed for the walkthrough. Sample payments apply to a whole pupil account; per-charge allocation, uploaded verification evidence and refund/reversal ledgers remain to be implemented. Local salary/expense approval and recorded payouts are included. Published reports are locked; an auditable correction UI is not implemented. There are no real Paystack charges, emails or invitation messages. CSV result uploads and in-app salary notices work locally; private supporting-document uploads remain pending.

For a hosted demonstration, use a Node 24 host with a persistent disk, HTTPS and `ENABLE_DEMO=true`. **Do not deploy the SQLite demo to Vercel's ephemeral filesystem.** Public demo hosting would also need resource limits and abuse controls. A shareable deployment has not been created by this task.

## Production foundation (separate from the demo)

The project also includes a Next.js + Supabase foundation:

- `/login`: Supabase password authentication with server-validated sessions.
- `/dashboard`: membership-scoped workspace and real active account count.
- `/dashboard/settings`: administrator-only school profile updates, audited by database triggers.
- School switching checks each selected school against the user's current membership.
- PostgreSQL RLS, separate platform identity table, least-privilege column grants, protected membership provisioning and read-only school audit history.

This foundation is **not yet connected** to a live Supabase project. Demo modules use SQLite, not the Supabase schema. Data migration and production module integration remain required.

### Configure Supabase

1. Create a dedicated Supabase project. Apply `supabase/migrations/202610270001_identity_and_tenancy.sql` in its SQL editor, or through the Supabase CLI migration workflow. Do not apply to an existing unrelated database.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. These are the project's public connection values, not the service-role key.
3. For initial local provisioning only, set `SUPABASE_SERVICE_ROLE_KEY`, `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (at least 12 characters). Run `npm run bootstrap`. The script creates the administrator if missing and assigns an administrator membership; it never prints the password, sends email, or resets an existing user's password.
4. Remove the service-role key and bootstrap password from `.env.local` when provisioning is done. The app itself does not require a service-role key.
5. Restart the app. `/login` now uses the real account; `/dashboard` requires an active membership. Missing configuration fails closed. Apply Supabase Auth rate limits, approved URLs, email confirmation and recovery settings for your deployment.

Provisioning is an operator script, not a complete platform super-admin portal. Real staff invitations, self-service account recovery, private document policies and the full production permission model must be completed before pilot onboarding. Do not consider the presence of RLS foundation tables sufficient to deploy the demonstration with real school data.

## Architecture and database design

```text
src/app/                    Next.js routes, protected production pages
src/app/demo/(workspace)/   Interactive demo pages
src/components/             Navigation, forms and shared UI
src/lib/demo/               Demo persistence and authorised server actions
src/lib/supabase/           Supabase server connection and configuration
src/lib/auth.ts             Server identity, membership and permission checks
supabase/migrations/        Production PostgreSQL schema and RLS
scripts/                    Operator-only bootstrap
tests/                      Demo workflows and PostgreSQL RLS tests
docs/                       Architecture and rollout plan
```

The production schema starts with schools, profiles, school memberships, platform administrators and audit logs. Each membership belongs to exactly one school and one profile. School-owned future tables will carry `school_id`, composite foreign keys to prevent cross-school joins, unique business constraints and operation-specific RLS. Pupil identity must be permanent; enrolments, guardian links, results and charges must remain separate historical records. Financial values use integer kobo in the demo and will use integer minor units / constrained numeric values in PostgreSQL.

See [the rollout plan](docs/IMPLEMENTATION.md) for the remaining production phases.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Tests use disposable SQLite databases and an embedded **PostgreSQL engine (PGlite)** with Supabase-style auth and database roles. They exercise actual RLS from the migration, rather than matching SQL text. They do not connect to a live project or use real payments. Hosted Supabase Auth, its cookie refresh and provider infrastructure require integration testing when credentials are configured.

The acceptance cases for promotion, graduation, cross-family production records, Paystack webhooks, refunds and production expense-approval identities are **not implemented in this MVP**. Do not infer those guarantees from the narrower demo tests.

## Branding provenance

The user provided a Google Images screenshot showing Teamville Montessori School materials and crest. The user later supplied the original Teamville logo, which is now used unchanged. The other supplied dashboards inform layout only; their logos and example statistics are not reused. Confirm the approved school contact details before pilot onboarding.

See [Results and accountability](docs/MVP-RESULTS-AND-ACCOUNTABILITY.md) for CSV formats, debtor exports, payroll approval and salary-slip delivery.

Teacher results now publish directly: manual marks can be saved as drafts or published; CSV uploads publish immediately. Class positions use complete published reports with ties and provisional labels. Reference score sheets can be downloaded or printed for the administrator; email delivery is manual. Family views reveal only their own child’s marks and position.
