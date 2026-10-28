import { afterEach,beforeEach,describe,expect,it } from "vitest";
import { SchoolDatabase,kobo,money,passwordHash,type Account,type Payment,type Payable } from "@/lib/babc/database";

let db:SchoolDatabase;
const role=(name:string)=>db.sql.prepare("SELECT id,name,email,role,student_id,status,demo FROM accounts WHERE id=?").get(`demo-${name}`) as Account;
beforeEach(()=>{db=new SchoolDatabase(":memory:",true);});
afterEach(()=>db.sql.close());
describe("BABC finance, approvals, and receipts",()=>{
  it("holds pending payments outside balances and issues one immutable receipt on verification",()=>{
    const bursar=role("bursar"),student=role("student"),before=db.statement(student,"s1");
    const id=db.recordPayment(student,"s1",2000000,"BANK-ONE","Bank transfer");
    expect(db.statement(student,"s1").paid).toBe(before.paid);
    expect(()=>db.receipt(student,id)).toThrow("Receipt not found");
    const receipt=db.verifyPayment(bursar,id,"Verified");
    expect(db.verifyPayment(bursar,id,"Verified")).toBe(receipt);
    expect(db.statement(student,"s1").paid).toBe(before.paid+2000000);
    const snapshot=db.receipt(student,id).receipt_snapshot;
    db.charge(bursar,["s1"],"Later practical fee",1000000,"LATER-FEE");
    expect(db.receipt(student,id).receipt_snapshot).toBe(snapshot);
  });
  it("prevents cross-student statements and receipts",()=>{
    const student=role("student");
    expect(()=>db.statement(student,"s2")).toThrow("not available");
    expect(()=>db.receipt(student,"seed-payment-2")).toThrow("not available");
    expect(()=>db.recordPayment(student,"s2",100000,"FORGED","Bank transfer")).toThrow("not available");
  });
  it("requires bursar authority for verification and fee charging",()=>{
    const id=db.recordPayment(role("student"),"s1",100000,"BANK-TWO","Bank transfer");
    for(const roleName of ["principal","ict","teacher","student"]){expect(()=>db.verifyPayment(role(roleName),id,"Verified")).toThrow("permission");expect(()=>db.charge(role(roleName),["s1"],"Fee",100000,"FORGED-FEE")).toThrow("permission");}
  });
  it("rejects duplicate references and verification that would overpay the account",()=>{
    const b=role("bursar"),s=role("student");
    const first=db.recordPayment(s,"s1",6000000,"REF-A","Bank transfer");
    const second=db.recordPayment(s,"s1",6000000,"REF-B","Bank transfer");
    expect(()=>db.recordPayment(s,"s1",100000,"REF-A","Bank transfer")).toThrow();
    db.verifyPayment(b,first,"Verified");
    expect(()=>db.verifyPayment(b,second,"Verified")).toThrow("remaining balance");
    expect((db.sql.prepare("SELECT * FROM payments WHERE id=?").get(second) as Payment).status).toBe("Pending");
  });
  it("rolls back an entire class fee batch when any charge reference conflicts",()=>{
    const b=role("bursar");db.charge(b,["s2"],"Existing",100000,"SAME");
    const before=db.statement(b,"s1").billed;
    expect(()=>db.charge(b,["s1","s2"],"Class fee",100000,"SAME")).toThrow();
    expect(db.statement(b,"s1").billed).toBe(before);
  });
  it("requires principal approval before payout and records it exactly once",()=>{
    const b=role("bursar"),p=role("principal"),before=db.purse(b).balance;
    expect(()=>db.payPayable(b,"seed-expense","OUT-1","Bank transfer","2026-10-27")).toThrow("approval");
    expect(()=>db.approvePayable(b,"seed-expense","Approved")).toThrow("permission");
    db.approvePayable(p,"seed-expense","Approved");
    const voucher=db.payPayable(b,"seed-expense","OUT-1","Bank transfer","2026-10-27");
    expect(db.payPayable(b,"seed-expense","OUT-1","Bank transfer","2026-10-27")).toBe(voucher);
    expect(db.purse(b).balance).toBe(before-3500000);
    expect(()=>db.payPayable(p,"seed-expense","OUT-2","Cash","2026-10-27")).toThrow("permission");
  });
  it("prevents duplicate salaries and uses the principal-approved rate",()=>{
    const item={kind:"Salary",payee:"Forged name",staffId:"staff-1",period:"2026-10",description:"Forged",amount:1,reference:"SAL-1"};
    db.requestPayable(role("bursar"),item);
    const saved=db.sql.prepare("SELECT * FROM payables WHERE reference='SAL-1'").get() as Payable;
    expect(saved.amount).toBe(12000000);expect(saved.payee).toBe("Mrs. Adebayo");
    expect(()=>db.requestPayable(role("bursar"),{...item,reference:"SAL-2"})).toThrow();
  });
  it("blocks approved payouts when the purse cannot cover the amount",()=>{
    const b=role("bursar"),p=role("principal");
    db.requestPayable(b,{kind:"Expense",payee:"Supplier",staffId:"",period:"",description:"Large cost",amount:9999999999,reference:"BIG"});
    const id=(db.sql.prepare("SELECT id FROM payables WHERE reference='BIG'").get() as {id:string}).id;
    db.approvePayable(p,id,"Approved");
    expect(()=>db.payPayable(b,id,"LARGE-PAYOUT","Cash","2026-10-27")).toThrow("insufficient");
  });
  it("parses naira without losing decimal precision and rejects invalid values",()=>{
    expect(kobo("5000.25")).toBe(500025);expect(money(500025)).toContain("5,000.25");
    for(const invalid of ["0","-1","1.001","NaN","1e6",""])expect(()=>kobo(invalid)).toThrow();
  });
  it("orders same-day receipts before date-only payouts and reconciles the cashbook with the purse",()=>{
    const b=role("bursar"),p=role("principal");
    const date=(db.sql.prepare("SELECT substr(created_at,1,10) date FROM funding LIMIT 1").get() as {date:string}).date;
    db.approvePayable(p,"seed-expense","Approved");db.payPayable(b,"seed-expense","CASHBOOK-OUT","Bank transfer",date);
    const ledger=db.cashbook(b);
    expect(ledger.at(-1)?.reference).toBe("CASHBOOK-OUT");
    expect(ledger.every(entry=>entry.balance>=0)).toBe(true);
    expect(ledger.at(-1)?.balance).toBe(db.purse(b).balance);
    expect(()=>db.cashbook(role("student"))).toThrow("permission");
  });
});

describe("BABC admission-based authentication",()=>{
  it("returns a plain account object safe to pass to a Client Component without credentials",()=>{
    const session=db.createSession("demo-teacher");
    const account=db.session(session.token)!;
    expect(Object.getPrototypeOf(account)).toBe(Object.prototype);
    expect(account).toEqual({id:"demo-teacher",name:"Mrs. Adebayo",email:"teacher@demo.babc.local",role:"teacher",student_id:null,status:"Active",demo:1});
    expect(account).not.toHaveProperty("password_hash");
    expect(account).not.toHaveProperty("token_hash");
    expect(db.session("missing")).toBeUndefined();
  });
  it("returns plain class register rows, including unmarked nullable values",()=>{
    const teacher=role("teacher");
    const rows=db.classRegisterRows(teacher,"a1","2026-10-27");
    expect(rows).toHaveLength(3);
    expect(rows.every(row=>Object.getPrototypeOf(row)===Object.prototype)).toBe(true);
    expect(rows.find(row=>row.id==="s1")).toEqual({id:"s1",name:"Akinwale, Tobiloba",admission:"BABC/26/001",ca:null,exam:null,status:null});
    expect(()=>db.classRegisterRows(role("student"),"a1","2026-10-27")).toThrow("permission");
  });
  it("creates only a pending student linked to the admission and consumes the activation code",()=>{
    const id=db.registerStudent({admission:"BABC/26/002",code:"BABC-DEMO-002"});
    const account=db.sql.prepare("SELECT * FROM accounts WHERE id=?").get(id) as Account&{password_hash:string};
    expect(account.role).toBe("student");expect(account.student_id).toBe("s2");expect(account.name).toBe("Balogun, Damilola");expect(account.status).toBe("Pending");expect(account.password_hash).not.toContain("BALOGUN");
    expect(()=>db.authenticate("BABC/26/002","BALOGUN")).toThrow("approval");
    expect(()=>db.registerStudent({admission:"BABC/26/002",code:"BABC-DEMO-002"})).toThrow("invalid or expired");
    db.sql.prepare("UPDATE accounts SET status='Active' WHERE id=?").run(id);
    expect(db.authenticate("BABC/26/002","BALOGUN").id).toBe(id);
  });
  it("rejects invalid/expired activation and forged, expired, or suspended sessions",()=>{
    expect(()=>db.registerStudent({admission:"BABC/26/002",code:"BAD-CODE"})).toThrow();
    const session=db.createSession("demo-student");expect(db.session(session.token)?.role).toBe("student");expect(db.session("forged")).toBeUndefined();
    db.sql.prepare("UPDATE accounts SET status='Suspended' WHERE id='demo-student'").run();expect(db.session(session.token)).toBeUndefined();
    db.sql.prepare("UPDATE accounts SET status='Active' WHERE id='demo-student'").run();db.sql.prepare("UPDATE sessions SET expires_at='2000-01-01'").run();expect(db.session(session.token)).toBeUndefined();
  });
  it("throttles repeated wrong-password attempts",()=>{
    db.sql.prepare("UPDATE accounts SET password_hash=? WHERE id='demo-student'").run(passwordHash("Correct-password-2026"));
    for(let i=0;i<5;i++)expect(()=>db.authenticate("babc/26/001","wrong")).toThrow("incorrect");
    expect(()=>db.authenticate("BABC/26/001","Correct-password-2026")).toThrow("15 minutes");
  });
  it("protects published result snapshots from later draft changes",()=>{
    db.sql.prepare("INSERT INTO scores VALUES('s1','a1',32,51)").run();
    expect(()=>db.publishReport(role("student"),"s1")).toThrow("permission");
    db.publishReport(role("principal"),"s1");
    const published=(db.sql.prepare("SELECT snapshot FROM reports WHERE student_id='s1' ORDER BY rowid DESC LIMIT 1").get() as {snapshot:string}).snapshot;
    db.sql.prepare("UPDATE scores SET ca=0,exam=0 WHERE student_id='s1' AND assignment_id='a1'").run();
    expect((db.sql.prepare("SELECT snapshot FROM reports WHERE student_id='s1' ORDER BY rowid DESC LIMIT 1").get() as {snapshot:string}).snapshot).toBe(published);
    expect(JSON.parse(published)[0]).toEqual({subject:"Biology",ca:32,exam:51});
  });
});
