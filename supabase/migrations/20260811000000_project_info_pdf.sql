-- PDF informativo en proyectos + bucket de documentos
alter table public.projects
  add column if not exists info_pdf_url text default '';

insert into storage.buckets (id, name, public)
values ('project-docs', 'project-docs', true)
on conflict (id) do nothing;

create policy "project_docs_public_read" on storage.objects
  for select using (bucket_id = 'project-docs');
create policy "project_docs_auth_upload" on storage.objects
  for insert with check (bucket_id = 'project-docs' and auth.role() = 'authenticated');
create policy "project_docs_auth_update" on storage.objects
  for update using (bucket_id = 'project-docs' and auth.role() = 'authenticated');
create policy "project_docs_auth_delete" on storage.objects
  for delete using (bucket_id = 'project-docs' and auth.role() = 'authenticated');
