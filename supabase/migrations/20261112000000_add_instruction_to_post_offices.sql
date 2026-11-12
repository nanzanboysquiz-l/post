alter table public.post_offices
add column if not exists instruction boolean not null default false;
