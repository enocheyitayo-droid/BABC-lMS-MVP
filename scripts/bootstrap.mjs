import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,email=process.env.BOOTSTRAP_ADMIN_EMAIL,password=process.env.BOOTSTRAP_ADMIN_PASSWORD;
if(!url||!key||!email) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and BOOTSTRAP_ADMIN_EMAIL in .env.local.");
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
function check(result){if(result.error)throw new Error(result.error.message);return result.data;}
let user;
for(let page=1;page<=100;page++){
  const data=check(await client.auth.admin.listUsers({page,perPage:100}));
  user=data.users.find(u=>u.email?.toLowerCase()===email.toLowerCase());
  if(user||data.users.length<100)break;
}
if(!user){
  if(!password||password.length<12)throw new Error("For first creation, set BOOTSTRAP_ADMIN_PASSWORD with at least 12 characters. The password will not be printed or emailed.");
  user=check(await client.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:"School administrator"}})).user;
}
const existing=check(await client.from("schools").select("id").eq("slug","teamville-montessori-ibadan").maybeSingle());
const school=existing??check(await client.from("schools").insert({name:"Teamville Montessori School",slug:"teamville-montessori-ibadan",city:"Ibadan"}).select("id").single());
check(await client.from("school_memberships").upsert({school_id:school.id,user_id:user.id,role:"school_admin",active:true},{onConflict:"school_id,user_id"}));
console.log("School and administrator membership are ready. Use the configured administrator credentials at /login. Existing user passwords were not changed. Remove the bootstrap password and service-role key from .env.local when finished.");
