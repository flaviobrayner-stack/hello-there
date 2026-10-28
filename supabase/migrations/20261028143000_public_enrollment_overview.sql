create or replace function public.public_enrollment_overview()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
with base as (
  select e.id, e.status, e.created_at, e.course_id, e.is_quota, e.quota_type, c.name as course_name
  from public.enrollments e
  left join public.courses c on c.id = e.course_id
  where e.cancelled_at is null and lower(e.status) <> 'cancelada'
),
doc_by_enrollment as (
  select b.id,
    count(d.id) filter (where d.required)::int as required_total,
    count(d.id) filter (where d.required and lower(coalesce(d.status,'')) in ('entregue','conferido'))::int as required_delivered,
    bool_or(d.document_type = 'duas_fotos_3x4' and lower(coalesce(d.status,'')) not in ('entregue','conferido')) as photo_pending,
    bool_or(d.document_type = 'ficha_18' and lower(coalesce(d.status,'')) not in ('entregue','conferido')) as ficha18_pending,
    bool_or(d.document_type = 'duas_fotos_3x4') as photo_recorded,
    bool_or(d.document_type = 'ficha_18') as ficha18_recorded
  from base b left join public.documents d on d.enrollment_id = b.id group by b.id
),
completed as (select b.* from base b where lower(b.status) in ('concluida','concluída')),
daily as (
  select to_char(created_at at time zone 'America/Recife', 'DD/MM') as label, count(*)::int as total,
         min((created_at at time zone 'America/Recife')::date) as day
  from completed where created_at >= now() - interval '30 days'
  group by 1 order by day desc limit 7
),
courses as (select coalesce(course_name, 'Não informado') as name, count(*)::int as total from completed group by 1 order by 2 desc, 1),
quotas as (
  select case when coalesce(is_quota,false) then coalesce(quota_type,'Não informado') else 'Não cotista' end as name,
         count(*)::int as total from completed group by 1 order by 2 desc, 1
),
pending as (
  select count(*) filter (where lower(b.status) in ('concluida','concluída') and (coalesce(d.photo_pending,false) or not coalesce(d.photo_recorded,false)))::int as photos,
         count(*) filter (where lower(b.status) in ('concluida','concluída') and (coalesce(d.ficha18_pending,false) or not coalesce(d.ficha18_recorded,false)))::int as ficha18
  from base b join doc_by_enrollment d on d.id=b.id
),
doc_metrics as (
  select count(*) filter (where lower(b.status) in ('concluida','concluída') and d.required_total > 0 and d.required_total = d.required_delivered)::int as complete_count,
         count(*) filter (where lower(b.status) in ('concluida','concluída'))::int as completed_count
  from base b join doc_by_enrollment d on d.id=b.id
)
select jsonb_build_object(
  'total_matriculas', (select count(*)::int from base where lower(status) in ('concluida','concluída')),
  'rascunhos', (select count(*)::int from base where lower(status) in ('rascunho','draft')),
  'em_analise', (select count(*)::int from base where lower(status) in ('em análise','em analise','em_analise')),
  'documentacao_completa', (select complete_count from doc_metrics),
  'percentual_documentacao', case when (select completed_count from doc_metrics)=0 then 0 else round(100.0*(select complete_count from doc_metrics)/(select completed_count from doc_metrics))::int end,
  'alunos_sem_fotos', (select photos from pending),
  'alunos_sem_ficha18', (select ficha18 from pending),
  'matriculas_por_dia', coalesce((select jsonb_agg(jsonb_build_object('name',label,'total',total) order by day) from daily), '[]'::jsonb),
  'matriculas_por_curso', coalesce((select jsonb_agg(jsonb_build_object('name',name,'total',total)) from courses), '[]'::jsonb),
  'matriculas_por_cota', coalesce((select jsonb_agg(jsonb_build_object('name',name,'total',total)) from quotas), '[]'::jsonb),
  'pendencias_documentais', jsonb_build_array(jsonb_build_object('name','Fotos 3×4','total',(select photos from pending)),jsonb_build_object('name','Ficha 18','total',(select ficha18 from pending))),
  'atualizado_em', now()
);
$function$;
revoke all on function public.public_enrollment_overview() from public;
grant execute on function public.public_enrollment_overview() to anon, authenticated;