-- Appoyo Mutuo — schema inicial (independiente de Base44)
-- Aplicar en Supabase SQL Editor o: supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (1:1 con auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  bio text default '',
  avatar_url text default '',
  neighborhood text default '',
  areas_interest text[] default '{}',
  skills text default '',
  what_i_offer text default '',
  what_i_seek text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  area text not null default 'subsistencia'
    check (area in (
      'subsistencia','vivienda','trabajo','cuidados',
      'educacion','salud','ocio','comunidad'
    )),
  location text default '',
  neighborhood text not null default '',
  address text default '',
  lat double precision,
  lng double precision,
  contribution_type text not null default 'tiempo'
    check (contribution_type in ('dinero','tiempo','espacio','conocimiento')),
  status text not null default 'idea'
    check (status in ('idea','buscando','activandose','funcionando','necesita_piezas')),
  people_needed integer not null default 5,
  people_joined integer not null default 0,
  image_url text default '',
  conditions text default '',
  what_happens text default '',
  what_needed text default '',
  template_name text default '',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_created_at_idx on public.projects (created_at desc);
create index projects_created_by_idx on public.projects (created_by);
create index projects_status_idx on public.projects (status);

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  contribution_note text default '',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, created_by)
);

create index memberships_project_idx on public.memberships (project_id);
create index memberships_user_idx on public.memberships (created_by);

-- ---------------------------------------------------------------------------
-- templates (catálogo público)
-- ---------------------------------------------------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null
    check (area in (
      'subsistencia','vivienda','trabajo','cuidados',
      'educacion','salud','ocio','comunidad'
    )),
  description text not null default '',
  what_needed text default '',
  contribution_type text not null default 'tiempo'
    check (contribution_type in ('dinero','tiempo','espacio','conocimiento')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tasks / announcements / messages
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  status text not null default 'todo'
    check (status in ('todo','doing','done')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_project_idx on public.tasks (project_id);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  content text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index announcements_project_idx on public.announcements (project_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  content text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index messages_project_idx on public.messages (project_id, created_at);

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.project_id = p_project_id and m.created_by = auth.uid()
  )
  or exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.created_by = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- Mantener people_joined en sync (los miembros no pueden actualizar projects por RLS)
create or replace function public.sync_people_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  pid := coalesce(new.project_id, old.project_id);
  update public.projects p
  set people_joined = (
    select count(*)::integer from public.memberships m where m.project_id = pid
  )
  where p.id = pid;
  return coalesce(new, old);
end;
$$;

create trigger memberships_sync_joined
  after insert or delete on public.memberships
  for each row execute function public.sync_people_joined();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.memberships enable row level security;
alter table public.templates enable row level security;
alter table public.tasks enable row level security;
alter table public.announcements enable row level security;
alter table public.messages enable row level security;

-- profiles: lectura pública, escritura propia
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- projects: lectura pública; crear autenticado; editar/borrar creador
create policy "projects_select_all" on public.projects
  for select using (true);
create policy "projects_insert_auth" on public.projects
  for insert with check (auth.uid() = created_by);
create policy "projects_update_owner" on public.projects
  for update using (auth.uid() = created_by);
create policy "projects_delete_owner" on public.projects
  for delete using (auth.uid() = created_by);

-- memberships: lectura pública (quién participa); crear/borrar la propia
create policy "memberships_select_all" on public.memberships
  for select using (true);
create policy "memberships_insert_own" on public.memberships
  for insert with check (auth.uid() = created_by);
create policy "memberships_delete_own" on public.memberships
  for delete using (auth.uid() = created_by);

-- templates: lectura pública; escritura solo service role (sin policy insert para anon/auth)
create policy "templates_select_all" on public.templates
  for select using (true);

-- tasks / announcements / messages: miembros del proyecto
create policy "tasks_select_members" on public.tasks
  for select using (public.is_project_member(project_id));
create policy "tasks_insert_members" on public.tasks
  for insert with check (public.is_project_member(project_id));
create policy "tasks_update_members" on public.tasks
  for update using (public.is_project_member(project_id));
create policy "tasks_delete_members" on public.tasks
  for delete using (public.is_project_member(project_id));

create policy "announcements_select_members" on public.announcements
  for select using (public.is_project_member(project_id));
create policy "announcements_insert_members" on public.announcements
  for insert with check (public.is_project_member(project_id));
create policy "announcements_delete_members" on public.announcements
  for delete using (
    public.is_project_member(project_id)
    and (created_by = auth.uid() or exists (
      select 1 from public.projects p where p.id = project_id and p.created_by = auth.uid()
    ))
  );

create policy "messages_select_members" on public.messages
  for select using (public.is_project_member(project_id));
create policy "messages_insert_members" on public.messages
  for insert with check (
    public.is_project_member(project_id) and created_by = auth.uid()
  );
create policy "messages_delete_own" on public.messages
  for delete using (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('project-images', 'project-images', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars_auth_upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars_auth_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_auth_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "project_images_public_read" on storage.objects
  for select using (bucket_id = 'project-images');
create policy "project_images_auth_upload" on storage.objects
  for insert with check (bucket_id = 'project-images' and auth.role() = 'authenticated');
create policy "project_images_auth_update" on storage.objects
  for update using (bucket_id = 'project-images' and auth.role() = 'authenticated');
create policy "project_images_auth_delete" on storage.objects
  for delete using (bucket_id = 'project-images' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Seed templates
-- ---------------------------------------------------------------------------
insert into public.templates (name, area, description, what_needed, contribution_type) values
  ('Huerto urbano', 'subsistencia', 'Cultivo compartido en solar, terraza o patio vecinal.', 'Espacio, herramientas, turnos de riego, semillas', 'tiempo'),
  ('Cocina comunitaria', 'subsistencia', 'Aprovechar excedentes y cocinar juntos a precio justo.', 'Cocina, logística, voluntariado', 'espacio'),
  ('Vivienda cooperativa', 'vivienda', 'Grupo que rehabilita y habita en régimen no especulativo.', 'Capital semilla, estatutos, oficios', 'dinero'),
  ('Red de cuidados', 'cuidados', 'Turnos vecinos para acompañar a quien lo necesita.', 'Personas, formación, espacio de reunión', 'tiempo'),
  ('Escuela popular', 'educacion', 'Apoyo escolar y talleres fuera del mercado educativo.', 'Aula, educadoras, material', 'tiempo'),
  ('Taller comunitario', 'salud', 'Reparación de bicis, herramientas y movilidad activa.', 'Local, herramientas, gente con oficio', 'conocimiento'),
  ('Club de lectura barrial', 'ocio', 'Encuentros mensuales de lectura y debate.', 'Local o terraza, libros, dinamización', 'tiempo'),
  ('Asamblea de barrio', 'comunidad', 'Espacio fijo para decidir asuntos comunes del vecindario.', 'Lugar, difusión, facilitación', 'tiempo'),
  ('Coworking mutualista', 'trabajo', 'Espacio de trabajo compartido con costes rotativos.', 'Local, wifi, acuerdos de uso', 'dinero');
