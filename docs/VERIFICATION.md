# MVP verification

Verification performed locally on 27 October 2026 with Node 24.13.0.

## Automated checks

- Strict TypeScript check.
- ESLint.
- Production Next.js build.
- 20 automated tests across demo workflows and actual PostgreSQL RLS in PGlite.

Demo tests cover workspace isolation, forged cookies, role restrictions, admissions and duplicate checks, attendance upsert/corrections, invalid attendance and dates, invalid/missing scores, approval/publication and immutable published marks, partial payments, pending versus verified balances, duplicate verification, receipts, duplicate references and invalid amounts.

PostgreSQL tests apply the shipped migration to a clean PostgreSQL engine with Supabase-style roles. They cover cross-school reads/writes, teacher and guardian restrictions, self-promotion denial, activation privilege denial, transactional audit creation, audit tampering denial, membership revocation and anonymous access denial.

## Browser walkthrough

Exercised the real running Next.js app in an isolated browser context:

1. Created a demonstration workspace.
2. Admitted a fictional pupil through the actual form action and reopened the register.
3. Changed attendance through the hydrated client form, saved it, and reloaded the register to confirm persistence.
4. Saved scores, confirmed recalculated totals, submitted, then published as administrator.
5. Recorded ₦10,000 against a pupil with ₦40,000 outstanding. Pending balance remained ₦40,000.
6. Verified the payment; balance became ₦30,000 and a receipt rendered.
7. Published a fictional school announcement.
8. Switched to guardian and confirmed only the linked child appeared.
9. Manipulated the pupil ID in a finance URL and confirmed access was denied.
10. Switched to teacher and confirmed only Primary 3 pupils appeared.
11. Inspected the attendance layout at 390 × 844 CSS pixels: document width was 390px, with no page overflow.

The browser walkthrough caught a React serialization issue from SQLite's null-prototype rows; rows passed to client components are now converted to plain objects. This is why database tests alone are not treated as proof of browser functionality.

## Not validated

No live Supabase project, real Auth account, Paystack transaction, email delivery, production hosting, or school data was used. Print styling is implemented; physical printing and school sign-off remain outside local verification. The pending production scope is documented in README.md and IMPLEMENTATION.md.


## Results, payroll and logo extension

The expanded suite contains 29 tests, including independent mid-term/exam CSV imports, atomic import rollback, assignment restrictions, debtor filters, opening arrears, independent salary approval, duplicate payroll prevention, idempotent payout, insufficient-funds protection, funding and cashbook agreement.

A further 14 browser checks passed against the real Next.js routes: scoped teacher templates, CSV upload, independent mid-term publication, unchanged examination editing, payable creation, head-of-school approval, purse deduction, voucher creation, school logo/reference on the voucher, filtered debtor list and export, in-app teacher salary notice/payslip, and denied teacher access to debtor exports. School purse also fits at 390px with no page overflow.

The user-supplied logo was copied unchanged. SHA-256 of the original and public asset match: `5E6E52397B839B2E5CC4C89DCBDE749DFDD9ACE6C3A909F28B8B27AA36F3663A`.


## Direct teacher publication and class positions

The current suite has 36 passing tests. Additional coverage verifies direct publication of entered marks, one retained snapshot on repeat publication, rejection of unassigned/guardian publication, complete published-report ranking, competition ties, provisional class counts, guardian privacy and teacher-only class reference exports.

Nine browser checks passed on the production build: teacher publication through the actual confirmation button, removal of result-approval controls, reference CSV contents, printable score sheet and logo, immediate family access to published marks, own-child position and provisional count, anonymous classmates with hidden marks, denial of family class exports and denial of teacher exports from unassigned classes. CSV import is optional and collapsed by default. No actual emails were sent.
