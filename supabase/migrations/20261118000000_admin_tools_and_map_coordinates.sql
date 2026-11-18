-- Create an Auth user in Supabase first, then register that user's UUID:
-- insert into public.admin_users (user_id) values ('<auth.users.id>');

alter table public.post_offices
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'post_offices_coordinates_pair_check'
      and conrelid = 'public.post_offices'::regclass
  ) then
    alter table public.post_offices
      add constraint post_offices_coordinates_pair_check
      check ((latitude is null) = (longitude is null));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'post_offices_latitude_range_check'
      and conrelid = 'public.post_offices'::regclass
  ) then
    alter table public.post_offices
      add constraint post_offices_latitude_range_check
      check (latitude is null or latitude between -90 and 90);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'post_offices_longitude_range_check'
      and conrelid = 'public.post_offices'::regclass
  ) then
    alter table public.post_offices
      add constraint post_offices_longitude_range_check
      check (longitude is null or longitude between -180 and 180);
  end if;
end
$$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Admins can read their own admin record" on public.admin_users;
create policy "Admins can read their own admin record"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_post_office_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_post_office_admin() from public, anon;
grant execute on function public.is_post_office_admin() to authenticated;

drop policy if exists "Admins can read all post offices" on public.post_offices;
create policy "Admins can read all post offices"
  on public.post_offices for select to authenticated
  using ((select public.is_post_office_admin()));

create table if not exists public.post_office_activity_logs (
  id bigint generated always as identity primary key,
  post_office_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

alter table public.post_office_activity_logs enable row level security;
revoke all on public.post_office_activity_logs from anon, authenticated;
grant select on public.post_office_activity_logs to authenticated;

drop policy if exists "Admins can read post office activity logs" on public.post_office_activity_logs;
create policy "Admins can read post office activity logs"
  on public.post_office_activity_logs for select to authenticated
  using ((select public.is_post_office_admin()));

create or replace function public.log_post_office_changes()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.post_office_activity_logs (post_office_id, action, actor_id, new_data)
    values (to_jsonb(new) ->> 'id', tg_op, auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.post_office_activity_logs (post_office_id, action, actor_id, old_data, new_data)
    values (to_jsonb(new) ->> 'id', tg_op, auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.post_office_activity_logs (post_office_id, action, actor_id, old_data)
    values (to_jsonb(old) ->> 'id', tg_op, auth.uid(), to_jsonb(old));
    return old;
  end if;
end;
$$;

revoke all on function public.log_post_office_changes() from public, anon, authenticated;

create or replace function public.set_post_office_coordinates(
  target_id text,
  target_latitude numeric,
  target_longitude numeric
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or not public.is_post_office_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if (target_latitude is null) <> (target_longitude is null)
     or (target_latitude is not null and target_latitude not between -90 and 90)
     or (target_longitude is not null and target_longitude not between -180 and 180) then
    raise exception 'Invalid coordinates' using errcode = '22023';
  end if;

  update public.post_offices
  set latitude = target_latitude, longitude = target_longitude
  where id::text = target_id;

  if not found then
    raise exception 'Post office not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.set_post_office_coordinates(text, numeric, numeric) from public, anon;
grant execute on function public.set_post_office_coordinates(text, numeric, numeric) to authenticated;
