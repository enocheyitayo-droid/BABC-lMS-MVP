// The small SQLite-style repository uses this translator only for bound SQL.
// Hosted schema is deployed exclusively through committed Netlify migrations.
export function hostedSql(sql:string){
  let translated=sql.trim().replace(/\browid\b/gi,"id").replace(/([\w.]+)\s*=\s*\?\s+COLLATE NOCASE/gi,"lower($1)=lower(?)").replace(/sum\(status IN \('Present','Late'\)\)/g,"sum((status IN ('Present','Late'))::int)").replace(/sum\(status='Absent'\)/g,"sum((status='Absent')::int)");
  if(/^BEGIN IMMEDIATE\s*;?$/i.test(translated))return "BEGIN; SELECT pg_advisory_xact_lock(174983552)";
  if(/\bINSERT OR IGNORE\b/i.test(translated))translated=translated.replace(/\bINSERT OR IGNORE\b/gi,"INSERT").replace(/;?$/," ON CONFLICT DO NOTHING");
  let out="",quoted=false,index=0;for(let i=0;i<translated.length;i++){const char=translated[i];if(char==="'"){out+=char;if(quoted&&translated[i+1]==="'"){out+="'";i++;}else quoted=!quoted;}else out+=char==="?"&&!quoted?`$${++index}`:char;}return out;
}
