"use client";
import { z } from "zod";
import { initialPortalData, type PortalData } from "./portal-data";
const schema = z.object({
  assignments: z.array(z.object({ id: z.string(), subject: z.string(), className: z.string(), teacher: z.string(), initials: z.string(), color: z.string(), students: z.number(), room: z.string() })),
  reviews: z.array(z.object({ id: z.string(), title: z.string(), assignmentId: z.string(), status: z.enum(["Awaiting review", "Changes requested", "Approved"]), body: z.string(), comments: z.array(z.object({ author: z.string(), text: z.string() })) })),
  meetings: z.array(z.object({ id: z.string(), title: z.string(), date: z.string(), time: z.string(), department: z.string(), agenda: z.string(), link: z.string(), attending: z.boolean(), minutes: z.string() })),
  notices: z.array(z.object({ id: z.string(), title: z.string(), body: z.string(), author: z.string() })),
  tasks: z.array(z.object({ id: z.string(), title: z.string(), due: z.string(), done: z.boolean() })),
  scores: z.record(z.string(), z.object({ ca: z.number().min(0).max(40), exam: z.number().min(0).max(60) })),
  attendance: z.record(z.string(), z.string()), activity: z.array(z.string()),
});
const key = "babc-portal-demo-v1";
let cachedRaw: string | null | undefined;
let cachedData: PortalData = initialPortalData;
export function getPortalSnapshot(): PortalData {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed = raw ? schema.safeParse(JSON.parse(raw)) : null;
      cachedData = parsed?.success ? parsed.data : initialPortalData;
    }
  } catch { return cachedData; }
  return cachedData;
}
export function subscribePortal(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener("babc-update", callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("babc-update", callback); };
}
export function savePortal(data: PortalData) {
  const valid = schema.parse(data);
  localStorage.setItem(key, JSON.stringify(valid));
  window.dispatchEvent(new Event("babc-update"));
}
