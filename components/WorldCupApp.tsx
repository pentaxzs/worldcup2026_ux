"use client";

import { useEffect, useMemo, useState } from "react";

/* ============================================================
   2026 월드컵 대한민국 승부예측 + UX 팀 대항전 (Next.js / Supabase)
   - 데이터는 /api/* 경유로 Supabase에 저장/조회
   - 익명 user_id는 localStorage에 보관
   ============================================================ */

const KR = { name: "대한민국", en: "KOR", flag: "🇰🇷" };
const TEAMS = ["UX1팀", "UX2팀", "UX3팀"];

const MATCHES = [
  { id: "czech",  no: 1, krHome: true,  opp: "체코",   en: "CZE", flag: "🇨🇿", date: "6.12 (금) 11:00", venue: "과달라하라" },
  { id: "mexico", no: 2, krHome: false, opp: "멕시코", en: "MEX", flag: "🇲🇽", date: "6.19 (금) 10:00", venue: "과달라하라" },
  { id: "sa",     no: 3, krHome: false, opp: "남아공", en: "RSA", flag: "🇿🇦", date: "6.25 (목) 10:00", venue: "몬테레이" },
];

const emptyScores = () => MATCHES.reduce((a: any, m) => ({ ...a, [m.id]: { kr: 0, opp: 0 } }), {});
const emptyOfficial = () => MATCHES.reduce((a: any, m) => ({ ...a, [m.id]: { kr: 0, opp: 0, entered: false } }), {});
const outcome = (a: number, b: number) => (a > b ? "W" : a < b ? "L" : "D");

function scoreOne(pred: any, official: any) {
  let hits = 0, perfects = 0, played = 0;
  for (const m of MATCHES) {
    const o = official[m.id];
    if (!o || !o.entered) continue;
    played++;
    const ps = (pred.scores && pred.scores[m.id]) || { kr: 0, opp: 0 };
    if (ps.kr === o.kr && ps.opp === o.opp) { perfects++; hits++; }
    else if (outcome(ps.kr, ps.opp) === outcome(o.kr, o.opp)) { hits++; }
  }
  return { hits, perfects, played };
}

function timeAgo(ts: number) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "방금";
  const min = Math.floor(s / 60);
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const api = {
  async state() {
    const r = await fetch("/api/state", { cache: "no-store" });
    return r.json();
  },
  async predict(body: any) {
    return fetch("/api/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  },
  async like(body: any) {
    return fetch("/api/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  },
  async official(body: any) {
    return fetch("/api/official", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  },
};

function Stepper({ value, onChange, side, compact }: any) {
  const [bump, setBump] = useState(false);
  const change = (d: number) => {
    const v = Math.max(0, Math.min(20, value + d));
    if (v !== value) { onChange(v); setBump(true); setTimeout(() => setBump(false), 220); }
  };
  return (
    <div className={`wc-stepper ${compact ? "wc-stepper-sm" : ""}`}>
      <button className="wc-step-btn" aria-label="점수 올리기" onClick={() => change(1)}>+</button>
      <span className={`wc-digit ${side === "kr" ? "wc-digit-kr" : ""} ${bump ? "wc-pop" : ""}`}>{value}</span>
      <button className="wc-step-btn" aria-label="점수 내리기" onClick={() => change(-1)}>−</button>
    </div>
  );
}

function MatchBoard({ m, scores, setScore }: any) {
  const left = m.krHome ? KR : { name: m.opp, en: m.en, flag: m.flag };
  const right = m.krHome ? { name: m.opp, en: m.en, flag: m.flag } : KR;
  const leftKey = m.krHome ? "kr" : "opp";
  const rightKey = m.krHome ? "opp" : "kr";
  return (
    <div className="wc-board">
      <div className="wc-board-top">
        <span className="wc-matchno">MATCH {m.no}</span>
        <span className="wc-when">{m.date} · {m.venue}</span>
      </div>
      <div className="wc-board-body">
        <div className={`wc-team ${leftKey === "kr" ? "wc-team-kr" : ""}`}>
          <span className="wc-flag">{left.flag}</span><span className="wc-team-name">{left.name}</span><span className="wc-team-en">{left.en}</span>
        </div>
        <div className="wc-score-wrap">
          <Stepper value={scores[m.id][leftKey]} side={leftKey} onChange={(v: number) => setScore(m.id, leftKey, v)} />
          <span className="wc-colon">:</span>
          <Stepper value={scores[m.id][rightKey]} side={rightKey} onChange={(v: number) => setScore(m.id, rightKey, v)} />
        </div>
        <div className={`wc-team ${rightKey === "kr" ? "wc-team-kr" : ""}`}>
          <span className="wc-flag">{right.flag}</span><span className="wc-team-name">{right.name}</span><span className="wc-team-en">{right.en}</span>
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ p, count, liked, mine, onLike, official, anyResult }: any) {
  const [pop, setPop] = useState(false);
  const handle = () => { setPop(true); setTimeout(() => setPop(false), 320); onLike(); };
  const sc = anyResult ? scoreOne(p, official) : null;
  return (
    <div className={`wc-pcard ${mine ? "wc-pcard-mine" : ""}`}>
      <div className="wc-pcard-head">
        <div className="wc-pcard-who">
          <span className="wc-pcard-nick">{p.nickname}{mine && <span className="wc-mine-tag">나</span>}</span>
          <span className="wc-pcard-team">{p.team || "미지정"}</span>
        </div>
        <div className="wc-pcard-right">
          {sc && sc.played > 0 && (
            <span className="wc-hitbadge">{sc.hits}적중{sc.perfects > 0 ? ` · ${sc.perfects}정확` : ""}</span>
          )}
          <span className="wc-pcard-time">{timeAgo(p.createdAt)}</span>
        </div>
      </div>
      <div className="wc-pcard-rows">
        {MATCHES.map((m) => {
          const s = p.scores[m.id] || { kr: 0, opp: 0 };
          const lf = m.krHome ? KR.flag : m.flag;
          const rf = m.krHome ? m.flag : KR.flag;
          const lv = m.krHome ? s.kr : s.opp;
          const rv = m.krHome ? s.opp : s.kr;
          const o = official[m.id];
          let mk = "";
          if (o && o.entered) {
            if (s.kr === o.kr && s.opp === o.opp) mk = "perfect";
            else if (outcome(s.kr, s.opp) === outcome(o.kr, o.opp)) mk = "hit";
            else mk = "miss";
          }
          return (
            <div key={m.id} className={`wc-prow ${mk ? "wc-prow-" + mk : ""}`}>
              <span className="wc-prow-flag">{lf}</span>
              <span className="wc-prow-score">{lv} : {rv}</span>
              <span className="wc-prow-flag">{rf}</span>
            </div>
          );
        })}
      </div>
      <button className={`wc-like ${liked ? "wc-like-on" : ""} ${pop ? "wc-like-pop" : ""}`} onClick={handle}>
        <span className="wc-heart">{liked ? "❤" : "♡"}</span><span className="wc-like-count">{count}</span>
      </button>
    </div>
  );
}

function Confetti() {
  const colors = ["#E4002B", "#FFC93C", "#FFFFFF", "#FF274F", "#1FA34A"];
  const pieces = useMemo(() => Array.from({ length: 110 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 0.6,
    dur: 1.8 + Math.random() * 1.6, size: 6 + Math.random() * 9,
    color: colors[i % colors.length], rot: Math.random() * 360,
  })), []);
  return (
    <div className="wc-confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.id} className="wc-conf-piece" style={{
          left: `${p.left}%`, width: p.size, height: p.size * 1.4, background: p.color,
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)`,
        }} />
      ))}
    </div>
  );
}

export default function WorldCupApp() {
  const [tab, setTab] = useState("predict");
  const [scores, setScores] = useState<any>(emptyScores());
  const [team, setTeam] = useState("");
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [preds, setPreds] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [official, setOfficial] = useState<any>(emptyOfficial());
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);
  const [banner, setBanner] = useState(false);
  const [sort, setSort] = useState("recent");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [winnerShown, setWinnerShown] = useState(false);
  const [mySubmitted, setMySubmitted] = useState(false);

  const setScore = (mid: string, key: string, v: number) =>
    setScores((s: any) => ({ ...s, [mid]: { ...s[mid], [key]: v } }));

  const applyState = (data: any, uid: string | null) => {
    const ps = (data.predictions || []).map((r: any) => ({
      userId: r.user_id, nickname: r.nickname, team: r.team,
      scores: r.scores, createdAt: new Date(r.created_at).getTime(),
    }));
    setPreds(ps);
    setLikes(data.likes || []);
    setOfficial({ ...emptyOfficial(), ...(data.official || {}) });
    if (uid) {
      const mine = ps.find((p: any) => p.userId === uid);
      if (mine) {
        setNickname(mine.nickname || ""); setTeam(mine.team || "");
        setScores({ ...emptyScores(), ...mine.scores }); setMySubmitted(true);
      }
    }
  };

  const refresh = async (uid: string | null = userId) => {
    try { const data = await api.state(); applyState(data, uid); } catch {}
  };

  useEffect(() => {
    let id = "";
    try {
      id = localStorage.getItem("wc_uid") || "";
      if (!id) { id = "u" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); localStorage.setItem("wc_uid", id); }
    } catch {}
    setUserId(id);
    (async () => { await refresh(id); setLoading(false); })();
    const t = setInterval(() => refresh(id), 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { counts, myLikes } = useMemo(() => {
    const counts: Record<string, number> = {}; const myLikes = new Set<string>();
    for (const row of likes) {
      counts[row.pred_user_id] = (counts[row.pred_user_id] || 0) + 1;
      if (row.liker_id === userId) myLikes.add(row.pred_user_id);
    }
    return { counts, myLikes };
  }, [likes, userId]);

  const anyResult = useMemo(() => MATCHES.some((m) => official[m.id] && official[m.id].entered), [official]);
  const allResult = useMemo(() => MATCHES.every((m) => official[m.id] && official[m.id].entered), [official]);

  const sortedPreds = useMemo(() => {
    const arr = [...preds];
    if (sort === "likes") arr.sort((a, b) => (counts[b.userId] || 0) - (counts[a.userId] || 0) || b.createdAt - a.createdAt);
    else arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
  }, [preds, sort, counts]);

  const individualRank = useMemo(() =>
    preds.map((p) => ({ p, ...scoreOne(p, official) }))
      .sort((a, b) => b.hits - a.hits || b.perfects - a.perfects || a.p.createdAt - b.p.createdAt),
  [preds, official]);

  const teamRank = useMemo(() => {
    const map: Record<string, any> = {};
    TEAMS.forEach((t) => (map[t] = { team: t, hits: 0, perfects: 0, members: 0 }));
    for (const p of preds) {
      if (!map[p.team]) continue;
      const s = scoreOne(p, official);
      map[p.team].hits += s.hits; map[p.team].perfects += s.perfects; map[p.team].members += 1;
    }
    return Object.values(map).map((t: any) => ({ ...t, avg: t.members ? t.hits / t.members : 0 }))
      .sort((a, b) => b.hits - a.hits || b.perfects - a.perfects || b.avg - a.avg);
  }, [preds, official]);

  const winner = allResult && teamRank.length && teamRank[0].members > 0 ? teamRank[0] : null;
  const maxTeamHits = Math.max(1, ...teamRank.map((t: any) => t.hits));

  const matchTeamResults = useMemo(() => {
    return MATCHES.map((m) => {
      const o = official[m.id];
      const entered = !!(o && o.entered);
      const map: Record<string, any> = {};
      TEAMS.forEach((t) => (map[t] = { team: t, correct: 0, perfect: 0 }));
      if (entered) {
        for (const p of preds) {
          if (!map[p.team]) continue;
          const ps = p.scores[m.id] || { kr: 0, opp: 0 };
          if (ps.kr === o.kr && ps.opp === o.opp) { map[p.team].correct++; map[p.team].perfect++; }
          else if (outcome(ps.kr, ps.opp) === outcome(o.kr, o.opp)) map[p.team].correct++;
        }
      }
      const ranked = Object.values(map).sort((a: any, b: any) => b.correct - a.correct || b.perfect - a.perfect);
      const top: any = ranked[0];
      const winners = entered && top && top.correct > 0 ? ranked.filter((r: any) => r.correct === top.correct) : [];
      return { m, entered, ranked, winners, official: o };
    });
  }, [preds, official]);
  const canSubmit = nickname.trim() && team && userId;

  const submit = async () => {
    if (!canSubmit) return;
    await api.predict({ userId, nickname: nickname.trim(), team, scores });
    await refresh(userId);
    setConfetti(true); setBanner(true); setMySubmitted(true);
    setTimeout(() => setConfetti(false), 2800);
    setTimeout(() => { setBanner(false); setTab("feed"); }, 1900);
  };

  const toggleLike = async (pid: string) => {
    if (!userId) return;
    const liked = myLikes.has(pid);
    setLikes((prev) => liked
      ? prev.filter((r) => !(r.pred_user_id === pid && r.liker_id === userId))
      : [...prev, { pred_user_id: pid, liker_id: userId }]);
    await api.like({ predUserId: pid, likerId: userId, liked: !liked });
    refresh(userId);
  };

  const tryPin = async () => {
    const res = await api.official({ pin: pinInput });
    if (res.ok) { setAdminUnlocked(true); setAdminPin(pinInput); setPinError(false); setPinInput(""); }
    else { setPinError(true); setPinInput(""); }
  };

  const writeOfficial = async (mid: string, patch: any) => {
    const cur = official[mid];
    const next = { ...cur, ...patch };
    setOfficial((o: any) => ({ ...o, [mid]: next })); // 낙관적 반영
    const res = await api.official({ pin: adminPin, matchId: mid, kr: next.kr, opp: next.opp, entered: next.entered });
    if (!res.ok) { setAdminUnlocked(false); await refresh(userId); }
  };
  const setOff = (mid: string, key: string, v: number) => writeOfficial(mid, { [key]: v });
  const toggleEntered = (mid: string) => writeOfficial(mid, { entered: !official[mid].entered });

  const revealWinner = () => { if (!allResult) return; setWinnerShown(true); setConfetti(true); setTimeout(() => setConfetti(false), 3200); };

  return (
    <div className="wc-root">
      <div className="wc-bg" aria-hidden="true" />
      {confetti && <Confetti />}

      <div className="wc-shell">
        <header className="wc-header">
          <p className="wc-eyebrow">2026 FIFA WORLD CUP · 조별리그 A조</p>
          <h1 className="wc-title">대한민국<br /><span className="wc-title-accent">승부예측</span></h1>
          <p className="wc-sub">UX 팀 대항전 · 너의 스코어를 외쳐라 🇰🇷</p>
        </header>

        <nav className="wc-tabs">
          <button className={`wc-tab ${tab === "predict" ? "on" : ""}`} onClick={() => setTab("predict")}>예측하기</button>
          <button className={`wc-tab ${tab === "feed" ? "on" : ""}`} onClick={() => setTab("feed")}>모두의 예측 <span className="wc-tab-n">{preds.length}</span></button>
          <button className={`wc-tab ${tab === "rank" ? "on" : ""}`} onClick={() => setTab("rank")}>순위</button>
        </nav>

        {tab === "predict" && (
          <section className="wc-section">
            {mySubmitted ? (
              <div className="wc-locked">
                <span className="wc-locked-icon">✅</span>
                <p className="wc-locked-title">예측 제출 완료</p>
                <p className="wc-locked-sub">제출한 예측은 수정할 수 없어요.<br />오늘 경기 결과를 기대해주세요 🇰🇷</p>
                <div className="wc-locked-rows">
                  {MATCHES.map((m) => {
                    const s = scores[m.id] || { kr: 0, opp: 0 };
                    const lf = m.krHome ? KR.flag : m.flag, rf = m.krHome ? m.flag : KR.flag;
                    const lv = m.krHome ? s.kr : s.opp, rv = m.krHome ? s.opp : s.kr;
                    return (
                      <div key={m.id} className="wc-locked-row">
                        <span className="wc-locked-mno">M{m.no}</span>
                        <span className="wc-locked-score">{lf} {lv} : {rv} {rf}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="wc-locked-meta">{team} · {nickname}</div>
                <button className="wc-submit" onClick={() => setTab("feed")}>모두의 예측 보러가기</button>
              </div>
            ) : (
              <>
                {MATCHES.map((m) => <MatchBoard key={m.id} m={m} scores={scores} setScore={setScore} />)}

                <div className="wc-pick">
                  <span className="wc-label">소속 팀</span>
                  <div className="wc-teampick">
                    {TEAMS.map((t) => (
                      <button key={t} className={`wc-teambtn ${team === t ? "on" : ""}`} onClick={() => setTeam(t)}>{t}</button>
                    ))}
                  </div>
                </div>

                <label className="wc-field">
                  <span className="wc-label">이름</span>
                  <input className="wc-input" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임" />
                </label>

                <button className="wc-submit" disabled={!canSubmit} onClick={submit}>제출하기</button>
                <p className="wc-hint">⚠️ 제출 후에는 수정할 수 없어요. 스코어를 확인하고 제출하세요.</p>
              </>
            )}
          </section>
        )}

        {tab === "feed" && (
          <section className="wc-section">
            <div className="wc-feedbar">
              <span className="wc-feedcount">{preds.length}명 참여</span>
              <div className="wc-sort">
                <button className={sort === "recent" ? "on" : ""} onClick={() => setSort("recent")}>최신순</button>
                <button className={sort === "likes" ? "on" : ""} onClick={() => setSort("likes")}>좋아요순</button>
                <button onClick={() => refresh(userId)} title="새로고침">↻</button>
              </div>
            </div>
            {loading ? <p className="wc-empty">불러오는 중…</p>
              : sortedPreds.length === 0 ? (
                <div className="wc-empty"><span className="wc-empty-emoji">⚽</span>아직 예측이 없어요.<br />첫 번째 스코어를 외쳐보세요!</div>
              ) : (
                <div className="wc-feed">
                  {sortedPreds.map((p) => (
                    <PredictionCard key={p.userId} p={p} count={counts[p.userId] || 0}
                      liked={myLikes.has(p.userId)} mine={p.userId === userId}
                      onLike={() => toggleLike(p.userId)} official={official} anyResult={anyResult} />
                  ))}
                </div>
              )}
          </section>
        )}

        {tab === "rank" && (
          <section className="wc-section">
            <div className="wc-trophybox">
              <span className="wc-trophy-emoji">🏆</span>
              {winnerShown && winner ? (
                <>
                  <p className="wc-winner-label">UX 팀 대항전 우승</p>
                  <p className="wc-winner-team">{winner.team}</p>
                  <p className="wc-winner-sub">총 {winner.hits}적중 · 정확 {winner.perfects} · {winner.members}명</p>
                </>
              ) : (
                <>
                  <p className="wc-winner-label">최종 우승 팀</p>
                  <button className="wc-confirm" disabled={!allResult} onClick={revealWinner}>확인하기</button>
                  <p className="wc-winner-sub">{allResult ? "버튼을 눌러 우승 팀을 공개하세요!" : "3경기 공식 결과가 모두 입력되면 확인할 수 있어요"}</p>
                </>
              )}
            </div>

            <div className="wc-rankhead"><h2 className="wc-h2">경기별 우승 조직</h2></div>
            <div className="wc-matchwins">
              {matchTeamResults.map(({ m, entered, ranked, winners }: any) => {
                const o = official[m.id];
                const lf = m.krHome ? KR.flag : m.flag, rf = m.krHome ? m.flag : KR.flag;
                const lv = entered ? (m.krHome ? o.kr : o.opp) : null;
                const rv = entered ? (m.krHome ? o.opp : o.kr) : null;
                return (
                  <div key={m.id} className={`wc-mwcard ${entered ? "" : "wc-mwcard-pending"}`}>
                    <div className="wc-mwtop">
                      <span className="wc-mwno">{m.no}경기</span>
                      <span className="wc-mwteams">{lf}{m.krHome ? "KOR" : m.en} vs {m.krHome ? m.en : "KOR"}{rf}</span>
                      <span className="wc-mwscore">{entered ? `${lv} : ${rv}` : "—"}</span>
                    </div>
                    <div className="wc-mwwin">
                      {!entered ? <span className="wc-mw-pending">결과 입력 전</span>
                        : winners.length === 0 ? <span className="wc-mw-none">정답자 없음</span>
                          : winners.length === 1 ? <span className="wc-mw-team">🏆 {winners[0].team} <small>정답자 {winners[0].correct}명</small></span>
                            : <span className="wc-mw-team">🏆 공동 {winners.map((w: any) => w.team).join(", ")} <small>각 {winners[0].correct}명</small></span>}
                    </div>
                    {entered && (
                      <div className="wc-mwchips">
                        {ranked.map((r: any) => <span key={r.team} className="wc-mwchip">{r.team} <b>{r.correct}</b></span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="wc-rankhead"><h2 className="wc-h2">팀 종합 순위 <small className="wc-h2sub">3경기 합산</small></h2><span className="wc-live">{anyResult ? "● LIVE" : "결과 입력 전"}</span></div>
            <div className="wc-teamrank">
              {teamRank.map((t: any, i: number) => (
                <div key={t.team} className={`wc-trow ${i === 0 && t.hits > 0 ? "wc-trow-top" : ""}`}>
                  <span className="wc-medal">{["🥇", "🥈", "🥉"][i] || i + 1}</span>
                  <div className="wc-tinfo">
                    <div className="wc-tname-row"><span className="wc-tname">{t.team}</span><span className="wc-thits">{t.hits}<small>적중</small></span></div>
                    <div className="wc-tbar"><span style={{ width: `${(t.hits / maxTeamHits) * 100}%` }} /></div>
                    <span className="wc-tmeta">정확 {t.perfects} · {t.members}명 · 평균 {t.avg.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="wc-rankhead"><h2 className="wc-h2">개인 순위</h2></div>
            {anyResult && individualRank.length > 0 ? (
              <div className="wc-mvp">
                {individualRank.slice(0, 8).map((r: any, i: number) => (
                  <div key={r.p.userId} className={`wc-mvprow ${r.p.userId === userId ? "me" : ""}`}>
                    <span className="wc-mvp-rank">{["🥇", "🥈", "🥉"][i] || (i + 1)}</span>
                    <span className="wc-mvp-name">{r.p.nickname}{i === 0 && <span className="wc-mvp-crown">👑 MVP</span>}</span>
                    <span className="wc-mvp-team">{r.p.team || "미지정"}</span>
                    <span className="wc-mvp-hits">{r.hits}<small>적중</small></span>
                  </div>
                ))}
              </div>
            ) : <p className="wc-empty">공식 결과가 입력되면 순위가 표시돼요.</p>}

            <button className="wc-admin-toggle" onClick={() => setShowAdmin((v) => !v)}>
              🔒 공식 경기 결과 입력 (운영자) {showAdmin ? "▲" : "▼"}
            </button>
            {showAdmin && !adminUnlocked && (
              <div className="wc-pinbox">
                <p className="wc-pin-title">운영자 PIN을 입력하세요</p>
                <div className="wc-pin-row">
                  <input className={`wc-pin-input ${pinError ? "err" : ""}`} type="password" inputMode="numeric"
                    value={pinInput} maxLength={8} placeholder="• • • •"
                    onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "")); setPinError(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter") tryPin(); }} />
                  <button className="wc-pin-btn" onClick={tryPin}>잠금 해제</button>
                </div>
                {pinError && <p className="wc-pin-err">PIN이 올바르지 않아요. 다시 입력해 주세요.</p>}
              </div>
            )}
            {showAdmin && adminUnlocked && (
              <div className="wc-admin">
                <div className="wc-admin-unlocked">🔓 운영자 모드</div>
                {MATCHES.map((m) => {
                  const o = official[m.id];
                  const lf = m.krHome ? KR.flag : m.flag, rf = m.krHome ? m.flag : KR.flag;
                  const lk = m.krHome ? "kr" : "opp", rk = m.krHome ? "opp" : "kr";
                  const ln = m.krHome ? "KOR" : m.en, rn = m.krHome ? m.en : "KOR";
                  return (
                    <div key={m.id} className={`wc-admin-row ${o.entered ? "done" : ""}`}>
                      <div className="wc-admin-label">M{m.no} {lf}{ln} vs {rn}{rf}</div>
                      <div className="wc-admin-score">
                        <Stepper value={o[lk]} side={lk} compact onChange={(v: number) => setOff(m.id, lk, v)} />
                        <span className="wc-colon-sm">:</span>
                        <Stepper value={o[rk]} side={rk} compact onChange={(v: number) => setOff(m.id, rk, v)} />
                      </div>
                      <button className={`wc-fixbtn ${o.entered ? "on" : ""}`} onClick={() => toggleEntered(m.id)}>
                        {o.entered ? "✓ 확정" : "확정"}
                      </button>
                    </div>
                  );
                })}
                <p className="wc-admin-hint">결과를 확정하면 모든 참여자의 순위가 실시간으로 갱신돼요.</p>
              </div>
            )}
          </section>
        )}

        <footer className="wc-footer">대~한민국 🇰🇷 행운을 빌어요 🍀</footer>
      </div>

      {banner && (
        <div className="wc-banner" role="status">
          <span className="wc-banner-big">제출 완료!</span>
          <span className="wc-banner-sm">오늘 경기 결과를 기대해주세요 🇰🇷</span>
        </div>
      )}
    </div>
  );
}
