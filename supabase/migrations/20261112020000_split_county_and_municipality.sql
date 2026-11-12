alter table public.post_offices
add column if not exists county text;

-- 赤穂郡上郡町 is 赤穂郡 + 上郡町, not 上郡 + 町.
update public.post_offices
set county = '赤穂郡', municipality = '上郡町'
where municipality = '赤穂郡上郡町'
   or (county = '赤穂郡上郡' and municipality = '町');

-- Exclude municipality names that contain 郡 but do not start with a county name.
update public.post_offices
set
  county = left(municipality, strpos(municipality, '郡')),
  municipality = substr(municipality, strpos(municipality, '郡') + 1)
where county is null
  and municipality is not null
  and municipality <> '上郡町'
  and strpos(municipality, '郡') > 0
  and strpos(municipality, '郡') < char_length(municipality) - 1
  and right(municipality, 1) in ('町', '村');

-- Repair 上郡町 if this migration was run before the exception was added.
update public.post_offices
set county = null, municipality = '上郡町'
where county = '上郡'
  and municipality = '町';
