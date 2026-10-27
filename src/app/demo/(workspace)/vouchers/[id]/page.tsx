import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { PrintButton } from "@/components/demo/print-button";
import { db,money,requireDemo } from "@/lib/demo/store";
import { type Obligation } from "@/lib/demo/finance";
export default async function Voucher({params}:{params:Promise<{id:string}>}){
  const context=await requireDemo(["school_admin","bursar","teacher"]),{id}=await params;
  const item=db().prepare("SELECT * FROM obligations WHERE workspace=? AND id=? AND status='Paid'").get(context.id,id) as Obligation|undefined;
  if(!item||context.role==="teacher"&&(item.kind!=="Salary"||item.staff_id!=="staff-1"))notFound();
  const payment=db().prepare("SELECT method,reference,paid_date FROM disbursement_details WHERE workspace=? AND obligation_id=?").get(context.id,id) as {method:string;reference:string;paid_date:string};
  return <main id="main-content" className="main-content"><div className="receipt-toolbar no-print"><PrintButton label="Print slip / save PDF"/></div><article className="receipt-sheet"><div className="receipt-header"><Brand/><div><h1>{item.kind==="Salary"?"Salary payslip":"Payment voucher"}</h1><p>{item.voucher}</p></div></div><div className="receipt-demo-label">Demonstration document · Fictional recorded payment · No bank transfer initiated</div><dl className="receipt-details">{[["Payee",item.payee],["Period",item.period??"School expense"],["Purpose",item.description],["Request reference",item.reference],["Payment date",payment.paid_date],["Method",payment.method],["Payment reference",payment.reference],["Approved by",item.approved_role],["Recorded by","Bursar"]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="receipt-total"><span>{item.kind==="Salary"?"Recorded salary paid":"Amount paid from purse"}</span><strong>{money(item.amount)}</strong></div><footer>Salary deductions, allowances and statutory payroll calculations are outside this demo.<br/>Payment records and audit history are retained. Delivery: in-app; email is not configured.</footer></article></main>;
}
