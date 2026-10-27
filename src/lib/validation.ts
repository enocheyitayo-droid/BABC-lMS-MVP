import { z } from "zod";
export const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});
export const schoolSchema = z.object({
  name: z.string().trim().min(3, "Enter the school's full name.").max(120),
  city: z.string().trim().min(2).max(80),
  contact_email: z.union([z.email().max(254), z.literal("")]),
  contact_phone: z.string().trim().max(24).regex(/^[+\d ()-]*$/, "Enter a valid phone number."),
  address: z.string().trim().max(250),
});
