import { createHash,randomUUID } from "node:crypto";
import { allowed,type Account,type SchoolDatabase } from "./database";
export const websiteSchema=`
CREATE TABLE IF NOT EXISTS website_submissions(id TEXT PRIMARY KEY,kind TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','In review','Contacted','Closed')),created_at TEXT NOT NULL,fingerprint TEXT NOT NULL UNIQUE);
CREATE INDEX IF NOT EXISTS website_submission_email ON website_submissions(email,created_at);
CREATE TABLE IF NOT EXISTS website_events(id TEXT PRIMARY KEY,title TEXT NOT NULL,category TEXT NOT NULL,event_date TEXT NOT NULL DEFAULT '',description TEXT NOT NULL,location TEXT NOT NULL DEFAULT '',published INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL);
`;
export const eventDefaults=[{id:'midterm',title:'Midterm assessments',category:'Academic calendar',description:'A checkpoint for learning and progress. The school will confirm the assessment dates and class arrangements.'},{id:'examinations',title:'End-of-term examinations',category:'Academic calendar',description:'Preparation, revision and examination information for students and families. Dates will be published once approved.'},{id:'career-day',title:'Career Day conversations',category:'Career Day',description:'Meet people, explore different professions and discover how today’s learning connects with tomorrow’s opportunities.'}];
export const submissionKinds=['admission','enquiry','career-attend','career-speak','career-sponsor'] as const;
export type SubmissionKind=typeof submissionKinds[number];
export type WebsiteEvent={id:string;title:string;category:string;event_date:string;description:string;location:string;published:number};
export function initializeWebsite(db:Pick<SchoolDatabase,"sql">){db.sql.exec(websiteSchema);for(const e of eventDefaults)db.sql.prepare("INSERT OR IGNORE INTO website_events(id,title,category,event_date,description,location,published,updated_at) VALUES(?,?,?,'',?,'',1,?)").run(e.id,e.title,e.category,e.description,new Date().toISOString());}
function clean(form:FormData,key:string,max:number,required=false){const value=String(form.get(key)||'').trim();if(value.length>max||required&&!value)throw new Error(`Please check ${key.replaceAll('_',' ')}.`);return value;}
export class WebsiteRecords{
 constructor(readonly db:SchoolDatabase){}
 submit(form:FormData){
  if(clean(form,'website',200))throw new Error('Unable to accept this submission.');
  const kind=clean(form,'kind',30) as SubmissionKind;if(!submissionKinds.includes(kind))throw new Error('Choose a valid form.');
  const name=clean(form,'name',100,true),email=clean(form,'email',254,true).toLowerCase(),phone=clean(form,'phone',35,true);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^\+?[\d\s().-]{7,35}$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15)throw new Error('Enter a valid email address and phone number.');
  if(form.get('consent')!=='yes')throw new Error('Please confirm that the school may contact you.');
  const payload:Record<string,string>={message:clean(form,'message',2000,true)};
  if(kind==='admission'){payload.student_name=clean(form,'student_name',100,true);payload.entry_class=clean(form,'entry_class',20,true);if(!['JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3'].includes(payload.entry_class))throw new Error('Choose an entry class.');payload.previous_school=clean(form,'previous_school',150);}
  if(kind.startsWith('career-')){payload.organisation=clean(form,'organisation',150);payload.topic=clean(form,'topic',200,kind==='career-speak');payload.support=clean(form,'support',300,kind==='career-sponsor');}
  const fingerprint=createHash('sha256').update(JSON.stringify({kind,name,email,phone,payload})).digest('hex');
  return this.db.transaction(()=>{const existing=this.db.sql.prepare('SELECT id FROM website_submissions WHERE fingerprint=?').get(fingerprint) as {id:string}|undefined;if(existing)return existing.id;
   const count=this.db.sql.prepare('SELECT count(*) n FROM website_submissions WHERE email=? AND created_at>?').get(email,new Date(Date.now()-3600000).toISOString()) as {n:number};if(Number(count.n)>=3)throw new Error('Please wait an hour before sending another request with this email.');
   const id=`BABC-${randomUUID()}`;this.db.sql.prepare("INSERT INTO website_submissions(id,kind,name,email,phone,payload,status,created_at,fingerprint) VALUES(?,?,?,?,?,?,'New',?,?)").run(id,kind,name,email,phone,JSON.stringify(payload),new Date().toISOString(),fingerprint);return id;});
 }
 inbox(actor:Account){allowed(actor,['principal','ict']);return this.db.sql.prepare('SELECT id,kind,name,email,phone,payload,status,created_at FROM website_submissions ORDER BY created_at DESC LIMIT 250').all() as {id:string;kind:string;name:string;email:string;phone:string;payload:string;status:string;created_at:string}[];}
 status(actor:Account,id:string,status:string){allowed(actor,['principal','ict']);if(!['New','In review','Contacted','Closed'].includes(status))throw new Error('Choose a valid status.');this.db.transaction(()=>{if(!this.db.sql.prepare('SELECT id FROM website_submissions WHERE id=?').get(id))throw new Error('Submission not found.');this.db.sql.prepare('UPDATE website_submissions SET status=? WHERE id=?').run(status,id);this.db.log(actor,`Website submission ${id} marked ${status}`);});}
 events(){return this.db.sql.prepare('SELECT id,title,category,event_date,description,location,published FROM website_events WHERE published=1 ORDER BY event_date,title').all() as WebsiteEvent[];}
 allEvents(actor:Account){allowed(actor,['principal','ict','academic_lead']);return this.db.sql.prepare('SELECT * FROM website_events ORDER BY title').all() as WebsiteEvent[];}
 saveEvent(actor:Account,form:FormData){allowed(actor,['principal','ict','academic_lead']);const id=clean(form,'id',80)||randomUUID(),title=clean(form,'title',120,true),category=clean(form,'category',60,true),date=clean(form,'event_date',10),description=clean(form,'description',1500,true),location=clean(form,'location',150);if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(`${date}T12:00:00Z`))||new Date(`${date}T12:00:00Z`).toISOString().slice(0,10)!==date))throw new Error('Enter a valid event date or leave it blank.');const published=form.get('published')==='yes'?1:0;this.db.transaction(()=>{this.db.sql.prepare('INSERT INTO website_events(id,title,category,event_date,description,location,published,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,category=excluded.category,event_date=excluded.event_date,description=excluded.description,location=excluded.location,published=excluded.published,updated_at=excluded.updated_at').run(id,title,category,date,description,location,published,new Date().toISOString());this.db.log(actor,`Updated website event ${id}`);});}
}
