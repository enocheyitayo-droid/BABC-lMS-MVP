// Local recovery utility. Stop the portal before restoring; never delete records
// through the browser. The current database is saved before a restore.
import { DatabaseSync,backup } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve,join,basename } from "node:path";
import { createConnection } from "node:net";
const dir=resolve(process.env.BABC_DB_DIRECTORY||".data"),folder=join(dir,"backups"),target=join(dir,"babc-school.sqlite");
mkdirSync(folder,{recursive:true});
const restore=process.argv.indexOf("--restore");
if(restore!==-1){
  if(!process.argv.includes("--confirm"))throw new Error("Restore replaces the current database. Supply --confirm after reviewing the chosen backup.");
  const name=process.argv[restore+1];if(!name||basename(name)!==name||!name.endsWith(".sqlite"))throw new Error("Choose a .sqlite filename inside .data/backups.");
  const listening=await new Promise(resolve=>{const socket=createConnection({host:"127.0.0.1",port:3001});socket.on("connect",()=>{socket.destroy();resolve(true);});socket.on("error",()=>resolve(false));});
  if(listening)throw new Error("Stop the school server on port 3001 before restoring.");
  const source=new DatabaseSync(join(folder,name),{readOnly:true});
  try{const result=source.prepare("PRAGMA quick_check").get();if(Object.values(result)[0]!=="ok"||!source.prepare("SELECT name FROM sqlite_master WHERE name='accounts'").get()||source.prepare("PRAGMA foreign_key_check").all().length)throw new Error("This is not a valid school backup.");const current=new DatabaseSync(target);try{await backup(current,join(folder,`before-restore-${Date.now()}.sqlite`));}finally{current.close();}await backup(source,target);console.log("Restore completed. Restart the portal. A copy of the previous database is in backups.");}finally{source.close();}
}else{const db=new DatabaseSync(target);try{const name=`manual-${Date.now()}.sqlite`;await backup(db,join(folder,name));console.log(`Backup saved: ${name}`);}finally{db.close();}}
