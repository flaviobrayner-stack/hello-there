create or replace function public.enforce_single_active_enrollment_per_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.student_id is null then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.student_id::text || ':' || new.academic_year::text, 0)
  );

  if new.status in ('rascunho', 'em_analise') and exists (
    select 1 from public.enrollments e
    where e.student_id = new.student_id
      and e.academic_year = new.academic_year
      and e.status = 'concluida'
      and e.id is distinct from new.id
  ) then
    raise exception using errcode = '22023', message = 'student_already_has_completed_enrollment';
  end if;

  if new.status = 'concluida' and exists (
    select 1 from public.enrollments e
    where e.student_id = new.student_id
      and e.academic_year = new.academic_year
      and e.status = 'concluida'
      and e.id is distinct from new.id
  ) then
    raise exception using errcode = '23505', message = 'student_already_has_completed_enrollment';
  end if;

  if new.status = 'concluida' and exists (
    select 1 from public.enrollments e
    where e.student_id = new.student_id
      and e.academic_year = new.academic_year
      and e.status in ('rascunho', 'em_analise')
      and e.id is distinct from new.id
  ) then
    raise exception using errcode = '22023', message = 'student_has_another_draft_or_pending_enrollment';
  end if;

  return new;
end;
$function$;

drop trigger if exists enforce_single_active_enrollment_per_student on public.enrollments;
create trigger enforce_single_active_enrollment_per_student
before insert or update on public.enrollments
for each row execute function public.enforce_single_active_enrollment_per_student();

create unique index if not exists enrollments_one_completed_per_student_year
on public.enrollments (student_id, academic_year)
where status = 'concluida';
