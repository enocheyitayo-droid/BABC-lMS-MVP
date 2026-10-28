import { requireAccount,schoolDb } from "@/lib/babc/server";
import { toCsv } from "@/lib/demo/csv";
export async function GET(request:Request){const actor=await requireAccount(["principal","bursar"]),db=schoolDb();const type=new URL(request.url).searchParams.get("type");let rows:unknown[][];
  if(type==="cashbook"){rows=[["Date","Reference","Description","Money in (NGN)","Money out (NGN)","Running balance (NGN)"],...db.cashbook(actor).map(e=>[e.date,e.reference,e.description,e.money_in/100,e.money_out/100,e.balance/100])];}
  else if(type==="fees"||type==="debtors"){const accounts=db.statements(actor).filter(a=>type!=="debtors"||a.balance>0);rows=[["Admission","Student","Class","Fees charged (NGN)","Verified payments (NGN)","Outstanding (NGN)"],...accounts.map(a=>[a.student.admission,a.student.name,a.student.class_name,a.billed/100,a.paid/100,a.balance/100])];}
  else return new Response("Unknown export",{status:400});
  return new Response(toCsv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="babc-${type}.csv"`,"Cache-Control":"private, no-store"}});
}
