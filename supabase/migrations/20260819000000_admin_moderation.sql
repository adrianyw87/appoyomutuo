-- Admin + moderación de proyectos
-- Los proyectos nuevos quedan en pending hasta que un admin los apruebe.
-- Los ya existentes se marcan como approved para no ocultar el radar actual.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.projects
  add column if not exists moderation_status text not null default 'pending';

alter table public.projects
  drop constraint if exists projects_moderation_status_check;

alter table public.projects
  add constraint projects_moderation_status_check
  check (moderation_status in ('pending', 'approved', 'rejected'));

alter table public.projects
  add column if not exists moderation_note text default '';

alter table public.projects
  add column if not exists moderated_at timestamptz;

alter table public.projects
  add column if not exists moderated_by uuid references auth.users (id) on delete set null;

create index if not exists projects_moderation_idx on public.projects (moderation_status);

-- Primera aplicación: los proyectos actuales siguen visibles.
-- Si se reejecuta el SQL más tarde, no aprueba la cola de pendientes.
do $$
begin
  if not exists (
    select 1 from public.projects where moderated_at is not null
  ) then
    update public.projects
    set
      moderation_status = 'approved',
      moderated_at = now();
  end if;
end $$;

update public.profiles p
set is_admin = true
from auth.users u
where u.id = p.id
  and lower(u.email) = 'appoyomutuo@gmail.com';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Nadie autenticado puede ponerse is_admin. El SQL del dashboard sí puede.
create or replace function public.protect_admin_flag()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_admin := false;
  elsif tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_admin on public.profiles;
create trigger profiles_protect_admin
  before insert or update on public.profiles
  for each row execute function public.protect_admin_flag();

-- Insert: siempre pending. Solo un admin puede cambiar la moderación.
create or replace function public.enforce_project_moderation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.moderation_status := 'pending';
    new.moderation_note := coalesce(new.moderation_note, '');
    new.moderated_at := null;
    new.moderated_by := null;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not public.is_admin() then
      new.moderation_status := old.moderation_status;
      new.moderation_note := old.moderation_note;
      new.moderated_at := old.moderated_at;
      new.moderated_by := old.moderated_by;
    elsif new.moderation_status is distinct from old.moderation_status then
      new.moderated_at := now();
      new.moderated_by := auth.uid();
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists projects_enforce_moderation on public.projects;
create trigger projects_enforce_moderation
  before insert or update on public.projects
  for each row execute function public.enforce_project_moderation();

drop policy if exists "projects_select_all" on public.projects;
drop policy if exists "projects_select_public_or_own_or_admin" on public.projects;
create policy "projects_select_public_or_own_or_admin" on public.projects
  for select using (
    moderation_status = 'approved'
    or created_by = auth.uid()
    or public.is_admin()
  );

drop policy if exists "projects_update_admin" on public.projects;
create policy "projects_update_admin" on public.projects
  for update using (public.is_admin());

drop policy if exists "projects_delete_admin" on public.projects;
create policy "projects_delete_admin" on public.projects
  for delete using (public.is_admin());

drop policy if exists "memberships_insert_own" on public.memberships;
create policy "memberships_insert_own" on public.memberships
  for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.moderation_status = 'approved'
    )
  );

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  neighborhood text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_admin boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.full_name,
    p.neighborhood,
    coalesce(u.created_at, p.created_at),
    u.last_sign_in_at,
    p.is_admin
  from public.profiles p
  join auth.users u on u.id = p.id
  order by u.created_at desc;
end;
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

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
