# Results uploads and financial accountability

This extends the local, fictional-data MVP. It does not initiate bank transfers, send emails or integrate the new modules with production Supabase tables.

## Teachers and results

Teachers can enter marks or upload a UTF-8 CSV exported from Excel, separately for **mid-term** and **examinations**. The assigned Primary 3 class restriction is enforced on the server for both entry and uploads. Download the template from the selected result tab. Templates omit published pupils and include only pupils available to the selected role.

- Mid-term CSV: `admission,subject,score` with scores from 0 to 100.
- Examination CSV: `admission,subject,ca,exam` with CA from 0 to 40 and exams from 0 to 60.
- Each pupil included in an upload needs all four demonstration subjects exactly once.
- Files must be `.csv`, at most 100 KB, and at most 400 score rows.
- Files are validated and saved in one transaction. Any invalid, duplicate, unassigned or published record rolls back the entire upload.
- Uploads publish immediately to the pupil portal. Teachers can also save manual drafts or publish entered marks directly, without administrator approval. Mid-term and examination publication states and immutable snapshots are separate.
- The demo is still fixed to first term 2026/2027. Session/term/subject/grade configuration is required before a real school pilot.

## Debtors and opening arrears

`/demo/debtors` is available only to the administrator and bursar. Filter by class, name/admission, and unpaid/part-paid status. Print or export the same filtered set to CSV, with amounts in naira. Only positive calculated balances appear. Pending payments do not reduce debt. CSV cells are escaped and spreadsheet formula prefixes are neutralised.

Pupil statements allow the bursar or administrator to post a new fee charge or opening arrears with a unique reference and description. This creates a charge and an audit entry; it does not overwrite a balance or add cash to the purse. This MVP does not support editing or reversing posted charges.

## School purse and payables

The purse is calculated as **verified pupil receipts + recorded opening funding/other income − recorded paid salaries and expenses**. Pupil fee receivables and unpaid school obligations are separate; neither is treated as cash.

1. Switch to **Bursar**, open School purse, and record a Salary or Expense payable with its amount, purpose and unique invoice/request reference.
2. Switch to **School administrator** and approve or reject the request. The requester role cannot approve it.
3. Switch back to **Bursar**, enter the actual payment method, date and bank/cash reference, and record payment.
4. The payment is recorded once, the purse is reduced, an audit entry and voucher are saved, and a salary notice is added to the selected staff member's in-app inbox.

Insufficient purse funds block disbursement. The balance and status are rechecked inside the write transaction. Duplicate salary month/staff requests and duplicate payment references are rejected. A repeated payout action does not deduct cash twice or issue duplicate salary notifications.

`/demo/purse/ledger` shows a printable cashbook with money in, money out and a running balance. It uses posting timestamps in UTC; credits precede debits when timestamps match to the second. This is not bank reconciliation or a complete double-entry general ledger.

## Salary slips

Teachers can open **Salary records & slips** and see only staff-1, Mrs Demo Adeola, in the demonstration. Other teacher IDs and expense vouchers are denied server-side. Administrators and bursars see the full payroll list. Only paid salary records have payslips, which can be printed or saved through the browser's PDF print option.

Salary notices are delivered **in-app only**. Email delivery, real staff identities and verified email addresses require an email provider and production account integration. Salary deductions, allowances, tax/pension calculations, evidence uploads, reversals and banking remain outside this MVP. Approval actors are demonstration roles, not individual production staff accounts.

## Presentation extension

Show a teacher importing four mid-term scores for one assigned pupil, then publishing directly. Show a Primary 3 debtor list and its CSV export. Finally, request a ₦120,000 salary as bursar, approve it as head of school, record the payment as bursar, and switch to teacher to show the in-app salary notice and printable payslip. Reopen the cashbook and audit trail to connect the transaction to its records.


## Simplified salary request

Choose Salary, select the teacher and review the automatically selected current month. The saved demo monthly salary is shown immediately; changing the teacher updates the summary. The server generates the purpose and a unique salary reference on submission and loads the authoritative amount from the workspace's staff payroll settings. No supplier, amount, reference or purpose typing is needed for salary requests. Expense requests retain their own fields. Duplicate staff/month prevention and the existing approval/payment workflow remain in place.

Demo presets: Mrs Demo Adeola ₦120,000; Mr Demo Chidi ₦110,000; Mrs Demo Bisi ₦100,000. These are fictional stored settings, not actual school salary figures. Existing demo workspaces are backfilled without overwriting saved payroll amounts. Payroll-setting administration remains a production integration task.


## Teacher publication and reference copies

Manual score entry is the primary workflow; optional CSV import is collapsed by default. Teachers publish directly for assigned pupils. The CSV upload saves and publishes all valid included reports atomically. The administrator receives a reference copy via downloadable CSV or a printable score sheet; the app does not send an email. Published snapshots remain preserved and locked.

The class leaderboard ranks complete published reports within the same class and assessment, using competition ties (1, 2, 2, 4). Positions remain provisional until all active enrolled pupils have complete published reports. Guardian views show their own linked child and anonymise classmates, hiding peers’ identifiers and marks. Other classes, school workspaces, incomplete reports and drafts are excluded. The MVP continues to use one fixed demonstration term and session.
