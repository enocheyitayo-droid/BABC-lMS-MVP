import type {SchoolDatabase} from './database';
export function readDashboardCounts(db:SchoolDatabase){return db.sql.prepare(`SELECT
(SELECT count(*) FROM students WHERE status='Active') students,
(SELECT count(*) FROM accounts WHERE role='teacher' AND status='Active') teachers,
(SELECT count(*) FROM accounts WHERE role NOT IN ('student','parent') AND status='Active') staff,
(SELECT count(*) FROM accounts WHERE status='Pending') pending_accounts,
(SELECT count(*) FROM payables WHERE status='Requested') approvals,
(SELECT count(*) FROM payments WHERE status='Pending') pending_payments,
(SELECT count(*) FROM reports)+(SELECT count(*) FROM academic_reports) reports`).get() as {students:number;teachers:number;staff:number;pending_accounts:number;approvals:number;pending_payments:number;reports:number};}
export function monthlyFinance(db:SchoolDatabase,from:string,to:string){return db.sql.prepare(`SELECT substr(verified_at,1,7) month_key,'income' kind,sum(amount) amount FROM payments WHERE status='Verified' AND substr(verified_at,1,7)>=? AND substr(verified_at,1,7)<=? GROUP BY substr(verified_at,1,7)
UNION ALL SELECT substr(paid_at,1,7) month_key,'expense' kind,sum(amount) amount FROM payables WHERE status='Paid' AND substr(paid_at,1,7)>=? AND substr(paid_at,1,7)<=? GROUP BY substr(paid_at,1,7)`).all(from,to,from,to) as {month_key:string;kind:'income'|'expense';amount:number}[];}
