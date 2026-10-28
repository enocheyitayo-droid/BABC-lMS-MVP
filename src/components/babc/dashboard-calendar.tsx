"use client";
import { useState } from "react";
import { ChevronLeft,ChevronRight } from "lucide-react";

export function DashboardCalendar({date}:{date:string}) {
  const [year,month,day]=date.split("-").map(Number);
  const [offset,setOffset]=useState(0);
  const shown=new Date(Date.UTC(year,month-1+offset,1));
  const y=shown.getUTCFullYear(),m=shown.getUTCMonth();
  const first=shown.getUTCDay(),days=new Date(Date.UTC(y,m+1,0)).getUTCDate();
  const title=shown.toLocaleDateString("en-GB",{month:"long",year:"numeric",timeZone:"UTC"});
  return <section className="babc-dash-calendar" aria-label="School calendar"><header><h2>{title}</h2><div><button onClick={()=>setOffset(offset-1)} aria-label="Previous month"><ChevronLeft size={16}/></button><button onClick={()=>setOffset(offset+1)} aria-label="Next month"><ChevronRight size={16}/></button></div></header><div className="babc-calendar-week" aria-hidden="true">{["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><span key={d}>{d}</span>)}</div><div className="babc-calendar-days">{Array.from({length:first},(_,i)=><span key={`blank-${i}`}/>)}{Array.from({length:days},(_,i)=><span key={i} aria-current={offset===0&&i+1===day?"date":undefined}>{i+1}</span>)}</div><footer><span className="babc-calendar-today"/>Today · {new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"})}{offset!==0&&<button onClick={()=>setOffset(0)}>Back to today</button>}</footer></section>;
}
