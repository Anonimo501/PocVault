-- PocVault: likes con allowlist y privilegios mínimos.
-- Ejecutar una vez en Supabase → SQL Editor. Es idempotente para re-ejecutar.
-- No pegar service_role en el navegador. Las funciones usan auth.uid() del JWT.

create table if not exists public.allowed_writeups (
  slug text primary key,
  created_at timestamptz not null default now(),
  constraint allowed_writeups_slug_format check (
    length(slug) between 1 and 180
    and slug ~ '^/writeups/[a-z0-9][a-z0-9/_-]*/$'
    and position('..' in slug) = 0
    and position('//' in slug) = 0
  )
);

alter table public.allowed_writeups enable row level security;
revoke all on table public.allowed_writeups from public, anon, authenticated;

-- Rutas Jekyll page.url actuales. Para una publicación nueva, añadir su slug aquí
-- (o ejecutar el INSERT indicado en CONFIGURAR-FUNCIONES.md) después de crearla.
insert into public.allowed_writeups (slug) values
  ('/writeups/cve-2026-63030/'),
  ('/writeups/cve-2026-xxxx/')
on conflict (slug) do nothing;

create table if not exists public.post_likes (
  post_slug text not null references public.allowed_writeups (slug) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_slug, user_id)
);

-- Migración segura si post_likes fue creada con la versión anterior del proyecto.
-- NOT VALID preserva filas históricas, pero valida futuras escrituras. Las funciones
-- además solo leen/escriben slugs que aparezcan en allowed_writeups.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.post_likes'::regclass
      and conname = 'post_likes_post_slug_fkey'
  ) then
    alter table public.post_likes
      add constraint post_likes_post_slug_fkey
      foreign key (post_slug)
      references public.allowed_writeups (slug)
      on delete cascade not valid;
  end if;
end
$$;

alter table public.post_likes enable row level security;
revoke all on table public.post_likes from public, anon, authenticated;

create or replace function public.get_post_likes(p_slug text)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint
  from public.post_likes as likes
  join public.allowed_writeups as posts on posts.slug = likes.post_slug
  where posts.slug = p_slug;
$$;

create or replace function public.has_liked_post(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.post_likes as likes
    join public.allowed_writeups as posts on posts.slug = likes.post_slug
    where posts.slug = p_slug
      and likes.user_id = (select auth.uid())
  );
$$;

create or replace function public.like_post(p_slug text)
returns table (like_count bigint, already_liked boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  inserted_rows integer;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Se requiere una sesión autenticada.' using errcode = '42501';
  end if;

  if p_slug is null or length(p_slug) > 180
     or not exists (select 1 from public.allowed_writeups as posts where posts.slug = p_slug) then
    raise exception 'Publicación no permitida.' using errcode = '22023';
  end if;

  insert into public.post_likes (post_slug, user_id)
  values (p_slug, current_user_id)
  on conflict (post_slug, user_id) do nothing;

  get diagnostics inserted_rows = row_count;
  return query
    select count(*)::bigint, (inserted_rows = 0)
    from public.post_likes as likes
    where likes.post_slug = p_slug;
end;
$$;

-- Las funciones SECURITY DEFINER son peligrosas si quedan ejecutables por PUBLIC.
revoke all on function public.get_post_likes(text) from public;
revoke all on function public.has_liked_post(text) from public, anon;
revoke all on function public.like_post(text) from public, anon;
grant execute on function public.get_post_likes(text) to anon, authenticated;
grant execute on function public.has_liked_post(text) to authenticated;
grant execute on function public.like_post(text) to authenticated;
