import "server-only";
import { Worker } from "node:worker_threads";
import { createRequire } from "node:module";
import { postgresSql } from "./postgres-sql";

// The existing demo uses short synchronous SQLite transactions. A dedicated
// worker owns one PostgreSQL connection so those transactions stay on the same
// connection, without changing the tested business operations during deployment.
// This bridge is for the small presentation MVP; a larger rollout should use
// asynchronous repositories and a connection pool throughout.
const source=String.raw`
  const {parentPort,workerData}=require('node:worker_threads');
  const {Client,types}=require(workerData.pgModule);
  types.setTypeParser(20,value=>{const n=Number(value);if(!Number.isSafeInteger(n))throw new Error('Unsafe integer');return n;});
  let client;
  async function connected(){
    if(!client){const next=new Client({connectionString:workerData.url,connectionTimeoutMillis:15000,query_timeout:25000,options:'-c search_path=teamville_demo,public'});next.on('error',()=>{client=undefined;});try{await next.connect();client=next;}catch(e){await next.end().catch(()=>{});throw e;}}
    return client;
  }
  parentPort.on('message',async ({sql,params,shared})=>{
    const status=new Int32Array(shared,0,2),bytes=new Uint8Array(shared,8);
    let payload;
    try{const connection=await connected();const result=await connection.query(sql,params);const last=Array.isArray(result)?result[result.length-1]:result;payload={rows:last.rows||[],changes:last.rowCount||0};}
    catch(e){payload={error:true,code:e.code||'DATABASE_ERROR'};}
    let encoded=new TextEncoder().encode(JSON.stringify(payload));
    if(encoded.length>bytes.length)encoded=new TextEncoder().encode(JSON.stringify({error:true,code:'RESPONSE_TOO_LARGE'}));
    bytes.set(encoded);Atomics.store(status,1,encoded.length);Atomics.store(status,0,1);Atomics.notify(status,0);
  });
`;
export class PostgresDatabase {
  private worker:Worker;
  constructor(url:string,pgModule?:string){
    const require=createRequire(import.meta.url);
    this.worker=new Worker(source,{eval:true,workerData:{url,pgModule:pgModule??require.resolve("pg")}});
    this.worker.on("error",()=>{ /* Query timeout returns a safe error to the caller. */ });
    this.worker.unref();
  }
  private query(sql:string,params:unknown[]=[]){
    const shared=new SharedArrayBuffer(2*1024*1024+8),status=new Int32Array(shared,0,2);
    this.worker.postMessage({sql:postgresSql(sql),params,shared});
    if(Atomics.wait(status,0,0,30000)==="timed-out")throw new Error("The hosted demo database did not respond. Please try again.");
    const result=JSON.parse(new TextDecoder().decode(new Uint8Array(shared,8,Atomics.load(status,1)))) as {rows:Record<string,unknown>[];changes:number;error?:boolean;code?:string};
    if(result.error)throw new Error(`Hosted demo database error (${result.code}).`);
    return result;
  }
  prepare(sql:string){return {all:(...params:unknown[])=>this.query(sql,params).rows,get:(...params:unknown[])=>this.query(sql,params).rows[0],run:(...params:unknown[])=>({changes:this.query(sql,params).changes})};}
  exec(sql:string){this.query(sql);}
  close(){void this.worker.terminate();}
}
