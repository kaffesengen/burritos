-- Steg 1: profiler og gamer-tag.
-- Kjør hele filen i Supabase → SQL Editor.

create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    gamer_tag text not null,
    gamer_tag_norm text not null unique,
    token_hash text not null,
    created_at timestamptz not null default now(),
    last_seen timestamptz not null default now()
);

create unique index if not exists profiles_gamer_tag_key on public.profiles (gamer_tag);

alter table public.profiles enable row level security;

drop policy if exists profiles_no_direct on public.profiles;
create policy profiles_no_direct on public.profiles
    for all using (false) with check (false);

create or replace function public.claim_gamer_tag(p_tag text, p_token_hash text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
    v_tag text;
    v_norm text;
begin
    v_tag := trim(p_tag);
    v_norm := lower(v_tag);
    if v_tag is null or char_length(v_tag) < 3 or char_length(v_tag) > 15 then
        return json_build_object('ok', false, 'error', 'invalid_tag');
    end if;
    if v_tag !~ '^[A-Za-z0-9_æøåÆØÅ]+$' then
        return json_build_object('ok', false, 'error', 'invalid_tag');
    end if;
    if p_token_hash is null or char_length(p_token_hash) < 32 then
        return json_build_object('ok', false, 'error', 'invalid_token');
    end if;

    insert into public.profiles (gamer_tag, gamer_tag_norm, token_hash)
    values (v_tag, v_norm, p_token_hash)
    returning id into v_id;

    return json_build_object('ok', true, 'id', v_id, 'gamer_tag', v_tag);
exception
    when unique_violation then
        return json_build_object('ok', false, 'error', 'taken');
end;
$$;

create or replace function public.login_gamer_tag(p_tag text, p_token_hash text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.profiles%rowtype;
begin
    select * into v_row
    from public.profiles
    where gamer_tag_norm = lower(trim(p_tag))
      and token_hash = p_token_hash;

    if not found then
        return json_build_object('ok', false, 'error', 'invalid');
    end if;

    update public.profiles set last_seen = now() where id = v_row.id;
    return json_build_object('ok', true, 'id', v_row.id, 'gamer_tag', v_row.gamer_tag);
end;
$$;

revoke all on public.profiles from anon, authenticated;
grant execute on function public.claim_gamer_tag(text, text) to anon, authenticated;
grant execute on function public.login_gamer_tag(text, text) to anon, authenticated;

-- Steg 2: presence (hvem er online / hvem hoster).
-- Kan kjøres på nytt; trygt sammen med steg 1.

create table if not exists public.presence (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    gamer_tag text not null,
    peer_id text,
    status text not null,
    updated_at timestamptz not null default now(),
    constraint presence_status_check check (status in ('online', 'hosting', 'in_game'))
);

alter table public.presence enable row level security;

drop policy if exists presence_no_direct on public.presence;
create policy presence_no_direct on public.presence
    for all using (false) with check (false);

create or replace function public.set_presence(p_tag text, p_token_hash text, p_peer_id text, p_status text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.profiles%rowtype;
begin
    if p_status is null or p_status not in ('online', 'hosting', 'in_game') then
        return json_build_object('ok', false, 'error', 'invalid_status');
    end if;

    select * into v_row
    from public.profiles
    where gamer_tag_norm = lower(trim(p_tag))
      and token_hash = p_token_hash;

    if not found then
        return json_build_object('ok', false, 'error', 'invalid');
    end if;

    insert into public.presence (user_id, gamer_tag, peer_id, status, updated_at)
    values (v_row.id, v_row.gamer_tag, nullif(trim(coalesce(p_peer_id, '')), ''), p_status, now())
    on conflict (user_id) do update set
        gamer_tag = excluded.gamer_tag,
        peer_id = excluded.peer_id,
        status = excluded.status,
        updated_at = now();

    update public.profiles set last_seen = now() where id = v_row.id;
    return json_build_object('ok', true);
end;
$$;

create or replace function public.clear_presence(p_tag text, p_token_hash text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
begin
    select id into v_id
    from public.profiles
    where gamer_tag_norm = lower(trim(p_tag))
      and token_hash = p_token_hash;

    if not found then
        return json_build_object('ok', false, 'error', 'invalid');
    end if;

    delete from public.presence where user_id = v_id;
    return json_build_object('ok', true);
end;
$$;

create or replace function public.list_online_players()
returns json
language sql
security definer
set search_path = public
as $$
    select coalesce(json_agg(row_obj order by sort_key, gamer_tag), '[]'::json)
    from (
        select
            json_build_object(
                'gamer_tag', gamer_tag,
                'status', status,
                'peer_id', peer_id
            ) as row_obj,
            case status when 'hosting' then 0 when 'in_game' then 1 else 2 end as sort_key,
            gamer_tag
        from public.presence
        where updated_at > now() - interval '40 seconds'
    ) listed;
$$;

revoke all on public.presence from anon, authenticated;
grant execute on function public.set_presence(text, text, text, text) to anon, authenticated;
grant execute on function public.clear_presence(text, text) to anon, authenticated;
grant execute on function public.list_online_players() to anon, authenticated;
