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

-- Steg 3: venner (søk, forespørsel, godta).
-- Kan kjøres på nytt; trygt sammen med steg 1 og 2.

create table if not exists public.friendships (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid not null references public.profiles(id) on delete cascade,
    addressee_id uuid not null references public.profiles(id) on delete cascade,
    status text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint friendships_status_check check (status in ('pending', 'accepted')),
    constraint friendships_not_self check (requester_id <> addressee_id)
);

create unique index if not exists friendships_pair_key
    on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

drop policy if exists friendships_no_direct on public.friendships;
create policy friendships_no_direct on public.friendships
    for all using (false) with check (false);

create or replace function public.search_players(p_tag text, p_token_hash text, p_query text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_me public.profiles%rowtype;
    v_q text;
    v_rows json;
begin
    select * into v_me
    from public.profiles
    where gamer_tag_norm = lower(trim(p_tag))
      and token_hash = p_token_hash;

    if not found then
        return json_build_object('ok', false, 'error', 'invalid');
    end if;

    v_q := lower(trim(both from coalesce(p_query, '')));
    if left(v_q, 1) = '@' then
        v_q := substr(v_q, 2);
    end if;
    if char_length(v_q) < 2 or char_length(v_q) > 15 then
        return json_build_object('ok', false, 'error', 'invalid_query');
    end if;

    select coalesce(json_agg(row_obj order by exact_match desc, gamer_tag), '[]'::json)
    into v_rows
    from (
        select
            json_build_object(
                'gamer_tag', p.gamer_tag,
                'relation', case
                    when f.status = 'accepted' then 'friends'
                    when f.status = 'pending' and f.requester_id = v_me.id then 'outgoing'
                    when f.status = 'pending' and f.addressee_id = v_me.id then 'incoming'
                    else 'none'
                end,
                'status', case
                    when pr.updated_at is not null and pr.updated_at > now() - interval '40 seconds'
                    then pr.status
                    else null
                end,
                'peer_id', pr.peer_id
            ) as row_obj,
            (p.gamer_tag_norm = v_q) as exact_match,
            p.gamer_tag
        from public.profiles p
        left join public.friendships f
            on least(f.requester_id, f.addressee_id) = least(v_me.id, p.id)
           and greatest(f.requester_id, f.addressee_id) = greatest(v_me.id, p.id)
        left join public.presence pr on pr.user_id = p.id
        where p.id <> v_me.id
          and position(v_q in p.gamer_tag_norm) > 0
        order by (p.gamer_tag_norm = v_q) desc, p.gamer_tag
        limit 8
    ) found_rows;

    return json_build_object('ok', true, 'results', v_rows);
end;
$$;

create or replace function public.send_friend_request(p_tag text, p_token_hash text, p_other_tag text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_me public.profiles%rowtype;
    v_other public.profiles%rowtype;
    v_row public.friendships%rowtype;
begin
    select * into v_me
    from public.profiles
    where gamer_tag_norm = lower(trim(p_tag))
      and token_hash = p_token_hash;

    if not found then
        return json_build_object('ok', false, 'error', 'invalid');
    end if;

    select * into v_other
    from public.profiles
    where gamer_tag_norm = lower(trim(both '@' from trim(p_other_tag)));

    if not found then
        return json_build_object('ok', false, 'error', 'not_found');
    end if;

    if v_other.id = v_me.id then
        return json_build_object('ok', false, 'error', 'self');
    end if;

    select * into v_row
    from public.friendships
    where least(requester_id, addressee_id) = least(v_me.id, v_other.id)
      and greatest(requester_id, addressee_id) = greatest(v_me.id, v_other.id);

    if found then
        if v_row.status = 'accepted' then
            return json_build_object('ok', false, 'error', 'already_friends');
        end if;
        if v_row.requester_id = v_me.id then
            return json_build_object('ok', false, 'error', 'already_sent');
        end if;
        update public.friendships
        set status = 'accepted', updated_at = now()
        where id = v_row.id;
        return json_build_object('ok', true, 'status', 'accepted');
    end if;

    insert into public.friendships (requester_id, addressee_id, status)
    values (v_me.id, v_other.id, 'pending');

    return json_build_object('ok', true, 'status', 'pending');
exception
    when unique_violation then
        return json_build_object('ok', false, 'error', 'already_sent');
end;
$$;

create or replace function public.respond_friend_request(p_tag text, p_token_hash text, p_other_tag text, p_action text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_me public.profiles%rowtype;
    v_other public.profiles%rowtype;
    v_count int;
begin
    if p_action is null or p_action not in ('accept', 'decline', 'cancel', 'remove') then
        return json_build_object('ok', false, 'error', 'invalid_action');
    end if;

    select * into v_me
    from public.profiles
    where gamer_tag_norm = lower(trim(p_tag))
      and token_hash = p_token_hash;

    if not found then
        return json_build_object('ok', false, 'error', 'invalid');
    end if;

    select * into v_other
    from public.profiles
    where gamer_tag_norm = lower(trim(both '@' from trim(p_other_tag)));

    if not found then
        return json_build_object('ok', false, 'error', 'not_found');
    end if;

    if p_action = 'accept' then
        update public.friendships
        set status = 'accepted', updated_at = now()
        where addressee_id = v_me.id
          and requester_id = v_other.id
          and status = 'pending';
        get diagnostics v_count = row_count;
        if v_count = 0 then
            return json_build_object('ok', false, 'error', 'not_pending');
        end if;
        return json_build_object('ok', true, 'status', 'accepted');
    end if;

    if p_action = 'decline' then
        delete from public.friendships
        where addressee_id = v_me.id
          and requester_id = v_other.id
          and status = 'pending';
    elsif p_action = 'cancel' then
        delete from public.friendships
        where requester_id = v_me.id
          and addressee_id = v_other.id
          and status = 'pending';
    else
        delete from public.friendships
        where status = 'accepted'
          and least(requester_id, addressee_id) = least(v_me.id, v_other.id)
          and greatest(requester_id, addressee_id) = greatest(v_me.id, v_other.id);
    end if;

    get diagnostics v_count = row_count;
    if v_count = 0 then
        return json_build_object('ok', false, 'error', 'not_found');
    end if;
    return json_build_object('ok', true);
end;
$$;

create or replace function public.list_friendships(p_tag text, p_token_hash text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_me public.profiles%rowtype;
    v_friends json;
    v_incoming json;
    v_outgoing json;
begin
    select * into v_me
    from public.profiles
    where gamer_tag_norm = lower(trim(p_tag))
      and token_hash = p_token_hash;

    if not found then
        return json_build_object('ok', false, 'error', 'invalid');
    end if;

    select coalesce(json_agg(row_obj order by gamer_tag), '[]'::json)
    into v_friends
    from (
        select
            json_build_object(
                'gamer_tag', other.gamer_tag,
                'status', case
                    when pr.updated_at is not null and pr.updated_at > now() - interval '40 seconds'
                    then pr.status
                    else null
                end
            ) as row_obj,
            other.gamer_tag
        from public.friendships f
        join public.profiles other
            on other.id = case
                when f.requester_id = v_me.id then f.addressee_id
                else f.requester_id
            end
        left join public.presence pr on pr.user_id = other.id
        where f.status = 'accepted'
          and (f.requester_id = v_me.id or f.addressee_id = v_me.id)
    ) listed;

    select coalesce(json_agg(row_obj order by gamer_tag), '[]'::json)
    into v_incoming
    from (
        select json_build_object('gamer_tag', other.gamer_tag) as row_obj, other.gamer_tag
        from public.friendships f
        join public.profiles other on other.id = f.requester_id
        where f.addressee_id = v_me.id and f.status = 'pending'
    ) listed;

    select coalesce(json_agg(row_obj order by gamer_tag), '[]'::json)
    into v_outgoing
    from (
        select json_build_object('gamer_tag', other.gamer_tag) as row_obj, other.gamer_tag
        from public.friendships f
        join public.profiles other on other.id = f.addressee_id
        where f.requester_id = v_me.id and f.status = 'pending'
    ) listed;

    return json_build_object(
        'ok', true,
        'friends', v_friends,
        'incoming', v_incoming,
        'outgoing', v_outgoing
    );
end;
$$;

revoke all on public.friendships from anon, authenticated;
grant execute on function public.search_players(text, text, text) to anon, authenticated;
grant execute on function public.send_friend_request(text, text, text) to anon, authenticated;
grant execute on function public.respond_friend_request(text, text, text, text) to anon, authenticated;
grant execute on function public.list_friendships(text, text) to anon, authenticated;
