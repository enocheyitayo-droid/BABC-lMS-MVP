// Translate only the small SQLite dialect used by the local demo. Values remain
// bound parameters; never interpolate user-supplied values into the SQL text.
export function postgresSql(sql:string){
  let translated=sql.trim().replace(/\bINSERT OR IGNORE\b/gi,"INSERT").replace(/\browid\b/gi,"id");
  if(/^BEGIN IMMEDIATE\s*;?$/i.test(translated))return "BEGIN; SELECT pg_advisory_xact_lock(174983551)";
  if(/\bINSERT OR IGNORE\b/i.test(sql))translated=translated.replace(/;?$/," ON CONFLICT DO NOTHING");
  let output="",quoted=false,index=0;
  for(let i=0;i<translated.length;i++){
    const c=translated[i];
    if(c==="'"){output+=c;if(quoted&&translated[i+1]==="'"){output+="'";i++;}else quoted=!quoted;}
    else output+=c==="?"&&!quoted?`$${++index}`:c;
  }
  return output;
}
