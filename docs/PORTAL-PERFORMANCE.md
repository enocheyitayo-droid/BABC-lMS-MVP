# Portal performance changes

## Avoidable request work removed

- Authentication no longer waits for the daily backup check. Next.js `after` runs the existing private daily backup work after the response; manual backups still wait for completion.
- Session lookup and dashboard counters use React's request-scoped cache. This does not cache permissions, marks or receipts between users or requests.
- Dashboard counters use one SQL read, shared by dashboard cards and attention summaries within a render.
- The six-month finance chart uses one grouped query instead of twelve separate monthly queries.
- Finance/debtor screens and exports use two bulk fee/payment reads plus a roster read instead of three extra reads per student. Charge/payment ordering, verified-only totals and role restrictions remain the same.
- Office routes load fee records, account lists, salaries, payables and payment queues only on the screens that use them.
- Academic attention is one scoped query, with teacher assignment and class-teacher access checks preserved. Published assessments are omitted from pending tasks.
- Supabase refresh middleware is limited to the original /dashboard, /login and /access routes. BABC public and /portal routes use the existing BABC server-side authentication and do not take an unrelated Supabase middleware hop.
- Added an immediate portal loading state and a disabled Signing in button while login is pending. Loading animation respects reduced motion.

## Validation

116 tests pass across the full suite and the corrected routing-helper run. Tests compare old and batched fee statements, verify one-query chart/counter/task budgets, check teacher scope, execute the new queries on PostgreSQL, and check proxy route matching. Type checking, lint and production build pass.

Next's installed docs describe after and request-scoped React cache. Netlify documents support for asynchronous work after responses in its [Next.js support matrix](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).

## Measurement limits

A pre-change Netlify sample for /portal/office included one request at 2,118 ms and four at 283–605 ms. These include route-data and navigation variants; they are edge request durations, not a controlled user-device benchmark. They do not establish one explanation for every delay. Database query budgets are verified independently. Compare live behaviour after deployment before promising a specific speedup.
