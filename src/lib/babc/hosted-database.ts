import "server-only";
import { Worker } from "node:worker_threads";
import { createRequire } from "node:module";
import "pg";
import { hostedSql } from "./hosted-sql";
const source=String.raw`
  const {parentPort,workerData}=require('node:worker_threads');
  const {Client,types}=require(workerData.pgModule);
  types.setTypeParser(20,value=>{const n=Number(value);if(!Number.isSafeInteger(n))throw new Error('Unsafe integer');return n;});
  types.setTypeParser(1700,value=>Number(value));
  let client;
  async function connected(){if(!client){const next=new Client({connectionString:workerData.url,connectionTimeoutMillis:15000,query_timeout:25000});next.on('error',()=>{client=undefined;});await next.connect();await next.query('SET search_path TO babc_school, public');client=next;}return client;}
  parentPort.on('message',async ({sql,params,shared})=>{const status=new Int32Array(shared,0,2),bytes=new Uint8Array(shared,8);let payload;try{const conn=await connected();const result=await conn.query(sql,params);const last=Array.isArray(result)?result[result.length-1]:result;payload={rows:last.rows||[],changes:last.rowCount||0};}catch(e){payload={error:true,code:e.code||'DATABASE_ERROR'};}let encoded=new TextEncoder().encode(JSON.stringify(payload));if(encoded.length>bytes.length)encoded=new TextEncoder().encode(JSON.stringify({error:true,code:'RESPONSE_TOO_LARGE'}));bytes.set(encoded);Atomics.store(status,1,encoded.length);Atomics.store(status,0,1);Atomics.notify(status,0);});
`;
export class HostedSchoolDatabase {
  readonly hosted=true;
  private worker:Worker;
  constructor(url:string){const require=createRequire(`${process.cwd()}/package.json`);this.worker=new Worker(source,{eval:true,workerData:{url,pgModule:require.resolve(["p","g"].join(""))}});this.worker.on("error",()=>{});this.worker.unref();}
  private query(sql:string,params:unknown[]=[]){const shared=new SharedArrayBuffer(8*1024*1024+8),status=new Int32Array(shared,0,2);this.worker.postMessage({sql:hostedSql(sql),params,shared});if(Atomics.wait(status,0,0,30000)==="timed-out")throw new Error("The school database did not respond. Try again.");const result=JSON.parse(new TextDecoder().decode(new Uint8Array(shared,8,Atomics.load(status,1)))) as {rows:Record<string,unknown>[];changes:number;error?:boolean;code?:string};if(result.error)throw new Error(`School database error (${result.code}).`);return result;}
  prepare(sql:string){return {all:(...params:unknown[])=>this.query(sql,params).rows,get:(...params:unknown[])=>this.query(sql,params).rows[0],run:(...params:unknown[])=>({changes:this.query(sql,params).changes})};}
  exec(sql:string){this.query(sql);}
  close(){void this.worker.terminate();}
}
