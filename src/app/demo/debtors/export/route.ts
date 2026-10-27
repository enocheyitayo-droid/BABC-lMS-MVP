import { requireDemo } from "@/lib/demo/store";
import { debtors } from "@/lib/demo/finance";
import { toCsv } from "@/lib/demo/csv";
export const runtime="nodejs";
export async function GET(request:Request){
  const context=await requireDemo(["school_admin","bursar"]),p=new URL(request.url).searchParams;
  const rows=debtors(context,p.get("class")??"",(p.get("q")??"").slice(0,80),p.get("status")??"all");
  return new Response(toCsv([["Pupil","Admission","Class","Guardian","Charged (NGN)","Verified paid (NGN)","Outstanding (NGN)"],...rows.map(r=>[`${r.pupil.first_name} ${r.pupil.last_name}`,r.pupil.admission,r.pupil.class_name,r.pupil.guardian,(r.billed/100).toFixed(2),(r.paid/100).toFixed(2),(r.balance/100).toFixed(2)])]),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=teamville-debtors.csv","Cache-Control":"private, no-store"}});
}
