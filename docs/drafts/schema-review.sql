-- RASCUNHO PARA REVISÃO — NÃO É UMA MIGRATION.
-- Não executar em produção nem mover para supabase/migrations antes de aprovação.
-- Revisar com a escola as regras de retenção, acesso à saúde, unicidade de CPF
-- (um estudante pode ter matrículas em anos diferentes?) e campos obrigatórios.
-- Modelo orientativo para Supabase/Postgres; requer revisão e testes de RLS.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin', 'operador')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  social_name text,
  cpf_digits text,
  rg text,
  rg_issuer text,
  birth_date date,
  birthplace text,
  sex text,
  marital_status text,
  phone text,
  email text,
  address text,
  neighborhood text,
  city text,
  state char(2),
  cep_digits text,
  race_color text,
  pcd boolean not null default false,
  pcd_type text,
  school_transport boolean not null default false,
  transport_type text,
  previous_school text,
  shirt_size text,
  bolsa_familia boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_cpf_digits_format check (cpf_digits is null or cpf_digits ~ '^[0-9]{11}$'),
  constraint students_cep_digits_format check (cep_digits is null or cep_digits ~ '^[0-9]{8}$')
);
-- Aprovar após confirmar se CPF único por pessoa é compatível com rematrículas.
create unique index students_cpf_digits_unique on public.students (cpf_digits) where cpf_digits is not null;
create index students_name_search_idx on public.students using gin (to_tsvector('simple', full_name));

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique,
  academic_year integer not null default 2026 check (academic_year between 2020 and 2100),
  student_id uuid not null references public.students(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'em_analise', 'concluida', 'cancelada')),
  is_quota boolean not null default false,
  quota_type text check (quota_type in ('escola_publica', 'renda', 'vulnerabilidade', 'pcd')),
  enrolled_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollment_quota_consistency check (
    (is_quota = false and quota_type is null) or
    (is_quota = true and quota_type is not null)
  )
);
create index enrollments_year_status_idx on public.enrollments (academic_year, status);
create index enrollments_course_idx on public.enrollments (course_id);
create index enrollments_creator_idx on public.enrollments (created_by);
create index enrollments_created_at_idx on public.enrollments (created_at);

create table public.parents_guardians (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  relationship_type text not null check (relationship_type in ('mae', 'pai', 'responsavel')),
  full_name text,
  status text not null default 'informado'
    check (status in ('informado', 'nao_informado', 'falecido', 'nao_se_aplica')),
  cpf_digits text,
  rg text,
  rg_issuer text,
  marital_status text,
  phone text,
  email text,
  address text,
  profession text,
  workplace text,
  work_phone text,
  is_legal_guardian boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_guardian_cpf_format check (cpf_digits is null or cpf_digits ~ '^[0-9]{11}$')
);
create index parents_guardians_enrollment_idx on public.parents_guardians (enrollment_id);

create table public.health_records (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.enrollments(id) on delete restrict,
  health_insurance boolean,
  accredited_hospital text,
  family_hospital text,
  medication_allergy boolean,
  allergy_details text,
  food_allergy boolean,
  food_allergy_details text,
  controlled_medication boolean,
  medication_details text,
  emergency_name text,
  emergency_phone text,
  emergency_relationship text,
  health_notes boolean,
  health_notes_details text,
  blood_type text check (blood_type is null or blood_type in ('A', 'B', 'AB', 'O')),
  rh_factor text check (rh_factor is null or rh_factor in ('+', '-')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Não conceder acesso geral a esta tabela. Revisar política própria de saúde
-- antes de implementar; não incluir campos médicos em consultas do dashboard.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  document_type text not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'entregue', 'conferido', 'recusado', 'nao_se_aplica')),
  required boolean not null default true,
  storage_path text,
  file_name text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  submitted_at timestamptz,
  checked_at timestamptz,
  checked_by uuid references public.profiles(id) on delete restrict,
  due_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_id, document_type)
);
create index documents_enrollment_status_idx on public.documents (enrollment_id, status);
create index documents_required_due_idx on public.documents (required, due_at) where status = 'pendente';

create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  document_type text not null,
  template_version text not null,
  google_doc_id text,
  google_doc_url text,
  pdf_storage_path text,
  status text not null default 'pendente'
    check (status in ('pendente', 'gerando', 'gerado', 'erro')),
  generated_by uuid references public.profiles(id) on delete restrict,
  generated_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
create index generated_documents_enrollment_idx on public.generated_documents (enrollment_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

create table public.document_rules (
  id uuid primary key default gen_random_uuid(),
  document_type text not null unique,
  required_by_default boolean not null default true,
  blocks_completion boolean not null default true,
  due_days_after_enrollment integer check (due_days_after_enrollment is null or due_days_after_enrollment >= 0),
  active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  updated_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

-- Segurança: função auxiliar ilustrativa; revisar proprietário, grants e search_path
-- antes de usar. Ela não substitui as policies específicas de cada tabela.
create or replace function public.current_active_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.active = true
  limit 1
$$;
revoke all on function public.current_active_role() from public;
revoke all on function public.current_active_role() from anon;
grant execute on function public.current_active_role() to authenticated;



-- RLS e policies abaixo são propostas de revisão, ainda NÃO aprovadas.
-- Operadores ficam limitados às matrículas que criaram até decisão institucional
-- formal sobre escopo por equipe/curso. Dados médicos são exclusivos de admin.
-- Escritas operacionais passam por RPCs/servidor com validação; sem DML genérico.

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.parents_guardians enable row level security;
alter table public.health_records enable row level security;
alter table public.documents enable row level security;
alter table public.generated_documents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.document_rules enable row level security;
alter table public.app_settings enable row level security;

create policy profiles_read_self_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_active_role() = 'admin');

create policy courses_read_active_staff on public.courses
  for select to authenticated
  using (active = true and public.current_active_role() in ('admin', 'operador'));
create policy courses_admin_manage on public.courses
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');

create policy students_admin_read on public.students
  for select to authenticated
  using (public.current_active_role() = 'admin');
create policy students_operator_read_own_enrollments on public.students
  for select to authenticated
  using (
    public.current_active_role() = 'operador'
    and exists (select 1 from public.enrollments e
      where e.student_id = students.id and e.created_by = auth.uid())
  );

create policy enrollments_admin_read on public.enrollments
  for select to authenticated
  using (public.current_active_role() = 'admin');
create policy enrollments_operator_read_own on public.enrollments
  for select to authenticated
  using (public.current_active_role() = 'operador' and created_by = auth.uid());

create policy parents_admin_all on public.parents_guardians
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');
create policy parents_operator_own_read on public.parents_guardians
  for select to authenticated
  using (
    public.current_active_role() = 'operador'
    and exists (select 1 from public.enrollments e
      where e.id = parents_guardians.enrollment_id and e.created_by = auth.uid())
  );

create policy health_admin_only on public.health_records
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');

create policy documents_admin_all on public.documents
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');
create policy documents_operator_own_read on public.documents
  for select to authenticated
  using (
    public.current_active_role() = 'operador'
    and exists (select 1 from public.enrollments e
      where e.id = documents.enrollment_id and e.created_by = auth.uid())
  );

create policy generated_docs_admin_all on public.generated_documents
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');
create policy generated_docs_operator_own_read on public.generated_documents
  for select to authenticated
  using (
    public.current_active_role() = 'operador'
    and exists (select 1 from public.enrollments e
      where e.id = generated_documents.enrollment_id and e.created_by = auth.uid())
  );

create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated
  using (public.current_active_role() = 'admin');

create policy document_rules_staff_read on public.document_rules
  for select to authenticated
  using (public.current_active_role() in ('admin', 'operador'));
create policy document_rules_admin_manage on public.document_rules
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');

create policy app_settings_admin_only on public.app_settings
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');

-- Privilégios explícitos de referência. Nenhum acesso concedido a anon.
-- Revogar somente nas tabelas deste rascunho, sem alterar objetos preexistentes
-- de terceiros no schema public.
revoke all on public.profiles, public.courses, public.students, public.enrollments,
  public.parents_guardians, public.health_records, public.documents,
  public.generated_documents, public.audit_logs, public.document_rules,
  public.app_settings from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.profiles, public.courses, public.students, public.enrollments,
  public.parents_guardians, public.health_records, public.documents,
  public.generated_documents, public.audit_logs, public.document_rules,
  public.app_settings to authenticated;
-- Escrita direta apenas em tabelas de configuração, sob policies de admin.
grant insert, update, delete on public.courses, public.document_rules,
  public.app_settings to authenticated;
-- Sem DML direto em dados pessoais, matrículas, saúde, documentos, auditoria
-- ou sequência. Essas operações exigem RPCs específicas e auditadas.
-- O GRANT EXECUTE da RPC de matrícula fica desligado até revisão formal.

-- Ainda requer revisão:
-- 1) REVOKE/GRANT explícitos por role/schema/table/function.
-- 2) Trigger de updated_at e provisionamento seguro de profiles.
-- 3) Proteção contra operador alterando created_by/curso/status em registros alheios.
-- 4) Acesso de operadores a dados de saúde, e acesso por matrícula atribuída.
-- 5) Policies de Storage privado e limites de MIME/tamanho.
-- 6) Gerador server-side de protocolo e prevenção de CPF duplicado transacional.
-- 7) Política de cancelamento/retention, LGPD, índices e testes de autorização.
-- 8) Não colocar este arquivo em supabase/migrations até aprovação formal.


-- Validação dos dígitos verificadores de CPF. Função interna do rascunho:
-- não deve ser exposta como endpoint nem receber grants diretos.
create or replace function public.is_valid_cpf(p_cpf text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $
declare
  v_digits text := regexp_replace(p_cpf, '[^0-9]', '', 'g');
  v_sum integer := 0;
  v_remainder integer;
  v_digit integer;
  i integer;
begin
  if length(v_digits) <> 11 or v_digits = repeat(substr(v_digits, 1, 1), 11) then
    return false;
  end if;

  for i in 1..9 loop
    v_sum := v_sum + substring(v_digits from i for 1)::integer * (11 - i);
  end loop;
  v_remainder := (v_sum * 10) % 11;
  if v_remainder = 10 then v_remainder := 0; end if;
  if v_remainder <> substring(v_digits from 10 for 1)::integer then
    return false;
  end if;

  v_sum := 0;
  for i in 1..10 loop
    v_sum := v_sum + substring(v_digits from i for 1)::integer * (12 - i);
  end loop;
  v_remainder := (v_sum * 10) % 11;
  if v_remainder = 10 then v_remainder := 0; end if;
  v_digit := substring(v_digits from 11 for 1)::integer;
  return v_remainder = v_digit;
end;
$;
revoke all on function public.is_valid_cpf(text) from public, anon, authenticated;

-- ============================================================================
-- PROPOSTA DE RPC TRANSACIONAL (AINDA NÃO APROVADA / NÃO EXECUTAR)
-- Esta função é chamada pelo endpoint POST /api/enrollments. Revisar com DBA
-- e responsável institucional antes de criar uma migration. A função limita os
-- campos aceitos, gera protocolo no servidor e grava auditoria na mesma transação.
-- ============================================================================
create table public.enrollment_protocol_sequences (
  academic_year integer primary key check (academic_year between 2020 and 2100),
  last_number bigint not null default 0 check (last_number >= 0)
);
alter table public.enrollment_protocol_sequences enable row level security;
revoke all on public.enrollment_protocol_sequences from public, anon, authenticated;
-- Sem policy e sem grants de acesso direto. Somente a RPC SECURITY DEFINER revisada
-- poderá incrementar a sequência; validar owner e privilégios antes de habilitar.

create or replace function public.create_enrollment_transaction(
  p_student jsonb,
  p_course_id uuid,
  p_academic_year integer,
  p_is_quota boolean,
  p_quota_type text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_student_id uuid;
  v_enrollment_id uuid;
  v_protocol text;
  v_next_number bigint;
  v_cpf_digits text;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = v_user_id and p.active = true;

  if v_role is null or v_role not in ('admin', 'operador') then
    raise exception using errcode = '42501', message = 'staff_access_denied';
  end if;

  if p_academic_year < 2020 or p_academic_year > 2100 then
    raise exception using errcode = '22023', message = 'invalid_academic_year';
  end if;

  if p_student is null or jsonb_typeof(p_student) <> 'object'
     or length(trim(coalesce(p_student->>'fullName', ''))) < 3 then
    raise exception using errcode = '22023', message = 'invalid_student_payload';
  end if;

  if p_is_quota is distinct from (p_quota_type is not null) then
    raise exception using errcode = '22023', message = 'invalid_quota_configuration';
  end if;

  if p_quota_type is not null and p_quota_type not in
     ('escola_publica', 'renda', 'vulnerabilidade', 'pcd') then
    raise exception using errcode = '22023', message = 'invalid_quota_type';
  end if;

  if not exists (
    select 1 from public.courses c where c.id = p_course_id and c.active = true
  ) then
    raise exception using errcode = '22023', message = 'course_not_available';
  end if;

  -- Protocolo sequencial e sem colisão sob concorrência, dentro da transação.
  insert into public.enrollment_protocol_sequences (academic_year, last_number)
  values (p_academic_year, 1)
  on conflict (academic_year) do update
    set last_number = public.enrollment_protocol_sequences.last_number + 1
  returning last_number into v_next_number;

  v_protocol := 'MAT-' || p_academic_year::text || '-' || lpad(v_next_number::text, 6, '0');

  v_cpf_digits := nullif(
    regexp_replace(coalesce(p_student->>'cpf', ''), '[^0-9]', '', 'g'),
    ''
  );
  if v_cpf_digits is not null and not public.is_valid_cpf(v_cpf_digits) then
    raise exception using errcode = '22023', message = 'invalid_cpf';
  end if;

  -- CPF identifica a pessoa; a matrícula é independente por ano letivo.
  -- Reutilizar registro existente sem sobrescrever dados pessoais silenciosamente.
  if v_cpf_digits is not null then
    select s.id into v_student_id
    from public.students s where s.cpf_digits = v_cpf_digits limit 1;
  end if;

  if v_student_id is null then
    insert into public.students (
      full_name, social_name, cpf_digits, rg, birth_date, phone, email,
      address, city, state, cep_digits, race_color, pcd, previous_school
    ) values (
      trim(p_student->>'fullName'),
      nullif(trim(p_student->>'socialName'), ''),
      v_cpf_digits,
      nullif(trim(p_student->>'rg'), ''),
      nullif(p_student->>'birthDate', '')::date,
      nullif(trim(p_student->>'phone'), ''),
      nullif(trim(p_student->>'email'), ''),
      nullif(trim(p_student->>'address'), ''),
      nullif(upper(trim(p_student->>'state')), ''),
      nullif(regexp_replace(coalesce(p_student->>'cep', ''), '[^0-9]', '', 'g'), ''),
      nullif(trim(p_student->>'raceColor'), ''),
      coalesce((p_student->>'pcd')::boolean, false),
      nullif(trim(p_student->>'previousSchool'), '')
    )
    on conflict (cpf_digits) where cpf_digits is not null do nothing
    returning id into v_student_id;

    -- Resolve concorrência: outra transação pode ter inserido o CPF primeiro.
    if v_student_id is null and v_cpf_digits is not null then
      select s.id into v_student_id
      from public.students s where s.cpf_digits = v_cpf_digits limit 1;
    end if;
  end if;

  if v_student_id is null then
    raise exception using errcode = 'P0001', message = 'student_identity_resolution_failed';
  end if;

  -- Evita vincular matrícula ao CPF de outra pessoa por erro de digitação.
  -- Mudança legítima de nome deve passar por procedimento de correção auditado.
  if v_cpf_digits is not null and exists (
    select 1 from public.students s
    where s.id = v_student_id
      and lower(btrim(s.full_name)) <> lower(btrim(p_student->>'fullName'))
  ) then
    raise exception using errcode = '22023', message = 'student_identity_conflict';
  end if;

  insert into public.enrollments (
    protocol, academic_year, student_id, course_id, created_by,
    status, is_quota, quota_type
  ) values (
    v_protocol, p_academic_year, v_student_id, p_course_id, v_user_id,
    'rascunho', p_is_quota, p_quota_type
  ) returning id into v_enrollment_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'enrollment.created',
    'enrollment',
    v_enrollment_id,
    jsonb_build_object('academic_year', p_academic_year, 'status', 'rascunho')
  );

  return jsonb_build_object(
    'id', v_enrollment_id,
    'protocol', v_protocol,
    'academic_year', p_academic_year,
    'status', 'rascunho'
  );
end;
$$;

-- Revisar proprietário da função e privilégios antes de aplicar. Não conceder
-- EXECUTE a anon/public; somente authenticated após revisão de segurança.
revoke all on function public.create_enrollment_transaction(jsonb, uuid, integer, boolean, text) from public;
revoke all on function public.create_enrollment_transaction(jsonb, uuid, integer, boolean, text) from anon;
-- GRANT EXECUTE ON FUNCTION public.create_enrollment_transaction(jsonb, uuid, integer, boolean, text) TO authenticated;
-- Só habilitar após aprovação formal e testes de autorização.

-- A proposta reutiliza estudante por CPF normalizado e mantém matrículas separadas
-- por ano letivo. CPF ausente ainda permite criar estudante sem chave de deduplicação.
-- PENDENTE: validar dígitos verificadores do CPF no servidor; definir fluxo auditado
-- de correção de CPF e reconciliação manual quando CPF estiver ausente/incorreto.
-- A função ainda precisa de testes de payload malformado, rollback, concorrência,
-- owner SECURITY DEFINER, grants/revokes e leitura por operador/admin.
-- O payload inicial ainda não grava todos os campos nem responsáveis; não conectar
-- o formulário real a esta RPC até completar e revisar o contrato.
