// Provision the first non-demo ICT account after the app has initialized its DB.
// Supply BABC_ICT_EMAIL, BABC_ICT_PASSWORD, and optionally BABC_ICT_NAME via env.
import { DatabaseSync } from "node:sqlite";
import { randomBytes,randomUUID,scryptSync } from "node:crypto";
import { join } from "node:path";
const email=(process.env.BABC_ICT_EMAIL||"").toLowerCase().trim();
const password=process.env.BABC_ICT_PASSWORD||"";
const name=(process.env.BABC_ICT_NAME||"ICT Administrator").trim();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12||password.length>128){console.error("Set BABC_ICT_EMAIL and BABC_ICT_PASSWORD (12–128 characters) in the environment.");process.exit(1);}
const db=new DatabaseSync(join(process.env.BABC_DB_DIRECTORY||join(process.cwd(),".data"),"babc-school.sqlite"));
try{const salt=randomBytes(16).toString("hex"),hash=`${salt}:${scryptSync(password,salt,64).toString("hex")}`;db.prepare("INSERT INTO accounts(id,name,email,role,password_hash,status) VALUES(?,?,?,'ict',?,'Active')").run(randomUUID(),name,email,hash);console.log("ICT account created. Sign in at /portal/login. No password was printed.");}catch(error){console.error(error.message.includes("UNIQUE")?"That account already exists. Existing access was not changed.":"Account creation failed. Start the app once to initialize the BABC database, then retry.");process.exitCode=1;}finally{db.close();}
