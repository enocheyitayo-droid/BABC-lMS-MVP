import { pupils,requireDemo,subjects } from "@/lib/demo/store";
import { classScoreSheet,resultPeriod } from "@/lib/demo/results";
import { toCsv } from "@/lib/demo/csv";
export const runtime="nodejs";
export async function GET(request:Request){
  const context=await requireDemo(["school_admin","teacher"]),p=new URL(request.url).searchParams,period=resultPeriod(p.get("period"));
  const available=pupils(context),group=p.get("class")??available[0]?.class_name;
  if(!group||!available.some(s=>s.class_name===group))return new Response("Class access denied",{status:403});
  const sheet=classScoreSheet(context,group,period),rows:unknown[][]=[["School","Session","Term","Assessment","Class","Admission","Pupil","Subject","CA","Exam / score","Subject total","Report status","Class position"]];
  for(const item of sheet)for(const subject of subjects){const s=item.rows.find(r=>r.subject===subject);rows.push(["Teamville Montessori School","2026/2027","First term",period,group,item.pupil.admission,`${item.pupil.first_name} ${item.pupil.last_name}`,subject,period==="midterm"?"":s?.ca??"",s?.exam??"",s?s.ca+s.exam:"",item.state,item.position??""]);}
  return new Response(toCsv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="teamville-${period}-reference-sheet.csv"`,"Cache-Control":"private, no-store"}});
}
