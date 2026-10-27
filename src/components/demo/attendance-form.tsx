"use client";
import { useState } from "react";
import { saveAttendance } from "@/lib/demo/actions";
type RegisterPupil = {id:string;first_name:string;last_name:string;admission:string};
export function AttendanceForm({pupils,date,className,initial}: {pupils:RegisterPupil[];date:string;className:string;initial:Record<string,string>}) {
  const [marks,setMarks] = useState(initial);
  const [pending,setPending] = useState(false);
  return <form action={async data=>{setPending(true);try{await saveAttendance(data);}finally{setPending(false);}}}><input type="hidden" name="date" value={date}/><input type="hidden" name="class" value={className}/><div className="register-tools"><span>{pupils.length} pupils in this register</span><button type="button" className="button secondary" onClick={()=>setMarks(Object.fromEntries(pupils.map(p=>[p.id,"Present"]))) }>Mark all present</button></div><div className="table-wrapper"><table><thead><tr><th>Pupil</th><th>Admission number</th><th>Attendance</th></tr></thead><tbody>{pupils.map(p=><tr key={p.id}><td className="pupil-name">{p.first_name} {p.last_name}</td><td>{p.admission}</td><td><select aria-label={`${p.first_name} ${p.last_name} attendance`} name={`status_${p.id}`} value={marks[p.id]??"Present"} onChange={e=>setMarks({...marks,[p.id]:e.target.value})}>{["Present","Absent","Late","Excused"].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div><div className="form-bottom"><p>Saving again records a correction without creating duplicate attendance entries.</p><button disabled={pending} className="button primary">{pending?"Saving register…":"Save attendance register"}</button></div></form>;
}
