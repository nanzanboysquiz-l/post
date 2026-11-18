drop trigger if exists post_offices_activity_log on public.post_offices;
create trigger post_offices_activity_log
  after insert or update or delete on public.post_offices
  for each row execute function public.log_post_office_changes();
