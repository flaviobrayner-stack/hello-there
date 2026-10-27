-- Preserve the legal guardian's actual relationship for generated documents.
alter table public.parents_guardians
  add column if not exists relationship_detail text;

do $migration$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.create_enrollment_transaction(jsonb,uuid,integer,boolean,text)'::regprocedure);
  if position('relationship_detail' in v_def) = 0 then
    v_def := replace(v_def,
      'enrollment_id, relationship_type, full_name, status, cpf_digits, rg, rg_issuer,',
      'enrollment_id, relationship_type, relationship_detail, full_name, status, cpf_digits, rg, rg_issuer,');
    v_def := replace(v_def,
      'v_enrollment_id, v_relation,',
      'v_enrollment_id, v_relation, case when v_relation = ''responsavel'' then case when v_parent->>''relationship'' = ''Outro'' then nullif(trim(v_parent->>''relationshipOther''), '''') else nullif(trim(v_parent->>''relationship''), '''') end else null end,');
    execute v_def;
  end if;

  v_def := pg_get_functiondef('public.update_enrollment_transaction(jsonb,uuid,integer,boolean,text,uuid)'::regprocedure);
  if position('relationship_detail' in v_def) = 0 then
    v_def := replace(v_def,
      'insert into public.parents_guardians(enrollment_id,relationship_type,full_name,status,cpf_digits,rg,rg_issuer,',
      'insert into public.parents_guardians(enrollment_id,relationship_type,relationship_detail,full_name,status,cpf_digits,rg,rg_issuer,');
    v_def := replace(v_def,
      'values(p_enrollment_id,v_relation,nullif(trim(coalesce(v_parent->>''name'','''')),''''),',
      'values(p_enrollment_id,v_relation,case when v_relation = ''responsavel'' then case when v_parent->>''relationship'' = ''Outro'' then nullif(trim(v_parent->>''relationshipOther''), '''') else nullif(trim(v_parent->>''relationship''), '''') end else null end,nullif(trim(coalesce(v_parent->>''name'','''')),''''),');
    v_def := replace(v_def,
      'set full_name=excluded.full_name,status=excluded.status,',
      'set relationship_detail=excluded.relationship_detail,full_name=excluded.full_name,status=excluded.status,');
    execute v_def;
  end if;
end
$migration$;
