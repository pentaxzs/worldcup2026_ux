# 2026 월드컵 대한민국 승부예측 (Next.js + Supabase)

UX 팀 대항전용 승부예측 웹앱. 대한민국 조별리그 3경기 스코어를 예측하고,
모두의 예측·좋아요·실시간 팀/개인 순위·우승 팀 공개까지 제공합니다.

- 프론트: Next.js 14 (App Router), 커스텀 CSS
- 백엔드: Next.js Route Handlers (`/api/*`)
- DB: Supabase (Postgres)
- 운영자 PIN은 **서버에서 검증** (`ADMIN_PIN` 환경변수)

---

## 1. 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev                          # http://localhost:3000
```

## 2. Supabase 준비 (무료)

1. https://supabase.com 에서 프로젝트 생성
2. 좌측 **SQL Editor** → New query → `supabase/schema.sql` 내용 붙여넣고 **Run**
   (predictions / likes / official_results 3개 테이블 생성)
3. **Project Settings → API** 에서 아래 두 값 복사
   - Project URL → `SUPABASE_URL`
   - service_role 키(secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ service_role 키는 서버 전용입니다. 절대 공개 저장소/클라이언트에 넣지 마세요.

`.env.local` 예시:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ADMIN_PIN=0909
```

## 3. Vercel 배포

1. 이 폴더를 GitHub 저장소에 push
   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin <YOUR_REPO_URL>
   git push -u origin main
   ```
2. https://vercel.com → **Add New → Project** → 저장소 import (프레임워크: Next.js 자동 인식)
3. **Settings → Environment Variables** 에 3개 추가:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PIN` (기본 0909, 원하면 변경)
4. **Deploy** → 생성된 도메인을 팀원에게 공유

> 팁: Vercel 대시보드의 **Storage(마켓플레이스)** 에서 Supabase를 바로 연결할 수도 있습니다.
> 이 경우 환경변수가 자동 주입될 수 있는데, 변수명이 다르면 위 3개 이름에 맞게 매핑하세요.

---

## 동작 메모

- 참여자는 익명 ID(localStorage `wc_uid`)로 식별됩니다. 1인 1예측, 제출 후 본인 화면에서는 수정 불가(잠금).
- 좋아요는 (예측, 좋아요한 사람) 조합당 1개. 다시 누르면 취소.
- 공식 결과 입력은 운영자 PIN이 맞아야 서버가 저장을 허용합니다(클라이언트 우회 불가).
- 순위는 20초마다 자동 새로고침 + 피드의 ↻ 버튼으로 수동 갱신.

## 채점 규칙

- **적중**: 승·무·패 결과를 맞춘 경기 수
- **정확**: 스코어까지 정확히 맞춘 경기 수
- **개인 순위**: 적중 → (동점 시) 정확
- **팀 순위 / 우승**: 팀원들의 총 적중 수 (정확·평균은 동점 처리/참고용)
  - 팀 인원이 크게 다르면 평균 기준이 더 공정할 수 있습니다. `teamRank` 정렬 기준만 바꾸면 됩니다.

## 커스터마이즈 포인트 (`components/WorldCupApp.tsx`)

- `MATCHES`: 경기 정보(상대팀/날짜/장소)
- `TEAMS`: 참가 조직 목록(UX1팀/UX2팀/UX3팀)
- `scoreOne`: 채점 로직
- 색상/스타일: `app/globals.css` 상단의 `--red`, `--gold` 등 토큰
