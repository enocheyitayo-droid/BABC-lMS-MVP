import "server-only";
import {cache} from "react";
import {after} from "next/server";
import {readDashboardCounts} from "./dashboard-data";
import { getConnectionString } from "@netlify/database";
import { HostedSchoolDatabase } from "./hosted-database";
import type { DatabaseSync } from "node:sqlite";
import { dailyBackup } from "./backups";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SchoolDatabase, today, type Account, type SchoolRole } from "./database";
export function babcDemoEnabled() { return process.env.ENABLE_DEMO==="true" || (process.env.NODE_ENV!=="production"&&process.env.ENABLE_DEMO!=="false"); }
let database:SchoolDatabase|undefined;
export function schoolDb() { if(!database){if(process.env.BABC_HOSTED==="true"||process.env.NETLIFY==="true"||process.env.BABC_DATABASE_URL||process.env.NETLIFY_DB_URL){const hosted=new HostedSchoolDatabase(process.env.BABC_DATABASE_URL||getConnectionString());database=new SchoolDatabase(":hosted:",false,hosted as unknown as DatabaseSync);return database;}const dir=process.env.BABC_DB_DIRECTORY||join(process.cwd(),".data");mkdirSync(dir,{recursive:true});database=new SchoolDatabase(join(dir,"babc-school.sqlite"),babcDemoEnabled());}return database; }
// React cache is request scoped: it never shares a session between visitors.
export const currentAccount=cache(async()=>{const token=(await cookies()).get("babc_session")?.value;if(!token)return undefined;const db=schoolDb(),account=db.session(token);if(account&&(!account.demo||babcDemoEnabled()))after(()=>dailyBackup(db.sql,process.env.BABC_DB_DIRECTORY||join(process.cwd(),".data"),today()));return account?.demo&&!babcDemoEnabled()?undefined:account;});
export const dashboardCounts=cache(()=>{const row=readDashboardCounts(schoolDb());return {...row,pendingAccounts:Number(row.pending_accounts),pendingPayments:Number(row.pending_payments)};});
export async function requireAccount(roles?:readonly SchoolRole[]):Promise<Account> { const account=await currentAccount();if(!account)redirect("/portal/login");if(roles&&!roles.includes(account.role))redirect(homeFor(account.role));return account; }
export function homeFor(role:SchoolRole) { return role==="student"?"/portal/student":role==="parent"?"/portal/parent":"/portal/office"; }
export async function setSession(accountId:string) { const session=schoolDb().createSession(accountId);(await cookies()).set("babc_session",session.token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/portal",expires:new Date(session.expires)}); }
