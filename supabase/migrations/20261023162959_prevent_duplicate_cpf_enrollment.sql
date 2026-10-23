do $migration$
declare
  v_definition text;
  v_old_existing text := $old$
  if v_cpf_digits is not null then
    select s.id into v_student_id from public.students s where s.cpf_digits = v_cpf_digits limit 1;
  end if;
$old$;
  v_new_existing text := $new$
  if v_cpf_digits is not null then
    select s.id into v_student_id from public.students s where s.cpf_digits = v_cpf_digits limit 1;
    if v_student_id is not null then
      raise exception using errcode = '22023', message = 'student_cpf_already_registered';
    end if;
  end if;
$new$;
  v_old_race text := $old$
    if v_student_id is null and v_cpf_digits is not null then
      select s.id into v_student_id from public.students s where s.cpf_digits = v_cpf_digits limit 1;
    end if;
$old$;
  v_new_race text := $new$
    if v_student_id is null and v_cpf_digits is not null then
      select s.id into v_student_id from public.students s where s.cpf_digits = v_cpf_digits limit 1;
      if v_student_id is not null then
        raise exception using errcode = '22023', message = 'student_cpf_already_registered';
      end if;
    end if;
$new$;
begin
  select pg_get_functiondef('public.create_enrollment_transaction(jsonb,uuid,integer,boolean,text)'::regprocedure)
    into v_definition;
  if position(v_old_existing in v_definition) = 0 then
    raise exception 'Expected CPF lookup block was not found; migration aborted without changing the function.';
  end if;
  if position(v_old_race in v_definition) = 0 then
    raise exception 'Expected concurrent CPF conflict block was not found; migration aborted without changing the function.';
  end if;
  v_definition := replace(v_definition, v_old_existing, v_new_existing);
  v_definition := replace(v_definition, v_old_race, v_new_race);
  execute v_definition;
end
$migration$;
