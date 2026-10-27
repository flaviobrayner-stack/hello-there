-- Allow operators to read health details only for enrollments they created.
-- The existing ALL policy remains admin-only, so operators gain no write access.
drop policy if exists health_staff_read_authorized_enrollments on public.health_records;
create policy health_staff_read_authorized_enrollments
on public.health_records
for select
to authenticated
using (
  public.current_active_role() = 'admin'
  or (
    public.current_active_role() = 'operador'
    and exists (
      select 1
      from public.enrollments e
      where e.id = health_records.enrollment_id
        and e.created_by = auth.uid()
    )
  )
);
