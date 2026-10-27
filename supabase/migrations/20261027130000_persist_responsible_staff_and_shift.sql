-- Persist responsible staff and shift so they survive reload and can be printed.
alter table public.enrollments
  add column if not exists responsible_staff text,
  add column if not exists shift text;

do $migration$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.create_enrollment_transaction(jsonb,uuid,integer,boolean,text)'::regprocedure);
  if position('responsible_staff' in v_def) = 0 then
    v_def := replace(v_def,
      'course_id, created_by, status, is_quota, quota_type)',
      'course_id, created_by, responsible_staff, shift, status, is_quota, quota_type)');
    v_def := replace(v_def,
      'values (v_protocol, p_academic_year, v_student_id, p_course_id, v_user_id, ''rascunho'', p_is_quota, p_quota_type)',
      'values (v_protocol, p_academic_year, v_student_id, p_course_id, v_user_id, nullif(trim(p_student->>''responsibleStaff''), ''''), nullif(trim(p_student->>''shift''), ''''), ''rascunho'', p_is_quota, p_quota_type)');
    execute v_def;
  end if;

  v_def := pg_get_functiondef('public.update_enrollment_transaction(jsonb,uuid,integer,boolean,text,uuid)'::regprocedure);
  if position('responsible_staff=nullif' in v_def) = 0 then
    v_def := replace(v_def,
      'update public.enrollments set course_id=p_course_id, academic_year=p_academic_year,',
      'update public.enrollments set course_id=p_course_id, academic_year=p_academic_year, responsible_staff=nullif(trim(p_student->>''responsibleStaff''), ''''), shift=nullif(trim(p_student->>''shift''), ''''),');
    execute v_def;
  end if;
end
$migration$;
