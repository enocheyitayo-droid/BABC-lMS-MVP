"use client";
import { useFormStatus } from "react-dom";
export function ConfirmSubmit({children,message,className="button primary",name,value}:{children:React.ReactNode;message:string;className?:string;name?:string;value?:string}) {
  const {pending}=useFormStatus();
  return <button type="submit" name={name} value={value} className={className} disabled={pending} onClick={event=>{if(!window.confirm(message))event.preventDefault();}}>{pending?"Saving…":children}</button>;
}
