import { readFileSync,mkdirSync } from "node:fs";
import { join,resolve } from "node:path";
import { createConnection } from "node:net";
import { backup } from "node:sqlite";
import { SchoolDatabase } from "../src/lib/babc/database";
import { restoreLogicalBackup } from "../src/lib/babc/logical-backup";
const args=process.argv.slice(2),filename=args.find(a=>a!=="--confirm");
if(!filename||!args.includes("--confirm"))throw new Error("Usage: npm run restore:records -- path/to/backup.json --confirm. Stop the school server first. This replaces local records after saving a recovery copy.");
const listening=await new Promise(resolve=>{const socket=createConnection({host:"127.0.0.1",port:3001});socket.on("connect",()=>{socket.destroy();resolve(true);});socket.on("error",()=>resolve(false));});
if(listening)throw new Error("Stop the portal on port 3001 before recovery.");
const dir=resolve(process.env.BABC_DB_DIRECTORY||".data"),folder=join(dir,"backups");mkdirSync(folder,{recursive:true});const db=new SchoolDatabase(join(dir,"babc-school.sqlite"));try{await backup(db.sql,join(folder,`before-json-restore-${Date.now()}.sqlite`));restoreLogicalBackup(db.sql,JSON.parse(readFileSync(resolve(filename),"utf8")));console.log("School records recovered to the local database. All prior sessions were revoked. Restart the portal and check the records before any hosted-data import.");}finally{db.sql.close();}
