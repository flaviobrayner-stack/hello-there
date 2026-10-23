do $migration$
declare
  v_create text;
  v_transition text;
  v_old_create_1 text := $old$
  if v_cpf_digits is not null then
    select s.id into v_student_id from public.students s where s.cpf_digits = v_cpf_digits limit 1;
    if v_student_id is not null then
      raise exception using errcode = '22023', message = 'student_cpf_already_registered';
    end if;
  end if;
$old$;
  v_new_create_1 text := $new$
  if v_cpf_digits is not null then
    select s.id into v_student_id from public.students s where s.cpf_digits = v_cpf_digits limit 1;
  end if;
$new$;
  v_old_create_2 text := $old$
    if v_student_id is null and v_cpf_digits is not null then
      select s.id into v_student_id from public.students s where s.cpf_digits = v_cpf_digits limit 1;
      if v_student_id is not null then
        raise exception using errcode = '22023', message = 'student_cpf_already_registered';
      end if;
    end if;
$old$;
  v_new_create_2 text := $new$
    if v_student_id is null and v_cpf_digits is not null then
      select s.id into v_student_id from public.students s where s.cpf_digits = v_cpf_digits limit 1;
    end if;
$new$;
  v_old_transition text := $old$
 if p_new_status='concluida' and exists(
   select 1 from public.document_rules r
   left join public.documents d on d.enrollment_id=p_enrollment_id and d.document_type=r.document_type
   where r.active=true and r.blocks_completion=true and r.required_by_default=true
   and coalesce(d.status,'pendente') not in ('entregue','conferido','nao_se_aplica')
 ) then raise exception using errcode='22023',message='required_documents_pending'; end if;
$old$;
begin
  select pg_get_functiondef('public.create_enrollment_transaction(jsonb,uuid,integer,boolean,text)'::regprocedure) into v_create;
  if position(v_old_create_1 in v_create)>0 then
    v_create := replace(v_create, v_old_create_1, v_new_create_1);
    v_create := replace(v_create, v_old_create_2, v_new_create_2);
    execute v_create;
  elsif position('student_cpf_already_registered' in v_create)>0 then
    raise exception 'Duplicate CPF guard remains, but expected SQL blocks differ; migration aborted.';
  end if;

  select pg_get_functiondef('public.transition_enrollment_status(uuid,text)'::regprocedure) into v_transition;
  if position(v_old_transition in v_transition)>0 then
    v_transition := replace(v_transition, v_old_transition, '');
    execute v_transition;
  elsif position('required_documents_pending' in v_transition)>0 then
    raise exception 'Required-document completion guard remains, but expected SQL block differs; migration aborted.';
  end if;
end
$migration$;
