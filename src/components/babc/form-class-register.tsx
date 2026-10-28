"use client";
import { useActionState,useState } from "react";
import { saveFormClassAttendance } from "@/lib/babc/actions";
import { Feedback } from "./ui";
type Row={id:string;name:string;admission:string;status:string|null};
export function FormClassRegister({className,date,rows}:{className:string;date:string;rows:Row[]}){
  const [statuses,setStatuses]=useState<Record<string,string>>(()=>Object.fromEntries(rows.map(r=>[r.id,r.status||"Unmarked"])));
  const [state,action,pending]=useActionState(async(_:{error?:string;success?:string},form:FormData)=>saveFormClassAttendance(form),{});
  return <form action={action} onReset={event=>event.preventDefault()}><input type="hidden" name="class_name" value={className}/><input type="hidden" name="date" value={date}/><Feedback {...state}/><div className="babc-mark-all"><span>{rows.length} students</span><button type="button" className="babc-btn babc-secondary" disabled={pending||!rows.length} onClick={()=>setStatuses(Object.fromEntries(rows.map(r=>[r.id,"Present"])))}>Mark all present</button></div><div className="babc-table-wrap"><table className="babc-table babc-register"><thead><tr><th>Student</th><th>Attendance</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><strong>{row.name}</strong><small>{row.admission}</small></td><td><select aria-label={`${row.name} class attendance`} name={`status-${row.id}`} value={statuses[row.id]} onChange={e=>setStatuses({...statuses,[row.id]:e.target.value})}>{["Unmarked","Present","Absent","Late","Excused"].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div><div className="babc-form-footer"><span>Mark all present, then change anyone who is absent or late.</span><button className="babc-btn babc-primary" disabled={pending||!rows.length}>{pending?"Saving…":"Save class attendance"}</button></div></form>;
}
