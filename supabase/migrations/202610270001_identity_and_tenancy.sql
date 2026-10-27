-- Phase 1: identity and school isolation. No pupil/finance data in this migration.
begin;

create type public.school_role as enum ('school_admin','teacher','bursar','cashier','expense_approver','guardian');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 3 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  city text not null default '' check (length(city) <= 80),
  address text not null default '' check (length(address) <= 250),
  contact_email text check (length(contact_email) <= 254),
  contact_phone text not null default '' check (length(contact_phone) <= 24),
  logo_path text,
  active boolean not null default true,
  timezone text not null default 'Africa/Lagos',
  currency char(3) not null default 'NGN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (logo_path is null or logo_path like id::text || '/%')
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null default '' check (length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  role public.school_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, user_id)
);
create index memberships_user_active on public.school_memberships(user_id, school_id) where active;
create index memberships_school_role on public.school_memberships(school_id, role) where active;

-- Platform operators are separate from ordinary school membership.
-- Only service-role operations may provision/revoke platform access in Phase 1.
create table public.platform_administrators (
  user_id uuid primary key references public.profiles(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_school_time on public.audit_logs(school_id, created_at desc);

-- Non-exposed helpers bypass recursive membership RLS. Fixed search paths.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.has_school_role(target_school uuid, allowed_roles public.school_role[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.school_memberships m
    join public.schools s on s.id = m.school_id
    where m.school_id = target_school and m.user_id = (select auth.uid())
      and m.active and s.active
      and (allowed_roles is null or m.role = any(allowed_roles))
  );
$$;
revoke all on function private.has_school_role(uuid, public.school_role[]) from public;
grant execute on function private.has_school_role(uuid, public.school_role[]) to authenticated;

create function private.can_read_profile(target_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select target_user = (select auth.uid()) or exists (
    select 1 from public.school_memberships m
    where m.user_id = target_user and private.has_school_role(m.school_id, array['school_admin']::public.school_role[])
  );
$$;
revoke all on function private.can_read_profile(uuid) from public;
grant execute on function private.can_read_profile(uuid) to authenticated;

create function private.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function private.set_updated_at() from public;

create function private.on_auth_user_created() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', ''), 120));
  return new;
end;
$$;
revoke all on function private.on_auth_user_created() from public;
create trigger create_auth_profile after insert on auth.users for each row execute function private.on_auth_user_created();

create function private.audit_school_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare tenant uuid; entity uuid;
begin
  if tg_table_name = 'schools' then tenant = new.id; else tenant = new.school_id; end if;
  entity = new.id;
  insert into public.audit_logs(school_id, actor_id, action, entity_type, entity_id, before_data, after_data)
  values (tenant, auth.uid(), lower(tg_op), tg_table_name, entity,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end, to_jsonb(new));
  return new;
end;
$$;
revoke all on function private.audit_school_change() from public;
create trigger audit_schools after insert or update on public.schools for each row execute function private.audit_school_change();
create trigger audit_memberships after insert or update on public.school_memberships for each row execute function private.audit_school_change();
create trigger updated_schools before update on public.schools for each row execute function private.set_updated_at();
create trigger updated_memberships before update on public.school_memberships for each row execute function private.set_updated_at();
create trigger updated_profiles before update on public.profiles for each row execute function private.set_updated_at();

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.school_memberships enable row level security;
alter table public.platform_administrators enable row level security;
alter table public.audit_logs enable row level security;

-- Revoke default Supabase table privileges before granting a minimal surface.
revoke all on public.schools, public.profiles, public.school_memberships, public.platform_administrators, public.audit_logs from anon, authenticated;
grant select on public.schools, public.profiles, public.school_memberships, public.audit_logs to authenticated;
grant update(name,city,address,contact_email,contact_phone) on public.schools to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant all on public.schools, public.profiles, public.school_memberships, public.platform_administrators, public.audit_logs to service_role;

create policy school_read on public.schools for select to authenticated using (private.has_school_role(id));
create policy school_update on public.schools for update to authenticated
  using (private.has_school_role(id, array['school_admin']::public.school_role[]))
  with check (private.has_school_role(id, array['school_admin']::public.school_role[]));
create policy profile_read on public.profiles for select to authenticated using (private.can_read_profile(id));
create policy profile_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy membership_read on public.school_memberships for select to authenticated using (
  (user_id = (select auth.uid()) and private.has_school_role(school_id)) or
  private.has_school_role(school_id, array['school_admin']::public.school_role[])
);
create policy audit_read on public.audit_logs for select to authenticated using (
  private.has_school_role(school_id, array['school_admin']::public.school_role[])
);
-- No public policies for platform administrators. No client writes to memberships/audits.

commit;
