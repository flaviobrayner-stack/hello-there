do $migration$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.update_enrollment_transaction(jsonb,uuid,integer,boolean,text,uuid)'::regprocedure)
    into v_def;

  v_old := $old$  v_protocol text;
  v_cpf text;$old$;
  v_new := $new$  v_protocol text;
  v_status text;
  v_cpf text;$new$;
  if position(v_old in v_def) = 0 then raise exception 'Could not find update function declarations'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$select e.student_id,e.protocol into v_student_id,v_protocol
    from public.enrollments e where e.id=p_enrollment_id and e.status='rascunho'
    and e.created_by=v_user_id;$old$;
  v_new := $new$select e.student_id,e.protocol,e.status into v_student_id,v_protocol,v_status
    from public.enrollments e where e.id=p_enrollment_id and e.status in ('rascunho','concluida')
    and e.created_by=v_user_id;$new$;
  if position(v_old in v_def) = 0 then raise exception 'Could not find owner enrollment lookup'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$select e.student_id,e.protocol into v_student_id,v_protocol
      from public.enrollments e where e.id=p_enrollment_id and e.status='rascunho';$old$;
  v_new := $new$select e.student_id,e.protocol,e.status into v_student_id,v_protocol,v_status
      from public.enrollments e where e.id=p_enrollment_id and e.status in ('rascunho','concluida');$new$;
  if position(v_old in v_def) = 0 then raise exception 'Could not find admin enrollment lookup'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$where id=p_enrollment_id and status='rascunho';$old$;
  v_new := $new$where id=p_enrollment_id and status in ('rascunho','concluida');$new$;
  if position(v_old in v_def) = 0 then raise exception 'Could not find enrollment update status guard'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$values(v_user_id,'enrollment.updated','enrollment',p_enrollment_id,jsonb_build_object('protocol',v_protocol,'status','rascunho'));$old$;
  v_new := $new$values(v_user_id,'enrollment.updated','enrollment',p_enrollment_id,jsonb_build_object('protocol',v_protocol,'status',v_status));$new$;
  if position(v_old in v_def) = 0 then raise exception 'Could not find audit status metadata'; end if;
  v_def := replace(v_def, v_old, v_new);

  v_old := $old$return jsonb_build_object('id',p_enrollment_id,'protocol',v_protocol,'academic_year',p_academic_year,'status','rascunho');$old$;
  v_new := $new$return jsonb_build_object('id',p_enrollment_id,'protocol',v_protocol,'academic_year',p_academic_year,'status',v_status);$new$;
  if position(v_old in v_def) = 0 then raise exception 'Could not find update function return status'; end if;
  v_def := replace(v_def, v_old, v_new);

  execute v_def;
end
$migration$;
