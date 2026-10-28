"use server";
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAccount,schoolDb } from './server';
import { WebsiteRecords } from './website';
export type WebsiteFormState={error?:string;reference?:string};
export async function submitWebsiteForm(_state:WebsiteFormState,form:FormData):Promise<WebsiteFormState>{try{const id=new WebsiteRecords(schoolDb()).submit(form);return {reference:id};}catch(error){const message=error instanceof Error?error.message:'';return {error:/^(Please|Enter|Choose|Unable to accept)/.test(message)?message:'Your request could not be saved. Please try again later or contact the school.'};}}
export async function websiteOfficeAction(form:FormData){const actor=await requireAccount(['principal','ict','academic_lead']);let error='';try{const records=new WebsiteRecords(schoolDb());if(form.get('operation')==='event')records.saveEvent(actor,form);else records.status(actor,String(form.get('id')),String(form.get('status')));}catch(e){error=e instanceof Error?e.message:'Unable to save.';}for(const path of ['/','/events','/events/career-day','/portal/website'])revalidatePath(path);redirect(`/portal/website?${new URLSearchParams(error?{error}:{success:'Saved.'})}`);}
