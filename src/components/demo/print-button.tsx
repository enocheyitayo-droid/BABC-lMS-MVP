"use client";
import { Printer } from "lucide-react";
export function PrintButton({label="Print / save PDF"}:{label?:string}) { return <button className="button secondary no-print" onClick={()=>window.print()}><Printer size={16}/>{label}</button>; }
