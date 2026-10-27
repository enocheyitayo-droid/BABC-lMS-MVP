import { pupils,requireDemo,subjects } from "@/lib/demo/store";
import { resultPeriod,resultRows } from "@/lib/demo/results";
import { toCsv } from "@/lib/demo/csv";
export const runtime="nodejs";
export async function GET(request:Request){
  const context=await requireDemo(["school_admin","teacher"]),period=resultPeriod(new URL(request.url).searchParams.get("period"));
  const rows:unknown[][]=[period==="midterm"?["admission","subject","score"]:["admission","subject","ca","exam"]];
  for(const p of pupils(context)){
    const scores=resultRows(context,p.id,period);if(scores.some(s=>s.state==="Published"))continue;
    for(const subject of subjects){const s=scores.find(s=>s.subject===subject);rows.push(period==="midterm"?[p.admission,subject,s?.exam??""]:[p.admission,subject,s?.ca??"",s?.exam??""]);}
  }
  return new Response(toCsv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="teamville-${period}-template.csv"`,"Cache-Control":"private, no-store"}});
}
