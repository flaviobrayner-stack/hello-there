-- Persistência dos campos novos da ficha de matrícula.
-- Idempotente: pode ser aplicada em ambientes que já possuam as colunas.
alter table public.students
  add column if not exists previous_class text,
  add column if not exists year_of_entry integer;

do $migration$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.create_enrollment_transaction(jsonb,uuid,integer,boolean,text)'::regprocedure);
  v_def := replace(v_def,
    'school_transport, transport_type, previous_school, shirt_size, bolsa_familia',
    'school_transport, transport_type, previous_school, previous_class, year_of_entry, shirt_size, bolsa_familia');
  v_def := replace(v_def,
    'nullif(trim(p_student->>''previousSchool''), ''''),',
    'nullif(trim(p_student->>''previousSchool''), ''''),' || E'\n      ' ||
    'nullif(trim(p_student->>''previousClass''), ''''),' || E'\n      ' ||
    'nullif(p_student->>''yearOfEntry'', '''')::integer,');
  execute v_def;

  v_def := pg_get_functiondef('public.update_enrollment_transaction(jsonb,uuid,integer,boolean,text,uuid)'::regprocedure);
  v_def := replace(v_def,
    'transport_type=nullif(trim(p_student->>''transportType''),''''), previous_school=nullif(trim(p_student->>''previousSchool''),''''),',
    'transport_type=nullif(trim(p_student->>''transportType''),''''), previous_school=nullif(trim(p_student->>''previousSchool''),''''),' || E'\n    ' ||
    'previous_class=nullif(trim(p_student->>''previousClass''),''''), year_of_entry=nullif(p_student->>''yearOfEntry'','''')::integer,');
  execute v_def;
end
$migration$;
