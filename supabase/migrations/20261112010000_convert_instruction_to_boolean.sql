do $migration$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'post_offices'
      and column_name = 'instruction'
      and data_type = 'text'
  ) then
    alter table public.post_offices
      alter column instruction type boolean
      using (instruction is not null and btrim(instruction) <> '');
  end if;
end
$migration$;

alter table public.post_offices
  alter column instruction set default false;

update public.post_offices
set instruction = false
where instruction is null;

alter table public.post_offices
  alter column instruction set not null;
