import { backup,type DatabaseSync } from "node:sqlite";
import { existsSync,mkdirSync } from "node:fs";
import { join } from "node:path";
import { getStore,getDeployStore } from "@netlify/blobs";
import { logicalBackup } from "./logical-backup";
export const cloudStore=()=>process.env.CONTEXT==="production"?getStore({name:"babc-school-backups-production",consistency:"strong"}):getDeployStore({name:"babc-school-backups",consistency:"strong"});
export const hostedDatabase=(sql:DatabaseSync)=>Boolean((sql as DatabaseSync&{hosted?:boolean}).hosted);
let dailyWork:Promise<void>|undefined;
let lastDaily="";
export function dailyBackup(sql:DatabaseSync,dir:string,date:string){
  if(hostedDatabase(sql)){if(lastDaily===date)return;if(dailyWork)return dailyWork;dailyWork=(async()=>{const store=cloudStore(),key=`daily-${date}.json`;if(!await store.getMetadata(key))await store.setJSON(key,logicalBackup(sql),{onlyIfNew:true});lastDaily=date;})().catch(error=>{console.error("Cloud backup failed:",error instanceof Error?error.message:"Unavailable");}).finally(()=>{dailyWork=undefined;});return dailyWork;}
  const folder=join(dir,"backups"),target=join(folder,`daily-${date}.sqlite`);
  if(existsSync(target))return;if(dailyWork)return dailyWork;
  mkdirSync(folder,{recursive:true});
  dailyWork=backup(sql,target).then(()=>{}).catch(error=>{console.error("School daily backup failed:",error instanceof Error?error.message:"Backup unavailable");}).finally(()=>{dailyWork=undefined;});
  return dailyWork;
}
export async function manualBackup(sql:DatabaseSync,dir:string){const name=`manual-${new Date().toISOString().replaceAll(":","-")}`;if(hostedDatabase(sql)){await cloudStore().setJSON(`${name}.json`,logicalBackup(sql));return `${name}.json`;}const folder=join(dir,"backups");mkdirSync(folder,{recursive:true});await backup(sql,join(folder,`${name}.sqlite`));return `${name}.sqlite`;}
