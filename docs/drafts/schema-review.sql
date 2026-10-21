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

-- RLS e policies abaixo são propostas iniciais, não aprovadas.
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
create policy profiles_admin_manage on public.profiles
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');

create policy courses_read_authenticated on public.courses
  for select to authenticated
  using (public.current_active_role() in ('admin', 'operador'));
create policy courses_admin_manage on public.courses
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');

create policy students_staff_read on public.students
  for select to authenticated
  using (public.current_active_role() in ('admin', 'operador'));
create policy students_staff_insert on public.students
  for insert to authenticated
  with check (public.current_active_role() in ('admin', 'operador'));
create policy students_staff_update on public.students
  for update to authenticated
  using (public.current_active_role() in ('admin', 'operador'))
  with check (public.current_active_role() in ('admin', 'operador'));

create policy enrollments_staff_read on public.enrollments
  for select to authenticated
  using (public.current_active_role() in ('admin', 'operador'));
create policy enrollments_staff_insert on public.enrollments
  for insert to authenticated
  with check (
    public.current_active_role() in ('admin', 'operador')
    and created_by = auth.uid()
  );
create policy enrollments_staff_update on public.enrollments
  for update to authenticated
  using (public.current_active_role() in ('admin', 'operador'))
  with check (public.current_active_role() in ('admin', 'operador'));

create policy parents_staff_access on public.parents_guardians
  for all to authenticated
  using (public.current_active_role() in ('admin', 'operador'))
  with check (public.current_active_role() in ('admin', 'operador'));

-- Política conservadora: somente admin até aprovação explícita de acesso
-- de operadores aos dados médicos e definição de escopo por matrícula.
create policy health_admin_only on public.health_records
  for all to authenticated
  using (public.current_active_role() = 'admin')
  with check (public.current_active_role() = 'admin');

create policy documents_staff_read on public.documents
  for select to authenticated
  using (public.current_active_role() in ('admin', 'operador'));
create policy documents_staff_insert on public.documents
  for insert to authenticated
  with check (public.current_active_role() in ('admin', 'operador'));
create policy documents_staff_update on public.documents
  for update to authenticated
  using (public.current_active_role() in ('admin', 'operador'))
  with check (public.current_active_role() in ('admin', 'operador'));

create policy generated_docs_staff_read on public.generated_documents
  for select to authenticated
  using (public.current_active_role() in ('admin', 'operador'));
create policy generated_docs_staff_insert on public.generated_documents
  for insert to authenticated
  with check (public.current_active_role() in ('admin', 'operador'));

create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated
  using (public.current_active_role() = 'admin');
-- Inserção de auditoria deve ocorrer via função/servidor confiável, não cliente livre.

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

-- Ainda requer revisão:
-- 1) REVOKE/GRANT explícitos por role/schema/table/function.
-- 2) Trigger de updated_at e provisionamento seguro de profiles.
-- 3) Proteção contra operador alterando created_by/curso/status em registros alheios.
-- 4) Acesso de operadores a dados de saúde, e acesso por matrícula atribuída.
-- 5) Policies de Storage privado e limites de MIME/tamanho.
-- 6) Gerador server-side de protocolo e prevenção de CPF duplicado transacional.
-- 7) Política de cancelamento/retention, LGPD, índices e testes de autorização.
-- 8) Não colocar este arquivo em supabase/migrations até aprovação formal.
