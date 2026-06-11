-- Supabase SQL Editor에 그대로 붙여넣고 Run 하세요.

create table if not exists predictions (
  user_id    text primary key,
  nickname   text not null,
  team       text not null,
  scores     jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists likes (
  pred_user_id text not null,
  liker_id     text not null,
  created_at   timestamptz not null default now(),
  primary key (pred_user_id, liker_id)
);

create table if not exists official_results (
  match_id text primary key,   -- 'czech' | 'mexico' | 'sa'
  kr       int  not null default 0,
  opp      int  not null default 0,
  entered  boolean not null default false
);

-- 참고: 모든 DB 접근은 서버(service_role 키)로만 이뤄지므로 RLS는 꺼둔 기본 상태로 충분합니다.
-- 클라이언트는 Supabase에 직접 접속하지 않고 우리 /api 경로만 호출합니다.
