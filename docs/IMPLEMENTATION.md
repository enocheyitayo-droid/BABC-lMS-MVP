# Architecture and delivery scope

The initial workspace contained only `.git`, with no application or package configuration. The original brief requested a modular school system. The user then narrowed the immediate goal to **an MVP to present to the head of school**. The implementation therefore separates a locally runnable, fictional-data demonstration from the production Supabase foundation.

## Interface direction

The supplied screenshot suggests navy and white for the crest, with purple and gold in school event materials. Tokens: school navy `#202057`, Montessori purple `#6840A2`, celebration gold `#EDBC4D`, surface `#F7F8FC`, text `#25263E`, attendance green `#297862`. Aptos / Segoe UI provides a readable Windows-first interface without network font dependencies. The school-and-learning-block illustration is built in CSS. It is decorative and is not claimed as a school asset.

```text
Desktop                           Mobile
┌───────────┬────────────────┐    ┌─────────────────────┐
│ school    │ role / school  │    │ menu / school / role│
│ navigation├────────────────┤    ├─────────────────────┤
│           │ demo label     │    │ demo label          │
│           │ school overview│    │ overview / metrics  │
│           │ metrics        │    │ daily workflows     │
│           │ daily workflows│    │ noticeboard         │
└───────────┴────────────────┘    └─────────────────────┘
```

Left-aligned operational content, clear form labels and printable documents take priority over decorative statistics. The review of the first design replaced an unconfigured setup-only dashboard with working demo workflows in response to the user's presentation goal.

## Production phases

1. **Foundation:** Next.js, Supabase Auth clients, school membership checks, minimal identity schema, RLS and audited profile updates are implemented in source. Hosted setup and verification remain outstanding.
2. **People:** implement real pupils, verified guardians, permanent pupil identities, academic sessions, terms, classes, enrolments, teacher assignments and private files. Demo admissions are not this production module.
3. **Academics:** configurable assessments and grading, attendance registers with correction approvals, draft/submitted/approved/published/versioned results, report cards and historical enrolments. Demo proves the basic workflow with fixed values.
4. **Finance:** fee schedules, invoices, per-charge allocations, decimal-safe amounts, idempotent Paystack verification, offline evidence, receipts, approved credits, reversals, refunds and reconciliation. The local MVP never contacts Paystack.
5. **Operations:** staff invitations, segregated expense approval, disbursements, audit review, configurable notices, notifications, support tickets and email delivery.
6. **Pilot:** promotion, graduation, eligible historical access, account recovery, rate limits, private storage policies, backup/restore tests, tenant penetration tests and school onboarding.

## Important relationships for future migrations

- Keep auth identity, school membership, pupil identity and guardian identity separate. Do not automatically grant access from an entered parent name.
- Enrolments reference school, academic session, class and pupil; promotion adds a new enrolment instead of overwriting history.
- Subject assignments and verified guardian links are required alongside role membership for per-record access.
- Attendance registers uniquely identify class enrolment and school date. Attendance corrections need actor, time and prior state.
- Published result versions contain immutable snapshots and approval metadata; a later correction creates a new version.
- Charges and verified allocated payments determine the account balance. Pending payments do not affect balances. Never expose a balance overwrite operation.
- Sensitive changes and privileged cross-school operations must be audited within the same database transaction.
- Platform administration must remain a separate audited access path, with no implicit cross-school rights for school accounts.

## Known boundaries

One role per user per school is supported in the foundation. Multiple simultaneous roles would require a membership-role join table and revised grants. The MVP's administrator can demonstrate finance verification; production separation of duties must be agreed with the school. The demo is capped at 100 fictional pupils per workspace. Multi-tenant demo isolation is tested but does not replace hosted Supabase end-to-end verification.
