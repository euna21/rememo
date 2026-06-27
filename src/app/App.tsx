import { useState, useEffect } from "react";
import {
  Menu, ChevronLeft, ChevronRight, Camera, Search, Users,
  Play, Pause, SkipBack, SkipForward, X, Check, Plus,
  BookOpen, Mail, Lock, Eye, EyeOff, Wand2, SlidersHorizontal,
  Sparkles, Loader2, AtSign, User,
} from "lucide-react";

type Screen =
  | "login" | "signup"
  | "bookshelf" | "diary"
  | "capsule" | "add"
  | "ai" | "friends" | "newdiary";

// ─── Data ────────────────────────────────────────────────────────────────────

interface Book {
  id: number; title: string; subtitle: string;
  gradient: string; emoji: string; count: number;
  members: string[]; blank?: boolean;
}
const BOOKS: Book[] = [
  { id: 1, title: "봄의 기억", subtitle: "Spring 2024", gradient: "linear-gradient(155deg,#9B8B7A,#6B5D4D)", emoji: "🌸", count: 12, members: ["민지", "준서"] },
  { id: 2, title: "여름 바다", subtitle: "Summer 2024", gradient: "linear-gradient(155deg,#4A7A8A,#2C5368)", emoji: "🌊", count: 8, members: ["소연", "민지", "현우"] },
  { id: 3, title: "가을 산책", subtitle: "Autumn 2024", gradient: "linear-gradient(155deg,#A07850,#7B5830)", emoji: "🍂", count: 15, members: ["준서"] },
  { id: 4, title: "", subtitle: "", gradient: "", emoji: "", count: 0, members: [], blank: true },
];
interface PolaroidDef { x: number; y: number; w: number; h: number; rot: number; caption: string; bg: string; }
interface DiaryPageDef {
  polaroids: PolaroidDef[];
  text: { x: number; y: number; content: string };
  date: string;
  washi: { x: number; y: number; text: string; color: string; rot: number } | null;
  deco: { x: number; y: number; emoji: string } | null;
}
const DIARY_PAGES: DiaryPageDef[] = [
  {
    polaroids: [
      { x: 10, y: 8, w: 128, h: 114, rot: -3.5, caption: "카페에서의 오후", bg: "#D4C9B8" },
      { x: 182, y: 12, w: 122, h: 106, rot: 2.8, caption: "창밖 풍경", bg: "#C8D4C0" },
    ],
    text: { x: 14, y: 164, content: "오늘도 이 카페에 왔다.\n햇살이 유독 따뜻했던 날." },
    date: "2024.03.15",
    washi: { x: 128, y: 156, text: "Spring arrived early", color: "rgba(200,169,122,0.85)", rot: -1.5 },
    deco: { x: 302, y: 162, emoji: "🌸" },
  },
  {
    polaroids: [
      { x: 48, y: 10, w: 210, h: 162, rot: 1.2, caption: "여름 바다 산책", bg: "#A8C4D4" },
    ],
    text: { x: 14, y: 198, content: "파도 소리가 이어폰 없이도\n내 머릿속을 가득 채우던 날." },
    date: "2024.07.22", washi: null,
    deco: { x: 300, y: 204, emoji: "🌊" },
  },
  {
    polaroids: [
      { x: 8, y: 8, w: 112, h: 88, rot: -2, caption: "단풍길", bg: "#D4B89A" },
      { x: 200, y: 20, w: 102, h: 78, rot: 3, caption: "카페 라떼", bg: "#C4B090" },
    ],
    text: { x: 15, y: 148, content: "가을은 항상 이별 같아서\n좋아하면서도 슬프다." },
    date: "2024.10.08",
    washi: { x: 118, y: 88, text: "Golden hour ✦", color: "rgba(160,120,60,0.78)", rot: 0 },
    deco: { x: 295, y: 150, emoji: "🍂" },
  },
];
const PS_CONCEPTS = [
  { emoji: "🎬", name: "영화 포스터", desc: "시네마틱 필름 룩" },
  { emoji: "☕", name: "카페 감성", desc: "따뜻한 아날로그 톤" },
  { emoji: "📸", name: "잡지 화보", desc: "하이패션 매거진 스타일" },
  { emoji: "🌸", name: "봄 빈티지", desc: "소프트 파스텔 필름" },
  { emoji: "⚾", name: "야구장 직캠", desc: "KBO 응원 현장감" },
  { emoji: "🌙", name: "겨울 감성", desc: "쿨톤 시네마스코프" },
];
const TRACKS = [
  { title: "Breezeblocks", artist: "alt-J", dur: "3:50" },
  { title: "Bloom", artist: "The Paper Kites", dur: "4:12" },
  { title: "무릎", artist: "IU", dur: "3:59" },
  { title: "Photograph", artist: "Ed Sheeran", dur: "4:17" },
];
const FRIENDS = [
  { name: "박민지", id: "@minji_p", initial: "민", color: "#C8A97A" },
  { name: "김준서", id: "@junser.k", initial: "준", color: "#6B8BA4" },
  { name: "이소연", id: "@soyeon.i", initial: "소", color: "#9B8B7A" },
];
const PENDING = [{ name: "최현우", id: "@hwwoo.c", initial: "현", color: "#7B8A6B" }];
const AI_STEPS = [
  "✦ 기록들을 분석하는 중...",
  "✦ 레이아웃을 설계하는 중...",
  "✦ 사진 배치를 최적화하는 중...",
  "✦ 감성 요소를 추가하는 중...",
  "✦ 다이어리를 완성하는 중...",
];

// ─── StatusBar ───────────────────────────────────────────────────────────────
function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? "#F4F1EB" : "#2A2318";
  const bg = dark ? "rgba(30,27,22,0.95)" : "rgba(234,230,223,0.95)";
  return (
    <div className="absolute top-0 left-0 right-0 h-[52px] flex items-end justify-between px-8 pb-2 z-40"
      style={{ background: bg, backdropFilter: "blur(10px)" }}>
      <span className="text-xs font-bold" style={{ color }}>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-[2px]">
          {[3, 5, 7, 9].map((h, i) => (
            <div key={i} style={{ width: 3, height: h, background: color, opacity: i < 3 ? 1 : 0.28, borderRadius: 1 }} />
          ))}
        </div>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path d="M7.5 9a1 1 0 100 2 1 1 0 000-2z" fill={color} />
          <path d="M4.8 6.8C5.8 5.8 6.6 5.5 7.5 5.5s1.7.3 2.7 1.3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M2.5 4.5C4 3 5.6 2.3 7.5 2.3S11 3 12.5 4.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
        </svg>
        <div className="flex items-center">
          <div className="flex items-center px-[2px]" style={{ width: 23, height: 12, border: `1.5px solid ${color}`, borderRadius: 3 }}>
            <div style={{ width: 14, height: 8, background: color, borderRadius: 1.5 }} />
          </div>
          <div style={{ width: 2, height: 5, background: color, opacity: 0.5, borderRadius: "0 1px 1px 0", marginLeft: -1 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ activeScreen, onClose, onNavigate }: {
  activeScreen: Screen; onClose: () => void; onNavigate: (s: Screen) => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(5px)" }} />
      <div className="relative flex flex-col z-10" style={{ width: 280, height: "100%", background: "#1E1B16" }}
        onClick={e => e.stopPropagation()}>
        <div className="pt-16 px-5 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-center mb-5 tracking-[5px]"
            style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", color: "#C8A97A" }}>
            MEMORY ARCHIVE
          </div>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(0,0,0,0.3)" }}>
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#C8A97A,#A88550)", color: "#1E1B16", fontSize: 15 }}>이</div>
            <div>
              <div className="font-semibold text-sm" style={{ color: "#F4F1EB" }}>이지수</div>
              <div className="text-xs mt-0.5" style={{ color: "#7A7064" }}>@jisoo_l</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 pt-2">
          {[
            { icon: "📚", label: "나의 책장", screen: "bookshelf" as Screen },
            { icon: "👥", label: "친구 관리", screen: "friends" as Screen, badge: 2 },
            { icon: "🔗", label: "초대 코드로 참여", screen: null as Screen | null },
          ].map(item => {
            const active = item.screen === activeScreen;
            return (
              <button key={item.label}
                onClick={() => { if (item.screen) { onNavigate(item.screen); } else { onClose(); } }}
                className="w-full flex items-center justify-between py-[17px] px-[26px] text-sm transition-all"
                style={{
                  color: active ? "#fff" : "#8A8278",
                  background: active ? "#332C22" : "transparent",
                  borderLeft: active ? "3px solid #C8A97A" : "3px solid transparent",
                  fontWeight: active ? 700 : 500,
                }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>{item.icon} {item.label}</span>
                {"badge" in item && item.badge ? (
                  <span className="text-white text-[10px] rounded-full px-2 py-0.5" style={{ background: "#e74c3c" }}>{item.badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <button className="flex items-center gap-3 px-[26px] py-4 text-sm w-full" onClick={onClose}
          style={{ color: "#8A8278", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          🚪 로그아웃
        </button>
      </div>
    </div>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(160deg,#1E1B16 0%,#2A2318 55%,#332C20 100%)" }}>
      {/* Hero area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="mb-4" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 11, letterSpacing: 8, color: "rgba(200,169,122,0.5)", textTransform: "uppercase" }}>
          BETA · v2.0
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, letterSpacing: 6, color: "#C8A97A", lineHeight: 1.15, textAlign: "center" }}>
          MEMORY<br />ARCHIVE
        </div>
        <div className="mt-3" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 12, color: "rgba(200,169,122,0.55)", letterSpacing: 2, textAlign: "center" }}>
          합동형 기억 아카이브
        </div>
        {/* Decorative capsule hint */}
        <div className="mt-10 flex flex-col items-center gap-2 opacity-60">
          <div style={{ width: 44, height: 64, background: "linear-gradient(155deg,#CEBBA0,#A08865)", borderRadius: "50% 50% 40% 40% / 30% 30% 20% 20%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🕰️</div>
          <div style={{ width: "62%", height: 8, background: "linear-gradient(90deg,#7B5C10,#D4A843,#7B5C10)", borderRadius: 4 }} />
        </div>
      </div>
      {/* Form card */}
      <div style={{ background: "#F4F1EB", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", boxShadow: "0 -20px 60px rgba(0,0,0,0.3)" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#2A2318", marginBottom: 4 }}>시작하기</h2>
        <p className="text-xs mb-5" style={{ color: "#7A7064" }}>함께한 기억을 보관하기 위해 로그인해주세요.</p>
        {[
          { label: "이메일", placeholder: "example@email.com", icon: <Mail size={14} color="#B0A898" />, type: "email" },
        ].map(f => (
          <div key={f.label} className="mb-3.5">
            <label className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A7064" }}>{f.label}</label>
            <div className="relative">
              <div className="absolute flex items-center" style={{ left: 13, top: "50%", transform: "translateY(-50%)" }}>{f.icon}</div>
              <input type={f.type} placeholder={f.placeholder} className="w-full rounded-xl outline-none"
                style={{ padding: "13px 14px 13px 36px", border: "1.5px solid #D5D0C5", background: "#fff", fontSize: 14, color: "#2A2318" }} />
            </div>
          </div>
        ))}
        <div className="mb-5">
          <label className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A7064" }}>비밀번호</label>
          <div className="relative">
            <div className="absolute flex items-center" style={{ left: 13, top: "50%", transform: "translateY(-50%)" }}><Lock size={14} color="#B0A898" /></div>
            <input type={showPw ? "text" : "password"} placeholder="비밀번호 입력" className="w-full rounded-xl outline-none"
              style={{ padding: "13px 42px 13px 36px", border: "1.5px solid #D5D0C5", background: "#fff", fontSize: 14, color: "#2A2318" }} />
            <button onClick={() => setShowPw(p => !p)} className="absolute flex items-center" style={{ right: 13, top: "50%", transform: "translateY(-50%)" }}>
              {showPw ? <EyeOff size={15} color="#B0A898" /> : <Eye size={15} color="#B0A898" />}
            </button>
          </div>
        </div>
        <button onClick={onLogin} className="w-full py-3.5 rounded-[14px] font-bold text-sm mb-4 transition-transform active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB", boxShadow: "0 6px 20px rgba(0,0,0,0.16)", fontFamily: "'Noto Sans KR', sans-serif" }}>
          시작하기
        </button>
        <p onClick={onSignup} className="text-center text-xs cursor-pointer underline underline-offset-2" style={{ color: "#7A7064" }}>
          계정이 없으신가요? 회원가입하기
        </p>
      </div>
    </div>
  );
}

// ─── SignupScreen ─────────────────────────────────────────────────────────────
function SignupScreen({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  const fields = [
    { label: "아이디 (검색용)", placeholder: "예: user123", icon: <AtSign size={14} color="#B0A898" />, type: "text" },
    { label: "이름 / 닉네임", placeholder: "실명 또는 닉네임", icon: <User size={14} color="#B0A898" />, type: "text" },
    { label: "이메일", placeholder: "example@email.com", icon: <Mail size={14} color="#B0A898" />, type: "email" },
    { label: "비밀번호 (6자 이상)", placeholder: "비밀번호 입력", icon: <Lock size={14} color="#B0A898" />, type: "password" },
  ];
  return (
    <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(160deg,#1E1B16 0%,#2A2318 45%,#332C20 100%)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, letterSpacing: 6, color: "#C8A97A", textAlign: "center", marginBottom: 6 }}>
          JOIN US
        </div>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 12, color: "rgba(200,169,122,0.55)", letterSpacing: 2, textAlign: "center" }}>
          새로운 아카이브를 만듭니다.
        </div>
      </div>
      <div style={{ background: "#F4F1EB", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", boxShadow: "0 -20px 60px rgba(0,0,0,0.3)" }}>
        <div className="overflow-y-auto" style={{ maxHeight: 380, scrollbarWidth: "none" }}>
          {fields.map(f => (
            <div key={f.label} className="mb-3">
              <label className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A7064" }}>{f.label}</label>
              <div className="relative">
                <div className="absolute flex items-center" style={{ left: 13, top: "50%", transform: "translateY(-50%)" }}>{f.icon}</div>
                <input type={f.type} placeholder={f.placeholder} className="w-full rounded-xl outline-none"
                  style={{ padding: "12px 14px 12px 36px", border: "1.5px solid #D5D0C5", background: "#fff", fontSize: 13, color: "#2A2318" }} />
              </div>
            </div>
          ))}
          <button onClick={onSignup} className="w-full py-3.5 rounded-[14px] font-bold text-sm mt-2 mb-4"
            style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB", boxShadow: "0 6px 20px rgba(0,0,0,0.16)" }}>
            가입 완료
          </button>
          <p onClick={onLogin} className="text-center text-xs cursor-pointer underline underline-offset-2" style={{ color: "#7A7064" }}>
            이미 계정이 있으신가요? 로그인하기
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── BookshelfScreen ──────────────────────────────────────────────────────────
function BookshelfScreen({ bookIdx, onPrev, onNext, onOpenDiary, onMenuOpen, onFriends, onNewDiary }: {
  bookIdx: number; onPrev: () => void; onNext: () => void;
  onOpenDiary: () => void; onMenuOpen: () => void; onFriends: () => void; onNewDiary: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-6 pt-3 pb-1">
        <button onClick={onMenuOpen} className="w-[46px] h-[46px] rounded-full flex items-center justify-center"
          style={{ background: "rgba(30,27,22,0.08)", border: "1px solid rgba(200,169,122,0.2)" }}>
          <Menu size={20} color="#2A2318" />
        </button>
        <span className="text-[11px] tracking-[5px]" style={{ fontFamily: "'DM Serif Display', serif", color: "#7A7064" }}>
          MEMORY ARCHIVE
        </span>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#C8A97A,#A88550)", color: "#1E1B16" }}>이</div>
      </div>
      <div className="text-center mt-4 mb-3">
        <h1 className="tracking-[7px]" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#2A2318", fontWeight: 400 }}>
          MY ARCHIVE
        </h1>
        <p className="text-xs tracking-[3px] mt-1" style={{ fontFamily: "'Noto Serif KR', serif", color: "#7A7064" }}>기억이 머무는 곳</p>
      </div>
      {/* Carousel */}
      <div className="flex-1 relative flex items-center justify-center" style={{ perspective: "1400px" }}>
        <button onClick={onPrev} disabled={bookIdx === 0}
          className="absolute z-20 w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-0 transition-opacity"
          style={{ left: 14, background: "rgba(255,255,255,0.82)", border: "2px solid #C8A97A", color: "#C8A97A" }}>
          <ChevronLeft size={18} />
        </button>
        <div className="relative flex items-center justify-center" style={{ width: 310, height: 315, transformStyle: "preserve-3d" }}>
          {BOOKS.map((book, i) => {
            const off = i - bookIdx;
            if (Math.abs(off) > 1) return null;
            const active = off === 0;
            return (
              <div key={book.id} onClick={active ? onOpenDiary : undefined}
                style={{
                  position: "absolute", width: 200, height: 274,
                  borderRadius: active ? "5px 14px 14px 5px" : "4px 12px 12px 4px",
                  background: book.blank ? "#FDFCFA" : book.gradient,
                  border: book.blank ? "1.5px dashed #C5BFB5" : "none",
                  transform: `translateX(${active ? 0 : off < 0 ? -178 : 178}px) translateZ(${active ? 85 : -80}px) rotateY(${active ? 0 : off < 0 ? 22 : -22}deg) scale(${active ? 1 : 0.72})`,
                  opacity: active ? 1 : 0.45,
                  transition: "all 1.1s cubic-bezier(0.16,1,0.3,1)",
                  cursor: active ? "pointer" : "default",
                  zIndex: active ? 20 : 8,
                  boxShadow: active ? "inset 4px 0 14px rgba(0,0,0,0.32),18px 28px 55px rgba(0,0,0,0.32)" : "none",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 24, textAlign: "center",
                  transformStyle: "preserve-3d", backfaceVisibility: "hidden",
                }}>
                {book.blank ? (
                  <>
                    <span style={{ fontSize: 36, color: "#C8A97A", marginBottom: 12, display: "block" }}>＋</span>
                    <span onClick={onNewDiary} style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 13, color: "#A8A095" }}>새 앨범 만들기</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 28, marginBottom: 10, display: "block" }}>{book.emoji}</span>
                    <span style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 17, fontWeight: 700, color: "#F4F1EB", textShadow: "1px 2px 6px rgba(0,0,0,0.4)", lineHeight: 1.4, marginBottom: 5, display: "block" }}>{book.title}</span>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: 3, display: "block" }}>{book.subtitle}</span>
                    <span style={{ marginTop: 16, padding: "6px 14px", borderRadius: 20, fontSize: 11, color: "#EAE6DF", background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.16)", backdropFilter: "blur(6px)", display: "inline-block" }}>기록 {book.count}개</span>
                    <div style={{ display: "flex", marginTop: 12 }}>
                      {book.members.slice(0, 3).map((m, mi) => (
                        <div key={mi} style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.28)", background: "linear-gradient(135deg,#C8A97A,#A88550)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#1E1B16", marginLeft: mi > 0 ? -7 : 0 }}>
                          {m[0]}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onNext} disabled={bookIdx === BOOKS.length - 1}
          className="absolute z-20 w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-0 transition-opacity"
          style={{ right: 14, background: "rgba(255,255,255,0.82)", border: "2px solid #C8A97A", color: "#C8A97A" }}>
          <ChevronRight size={18} />
        </button>
        <div className="absolute bottom-0 flex items-center gap-2">
          {BOOKS.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{ height: 6, width: i === bookIdx ? 22 : 6, background: i === bookIdx ? "#C8A97A" : "rgba(200,169,122,0.3)" }} />
          ))}
        </div>
      </div>
      <div className="px-6 pb-7 pt-3 flex gap-3">
        <button onClick={onOpenDiary} className="flex-1 py-3.5 rounded-[14px] font-semibold text-sm text-[#F4F1EB]"
          style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", boxShadow: "0 6px 20px rgba(0,0,0,0.16)" }}>
          다이어리 열기
        </button>
        <button onClick={onFriends} className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(200,169,122,0.12)", border: "1.5px solid rgba(200,169,122,0.4)" }}>
          <Users size={18} color="#C8A97A" />
        </button>
      </div>
    </div>
  );
}

// ─── DiaryScreen ──────────────────────────────────────────────────────────────
function DiaryScreen({ book, page, onPageChange, onBack, onAddRecord, bgmPlaying, trackIdx, onBgmToggle, onPrevTrack, onNextTrack }: {
  book: Book; page: number; onPageChange: (p: number) => void;
  onBack: () => void; onAddRecord: () => void;
  bgmPlaying: boolean; trackIdx: number;
  onBgmToggle: () => void; onPrevTrack: () => void; onNextTrack: () => void;
}) {
  const pg = DIARY_PAGES[page % DIARY_PAGES.length];
  const track = TRACKS[trackIdx];
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Action bar */}
      <div className="flex items-center mx-4 mt-3 rounded-[22px] overflow-hidden"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", border: "1px solid rgba(200,169,122,0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.09)", padding: "3px 4px" }}>
        {([
          { label: "◀ 책장", fn: onBack }, null,
          { label: "기록 편집", fn: () => {} }, null,
          { label: "+ 추가", fn: onAddRecord }, null,
          { label: "꾸미기", fn: () => {} }, null,
          { label: "페이지", fn: () => {} },
        ] as ({ label: string; fn: () => void } | null)[]).map((item, i) => {
          if (item === null) return <div key={i} style={{ width: 1, height: 15, background: "rgba(200,169,122,0.3)", flexShrink: 0 }} />;
          return (
            <button key={i} onClick={item.fn}
              className="px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap flex-shrink-0 text-[11px] font-medium"
              style={{ color: i === 0 ? "#7A7064" : "#5A5040" }}>
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="text-center mt-2.5 mb-2">
        <span className="text-xs tracking-widest" style={{ fontFamily: "'DM Serif Display', serif", color: "#7A7064" }}>
          {book.emoji} {book.title}
        </span>
      </div>
      {/* Page */}
      <div className="mx-4 flex-1 min-h-0 relative overflow-hidden" style={{ maxHeight: 430 }}>
        <div className="w-full h-full rounded-lg overflow-hidden relative"
          style={{ background: "#F9F7F2", boxShadow: "-8px 0 28px rgba(0,0,0,0.07),8px 0 28px rgba(0,0,0,0.05),0 20px 40px rgba(0,0,0,0.1)", border: "1px solid rgba(229,219,197,0.8)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "repeating-linear-gradient(transparent,transparent 27px,rgba(200,169,122,0.1) 28px)" }} />
          <div className="absolute top-0 bottom-0" style={{ left: 26, width: 1, background: "rgba(200,169,122,0.22)" }} />
          <div className="relative w-full h-full" style={{ padding: "14px 14px 14px 32px" }}>
            {pg.polaroids.map((p, i) => (
              <div key={i} className="absolute" style={{ left: p.x, top: p.y, width: p.w, padding: "6px 6px 22px", background: "#fff", transform: `rotate(${p.rot}deg)`, boxShadow: "0 6px 22px rgba(0,0,0,0.16),0 1px 4px rgba(0,0,0,0.08)", zIndex: i + 1 }}>
                <div style={{ height: Math.round(p.h * 0.78), background: p.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Camera size={16} color="rgba(255,255,255,0.5)" />
                </div>
                <div style={{ fontFamily: "'Gowun Batang', serif", fontSize: 8, color: "#4A4236", textAlign: "center", paddingTop: 5 }}>{p.caption}</div>
              </div>
            ))}
            <div className="absolute rounded-xl" style={{ left: pg.text.x, top: pg.text.y, maxWidth: 175, padding: "10px 12px", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)", boxShadow: "0 3px 12px rgba(0,0,0,0.09)", fontFamily: "'Gowun Batang', serif", fontSize: 12, color: "#2A2318", lineHeight: 1.65, whiteSpace: "pre-line", zIndex: 10 }}>
              {pg.text.content}
            </div>
            {pg.washi && (
              <div className="absolute flex items-center justify-center" style={{ left: pg.washi.x, top: pg.washi.y, padding: "0 10px", height: 17, background: pg.washi.color, borderRadius: 2, transform: `rotate(${pg.washi.rot}deg)`, fontFamily: "'DM Serif Display', serif", fontSize: 8, color: "#fff", letterSpacing: 1.5, whiteSpace: "nowrap", zIndex: 5 }}>
                {pg.washi.text}
              </div>
            )}
            {pg.deco && (
              <div className="absolute pointer-events-none select-none" style={{ left: pg.deco.x, top: pg.deco.y, fontSize: 20, opacity: 0.75, zIndex: 6 }}>
                {pg.deco.emoji}
              </div>
            )}
            <div className="absolute bottom-3 right-4" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 10, color: "rgba(120,100,80,0.48)", letterSpacing: 2 }}>
              {pg.date}
            </div>
          </div>
        </div>
      </div>
      {/* Page nav */}
      <div className="flex items-center justify-between px-6 py-2">
        <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-25"
          style={{ border: "1.5px solid rgba(200,169,122,0.5)", color: "#C8A97A" }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 11, letterSpacing: 2, color: "#7A7064" }}>
          {page + 1} / {DIARY_PAGES.length}
        </span>
        <button onClick={() => onPageChange(Math.min(DIARY_PAGES.length - 1, page + 1))} disabled={page === DIARY_PAGES.length - 1}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-25"
          style={{ border: "1.5px solid rgba(200,169,122,0.5)", color: "#C8A97A" }}>
          <ChevronRight size={16} />
        </button>
      </div>
      {/* BGM */}
      <div className="mx-4 mb-3 flex items-center gap-3 px-4 py-2.5 rounded-[28px]"
        style={{ background: "rgba(30,27,22,0.93)", border: "1px solid rgba(200,169,122,0.4)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.38)" }}>
        <div className="rounded-md flex-shrink-0" style={{ width: 32, height: 32, background: "rgba(200,169,122,0.18)", border: "1px solid rgba(200,169,122,0.3)" }} />
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 12, color: "rgba(200,169,122,0.92)", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
          <div style={{ fontSize: 10, color: "rgba(200,169,122,0.5)", marginTop: 2 }}>{track.artist}</div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {[
            { icon: <SkipBack size={10} />, onClick: onPrevTrack, primary: false },
            { icon: bgmPlaying ? <Pause size={12} /> : <Play size={12} />, onClick: onBgmToggle, primary: true },
            { icon: <SkipForward size={10} />, onClick: onNextTrack, primary: false },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick} className="rounded-full flex items-center justify-center"
              style={{ width: btn.primary ? 28 : 24, height: btn.primary ? 28 : 24, color: "#C8A97A", background: btn.primary ? "rgba(200,169,122,0.16)" : "transparent", border: `1px solid rgba(200,169,122,${btn.primary ? 0.55 : 0.32})` }}>
              {btn.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CapsuleScreen ────────────────────────────────────────────────────────────
function CapsuleScreen({ onClose, onReveal }: { onClose: () => void; onReveal: () => void }) {
  const [phase, setPhase] = useState<"idle" | "shaking" | "revealed">("idle");
  const [role] = useState({ name: "관찰자", icon: "🔭", desc: "여행의 시선으로 순간을 포착하는 역할" });

  const handleCapsuleClick = () => {
    if (phase !== "idle") return;
    setPhase("shaking");
    setTimeout(() => setPhase("revealed"), 700);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#EAE6DF" }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 11, letterSpacing: 4, color: "#7A7064" }}>
          기록 추가
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(42,35,24,0.08)" }}>
          <X size={16} color="#2A2318" />
        </button>
      </div>

      {phase !== "revealed" ? (
        /* Phase 1: Capsule */
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <h2 className="text-center mb-2" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: "#C8A97A" }}>
            나의 역할 확인하기
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: "#7A7064", lineHeight: 1.6 }}>
            캡슐을 클릭해 역할을 확인하고<br />기록을 추가하세요!
          </p>
          {/* Capsule */}
          <div onClick={handleCapsuleClick} className="flex flex-col items-center gap-3 cursor-pointer"
            style={{
              filter: "drop-shadow(0 15px 35px rgba(200,169,122,0.35))",
              animation: phase === "shaking" ? "capsuleShake 0.6s ease" : undefined,
              transform: phase === "idle" ? "translateY(0)" : undefined,
              transition: "transform 0.3s ease",
            }}>
            <div style={{ position: "relative", width: 130, height: 190 }}>
              {/* Body */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg,#CEBBA0 0%,#A08865 55%,#B89878 100%)", borderRadius: "50% 50% 40% 40% / 30% 30% 20% 20%", border: "1.5px solid rgba(200,169,122,0.5)", overflow: "hidden" }}>
                {/* Shine */}
                <div style={{ position: "absolute", top: "10%", left: "12%", width: "28%", height: "55%", background: "linear-gradient(135deg,rgba(255,255,255,0.2),transparent)", borderRadius: "50%" }} />
                {/* Emblem */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", width: 58, height: 58, border: "1.5px solid rgba(200,169,122,0.55)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: "rgba(200,169,122,0.1)" }}>🕰️</div>
                {/* Label */}
                <div style={{ position: "absolute", bottom: "23%", left: "50%", transform: "translateX(-50%)", fontFamily: "'DM Serif Display', serif", fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", whiteSpace: "nowrap" }}>MEMORY</div>
              </div>
              {/* Ring */}
              <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: "78%", height: 16, background: "linear-gradient(90deg,#7B5C10,#D4A843,#7B5C10)", borderRadius: 8, boxShadow: "0 5px 12px rgba(0,0,0,0.45)" }} />
            </div>
          </div>
          <div className="mt-8 text-sm font-semibold" style={{ color: "#C8A97A", animation: "pulseFade 2.4s ease-in-out infinite" }}>
            캡슐을 터치하세요
          </div>
        </div>
      ) : (
        /* Phase 2: Role revealed */
        <div className="flex-1 flex flex-col px-5 pt-2 pb-5">
          <div className="rounded-xl p-4 mb-4 text-center" style={{ border: "1.5px solid rgba(200,169,122,0.35)", background: "rgba(200,169,122,0.05)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#7A7064" }}>당신의 역할은</div>
            <div className="text-2xl mb-1" style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, color: "#A88550" }}>
              {role.icon} {role.name}
            </div>
            <div className="text-xs" style={{ color: "#7A7064" }}>{role.desc}</div>
          </div>
          <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: "#F4F1EB", border: "1px solid rgba(200,169,122,0.2)" }}>
            <div className="font-semibold mb-1" style={{ color: "#2A2318" }}>이 역할에서 작성할 내용</div>
            <ul className="text-xs space-y-1" style={{ color: "#7A7064" }}>
              <li>• 여행/모임 현장의 사진 업로드</li>
              <li>• AI 컨셉 보정 (Pixel Studio)</li>
              <li>• 배경음악 등록 (최대 3곡)</li>
              <li>• 비밀 코멘트 작성</li>
            </ul>
          </div>
          <button onClick={onReveal} className="w-full py-3.5 rounded-[14px] font-bold text-sm"
            style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB", boxShadow: "0 6px 20px rgba(0,0,0,0.16)" }}>
            기록 작성 시작하기 ✦
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AddScreen ────────────────────────────────────────────────────────────────
function AddScreen({ text, onText, photoAdded, onPhoto, concept, onConcept, musicQ, onMusicQ, selTracks, onTrackToggle, onBack, onSave, psEnabled, onPsToggle }: {
  text: string; onText: (v: string) => void;
  photoAdded: boolean; onPhoto: () => void;
  concept: string; onConcept: (v: string) => void;
  musicQ: string; onMusicQ: (v: string) => void;
  selTracks: number[]; onTrackToggle: (i: number) => void;
  onBack: () => void; onSave: () => void;
  psEnabled: boolean; onPsToggle: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-3 pb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(42,35,24,0.06)" }}>
          <ChevronLeft size={18} color="#2A2318" />
        </button>
        <h2 className="flex-1 font-semibold" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, color: "#2A2318" }}>새 기록 추가</h2>
        <button onClick={onSave} className="px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB" }}>저장</button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: "none" }}>
        {/* Role */}
        <div className="rounded-xl p-3.5 mb-4 text-center" style={{ border: "1.5px solid rgba(200,169,122,0.35)", background: "rgba(200,169,122,0.05)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#7A7064", fontWeight: 600 }}>작성 역할</div>
          <div className="text-lg font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: "#A88550" }}>🔭 관찰자</div>
          <div className="text-xs mt-1" style={{ color: "#7A7064" }}>이지수 · @jisoo_l</div>
        </div>
        {/* Photo upload */}
        <SectionLabel>사진 업로드 + AI 보정</SectionLabel>
        {!photoAdded ? (
          <div onClick={onPhoto} className="rounded-[14px] py-6 flex flex-col items-center gap-2 cursor-pointer mb-4"
            style={{ border: "2px dashed rgba(200,169,122,0.6)", background: "rgba(200,169,122,0.04)" }}>
            <Camera size={26} color="#C8A97A" />
            <span className="text-sm font-medium" style={{ color: "#C8A97A" }}>사진을 선택하세요</span>
            <span className="text-xs" style={{ color: "#7A7064" }}>JPG · PNG · HEIC · 최대 5MB</span>
          </div>
        ) : (
          <div className="mb-4">
            <div className="relative rounded-[14px] overflow-hidden mb-3" style={{ height: 115 }}>
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#C4B8A8,#B4A898)" }}>
                <Camera size={28} color="rgba(255,255,255,0.5)" />
              </div>
              <button onClick={onPhoto} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#e74c3c" }}>
                <X size={13} color="#fff" />
              </button>
            </div>
            {/* PIXEL STUDIO panel */}
            <div className="rounded-[14px] overflow-hidden mb-3" style={{ border: "1.5px solid rgba(200,169,122,0.3)", background: "#faf9f6" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ background: "linear-gradient(135deg,#1E1B16,#2A2520)" }}>
                <div>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 10, letterSpacing: 3, color: "#C8A97A" }}>✦ PIXEL STUDIO</span>
                  <span className="ml-2" style={{ fontSize: 10, color: "rgba(200,169,122,0.5)" }}>AI 컨셉 보정</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 10, color: "rgba(200,169,122,0.6)" }}>보정 사용</span>
                  <div onClick={onPsToggle} className="rounded-full relative cursor-pointer" style={{ width: 34, height: 18, background: psEnabled ? "#C8A97A" : "#5A5550", transition: "background 0.25s" }}>
                    <div style={{ position: "absolute", top: 2, left: psEnabled ? 17 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.25s" }} />
                  </div>
                </div>
              </div>
              {psEnabled && (
                <div className="px-4 py-3">
                  {/* Category tabs */}
                  <div className="flex gap-2 mb-3">
                    {["🧑 인물", "🍽️ 음식"].map((cat, ci) => (
                      <button key={ci} className="flex-1 py-2 rounded-[10px] text-xs font-semibold transition-all"
                        style={{ background: ci === 0 ? "rgba(200,169,122,0.08)" : "#fff", border: `1.5px solid ${ci === 0 ? "#A88550" : "#D5D0C5"}`, color: ci === 0 ? "#A88550" : "#7A7064" }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  {/* Concept grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {PS_CONCEPTS.slice(0, 4).map(c => (
                      <button key={c.name} onClick={() => onConcept(c.name)}
                        className="relative text-left p-2.5 rounded-[10px] transition-all"
                        style={{ background: concept === c.name ? "rgba(200,169,122,0.1)" : "#fff", border: `1.5px solid ${concept === c.name ? "#A88550" : "#E5E0D8"}` }}>
                        {concept === c.name && <span className="absolute top-1.5 right-2" style={{ fontSize: 9, color: "#A88550", fontWeight: 700 }}>✓</span>}
                        <span style={{ display: "block", fontSize: 16, marginBottom: 2 }}>{c.emoji}</span>
                        <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#2A2318" }}>{c.name}</span>
                        <span style={{ display: "block", fontSize: 9, color: "#7A7064", marginTop: 1 }}>{c.desc}</span>
                      </button>
                    ))}
                  </div>
                  <button className="w-full py-2.5 rounded-[10px] text-xs font-bold tracking-wider"
                    style={{ background: "linear-gradient(135deg,#1E1B16,#3A3028)", color: "#C8A97A", border: "1px solid rgba(200,169,122,0.35)", opacity: concept ? 1 : 0.4 }}>
                    ✦ AI 보정 시작
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Text */}
        <SectionLabel>비밀 코멘트</SectionLabel>
        <textarea value={text} onChange={e => onText(e.target.value)}
          placeholder="역할에 맞는 에피소드나 감상을 자유롭게 적어주세요."
          rows={3} className="w-full rounded-xl px-4 py-3 resize-none outline-none mb-4"
          style={{ background: "#fff", border: "1.5px solid #D5D0C5", fontFamily: "'Gowun Batang', serif", fontSize: "0.95rem", color: "#2A2318", lineHeight: 1.7 }}
          onFocus={e => { e.currentTarget.style.borderColor = "#C8A97A"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,169,122,0.15)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "#D5D0C5"; e.currentTarget.style.boxShadow = "none"; }}
        />
        {/* Music */}
        <SectionLabel>♪ 배경음악 등록 (최대 3곡)</SectionLabel>
        <div className="rounded-[14px] p-3 flex flex-col gap-3"
          style={{ border: "1.5px solid rgba(107,139,164,0.38)", background: "rgba(107,139,164,0.06)" }}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input value={musicQ} onChange={e => onMusicQ(e.target.value)} placeholder="곡 제목 또는 아티스트 검색"
                className="w-full pl-3 pr-3 py-2.5 rounded-[10px] text-sm outline-none"
                style={{ border: "1.5px solid #D5D0C5", background: "#fff", color: "#2A2318" }} />
            </div>
            <button className="px-3 py-2 rounded-[10px] flex items-center justify-center" style={{ background: "#6B8BA4" }}>
              <Search size={15} color="#fff" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {TRACKS.map((track, i) => {
              const sel = selTracks.includes(i);
              return (
                <div key={i} onClick={() => onTrackToggle(i)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer"
                  style={{ background: sel ? "rgba(107,139,164,0.14)" : "#fff", border: `1.5px solid ${sel ? "rgba(107,139,164,0.48)" : "transparent"}` }}>
                  <div className="rounded-md flex-shrink-0" style={{ width: 34, height: 34, background: "rgba(107,139,164,0.22)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: "#2A2318" }}>{track.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#7A7064" }}>{track.artist} · {track.dur}</div>
                  </div>
                  <div className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ width: 20, height: 20, background: sel ? "#6B8BA4" : "transparent", border: `1.5px solid ${sel ? "#6B8BA4" : "#D5D0C5"}` }}>
                    {sel && <Check size={10} color="#fff" />}
                  </div>
                </div>
              );
            })}
            <div className="text-right text-[10px] italic" style={{ color: "#7A7064", fontFamily: "'DM Serif Display', serif" }}>
              {selTracks.length} / 3 곡 선택됨
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AiScreen ────────────────────────────────────────────────────────────────
function AiScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setTimeout(onFinish, 600); return 100; }
        const next = p + 2;
        setActiveStep(Math.floor((next / 100) * AI_STEPS.length));
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onFinish]);
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8"
      style={{ background: "rgba(30,27,22,0.95)", backdropFilter: "blur(10px)" }}>
      <div className="text-4xl mb-6" style={{ animation: "floatUp 2.5s ease-in-out infinite", color: "#C8A97A" }}>✦</div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#C8A97A", letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>
        MEMORY ARCHIVE
      </div>
      <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 12, color: "rgba(200,169,122,0.6)", letterSpacing: 1, marginBottom: 32, textAlign: "center" }}>
        AI가 여러분의 기억을 콜라주하고 있습니다
      </div>
      <div className="w-full rounded-full overflow-hidden mb-6" style={{ height: 3, background: "rgba(200,169,122,0.2)", maxWidth: 280 }}>
        <div style={{ height: "100%", background: "#C8A97A", width: `${progress}%`, borderRadius: 2, transition: "width 0.15s ease" }} />
      </div>
      <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 260 }}>
        {AI_STEPS.map((step, i) => (
          <div key={i} style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, letterSpacing: 0.5,
            color: i < activeStep ? "rgba(200,169,122,0.75)" : i === activeStep ? "#C8A97A" : "rgba(200,169,122,0.28)",
            transition: "color 0.4s",
          }}>
            {step}
          </div>
        ))}
      </div>
      <div className="mt-8 text-xs" style={{ color: "rgba(200,169,122,0.35)", letterSpacing: 1 }}>
        {Math.min(progress, 99)}%
      </div>
    </div>
  );
}

// ─── FriendsScreen ────────────────────────────────────────────────────────────
function FriendsScreen({ query, onQuery, onBack }: { query: string; onQuery: (v: string) => void; onBack: () => void }) {
  const filtered = FRIENDS.filter(f => !query || f.name.includes(query) || f.id.includes(query));
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-3 pb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(42,35,24,0.06)" }}>
          <ChevronLeft size={18} color="#2A2318" />
        </button>
        <h2 className="font-semibold" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, color: "#2A2318" }}>친구 관리</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 mb-5 mt-1">
          <div className="flex-1 relative">
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#7A7064" }} />
            <input value={query} onChange={e => onQuery(e.target.value)} placeholder="친구 검색용 아이디"
              className="w-full py-3 rounded-xl text-sm outline-none"
              style={{ paddingLeft: 36, paddingRight: 12, background: "#fff", border: "1.5px solid #D5D0C5", color: "#2A2318" }} />
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB" }}>신청</button>
        </div>
        {/* Pending */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2 font-semibold" style={{ color: "#C8A97A" }}>
            받은 친구 요청
            <span className="text-white text-[10px] rounded-full px-2 py-0.5" style={{ background: "#e74c3c" }}>{PENDING.length}</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(200,169,122,0.4)", background: "#fff" }}>
            {PENDING.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: p.color }}>{p.initial}</div>
                <div className="flex-1"><div className="font-semibold text-sm" style={{ color: "#2A2318" }}>{p.name}</div><div className="text-xs mt-0.5" style={{ color: "#7A7064" }}>{p.id}</div></div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#C8A97A" }}><Check size={14} color="#1E1B16" /></button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F0ECE4" }}><X size={14} color="#7A7064" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-wider mb-2 font-semibold" style={{ color: "#7A7064" }}>내 친구 목록 ({filtered.length})</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid #E5E0D8", background: "#fff" }}>
          {filtered.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F0ECE4" : "none" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: `${f.color}28`, color: f.color }}>{f.initial}</div>
              <div className="flex-1"><div className="font-semibold text-sm" style={{ color: "#2A2318" }}>{f.name}</div><div className="text-xs mt-0.5" style={{ color: "#7A7064" }}>{f.id}</div></div>
              <button className="text-[10px] px-3 py-1.5 rounded-full" style={{ border: "1px solid #E5E0D8", color: "#7A7064" }}>앨범 보기</button>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl p-4 text-center" style={{ border: "1px dashed rgba(200,169,122,0.4)", background: "rgba(200,169,122,0.04)" }}>
          <div className="text-sm font-medium mb-1" style={{ color: "#A88550" }}>🔗 초대 코드로 참여</div>
          <div className="text-xs mb-3" style={{ color: "#7A7064" }}>친구에게 코드를 받아 앨범에 참여하세요</div>
          <div className="inline-block px-5 py-2 rounded-full text-sm font-semibold" style={{ background: "rgba(200,169,122,0.15)", border: "1.5px solid rgba(200,169,122,0.5)", color: "#A88550" }}>코드 입력</div>
        </div>
      </div>
    </div>
  );
}

// ─── NewDiaryScreen ───────────────────────────────────────────────────────────
function NewDiaryScreen({ onBack, onCreate }: { onBack: () => void; onCreate: () => void }) {
  const [title, setTitle] = useState("");
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-3 pb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(42,35,24,0.06)" }}>
          <ChevronLeft size={18} color="#2A2318" />
        </button>
        <h2 className="font-semibold" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, color: "#2A2318" }}>새로운 다이어리</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: "none" }}>
        <p className="text-sm mb-6 mt-1" style={{ color: "#7A7064", lineHeight: 1.7 }}>
          다이어리를 만들고 나중에 초대 링크로<br />친구들을 초대할 수 있어요.
        </p>
        <SectionLabel>다이어리 제목</SectionLabel>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="예: 2026 우리의 타이베이 기록"
          className="w-full rounded-xl px-4 py-3 mb-5 text-sm outline-none"
          style={{ border: "1.5px solid #D5D0C5", background: "#fff", color: "#2A2318" }}
          onFocus={e => e.currentTarget.style.borderColor = "#C8A97A"}
          onBlur={e => e.currentTarget.style.borderColor = "#D5D0C5"}
        />
        <SectionLabel>함께할 친구 초대</SectionLabel>
        <div className="flex gap-2 mb-3">
          <input placeholder="아이디 검색" className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
            style={{ border: "1.5px solid #D5D0C5", background: "#fff", color: "#2A2318" }} />
          <button className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB" }}>검색</button>
        </div>
        {/* Invited list placeholder */}
        <div className="rounded-xl overflow-hidden mb-6" style={{ border: "1.5px solid #E5E0D8", minHeight: 80, background: "#fff" }}>
          {FRIENDS.slice(0, 2).map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i === 0 ? "1px solid #F0ECE4" : "none" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${f.color}28`, color: f.color }}>{f.initial}</div>
              <div className="flex-1"><div className="text-sm font-semibold" style={{ color: "#2A2318" }}>{f.name}</div><div className="text-xs" style={{ color: "#7A7064" }}>{f.id}</div></div>
              <div className="text-[10px] px-2 py-1 rounded-full" style={{ background: "rgba(200,169,122,0.12)", color: "#A88550", border: "1px solid rgba(200,169,122,0.3)" }}>초대됨</div>
            </div>
          ))}
        </div>
        <button onClick={onCreate}
          className="w-full py-4 rounded-[14px] font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB", boxShadow: "0 6px 20px rgba(0,0,0,0.16)", fontSize: 15 }}>
          다이어리 생성하기 ✦
        </button>
      </div>
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#7A7064" }}>
      {children}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [sidebar, setSidebar] = useState(false);
  const [bookIdx, setBookIdx] = useState(0);
  const [diaryPage, setDiaryPage] = useState(0);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [concept, setConcept] = useState("");
  const [entryText, setEntryText] = useState("");
  const [musicQ, setMusicQ] = useState("");
  const [selTracks, setSelTracks] = useState<number[]>([]);
  const [friendQ, setFriendQ] = useState("");
  const [psEnabled, setPsEnabled] = useState(false);

  const toggleTrack = (i: number) =>
    setSelTracks(ts => ts.includes(i) ? ts.filter(x => x !== i) : ts.length < 3 ? [...ts, i] : ts);

  const isDarkScreen = screen === "login" || screen === "signup" || screen === "ai";

  const NAV: { label: string; s: Screen }[] = [
    { label: "로그인", s: "login" }, { label: "회원가입", s: "signup" },
    { label: "책장", s: "bookshelf" }, { label: "다이어리", s: "diary" },
    { label: "캡슐", s: "capsule" }, { label: "기록추가", s: "add" },
    { label: "AI생성", s: "ai" }, { label: "친구", s: "friends" },
    { label: "새다이어리", s: "newdiary" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-6"
      style={{ background: "radial-gradient(ellipse at 45% 35%,#C8C3B6 0%,#A8A39A 100%)", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`
        @keyframes capsuleShake {
          0%,100%{transform:translateX(0)}
          15%,45%,75%{transform:translateX(-8px) rotate(-3deg)}
          30%,60%,90%{transform:translateX(8px) rotate(3deg)}
        }
        @keyframes pulseFade {
          0%,100%{opacity:0.45} 50%{opacity:1}
        }
        @keyframes floatUp {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)}
        }
        .no-scroll::-webkit-scrollbar{display:none}
      `}</style>
      <div className="flex flex-col items-center gap-4">
        <p className="text-[11px] tracking-[5px] uppercase" style={{ fontFamily: "'DM Serif Display', serif", color: "#5A554E" }}>
          Memory Archive — Mobile Wireframe
        </p>
        {/* Phone */}
        <div className="relative overflow-hidden"
          style={{ width: 390, height: 844, borderRadius: 50, background: isDarkScreen ? "#1E1B16" : "#EAE6DF", boxShadow: "0 0 0 10px #2A2318,0 0 0 12px #3D372D,0 55px 130px rgba(0,0,0,0.58)" }}>
          {/* Dynamic island */}
          <div className="absolute z-50" style={{ top: 0, left: "50%", transform: "translateX(-50%)", width: 126, height: 37, background: "#2A2318", borderRadius: "0 0 20px 20px" }} />
          <StatusBar dark={isDarkScreen} />
          {sidebar && (
            <Sidebar activeScreen={screen} onClose={() => setSidebar(false)}
              onNavigate={(s) => { setScreen(s); setSidebar(false); }} />
          )}
          {/* Screen content */}
          <div className="absolute inset-0 pt-[52px] flex flex-col">
            {screen === "login" && <LoginScreen onLogin={() => setScreen("bookshelf")} onSignup={() => setScreen("signup")} />}
            {screen === "signup" && <SignupScreen onSignup={() => setScreen("bookshelf")} onLogin={() => setScreen("login")} />}
            {screen === "bookshelf" && (
              <BookshelfScreen bookIdx={bookIdx}
                onPrev={() => setBookIdx(i => Math.max(0, i - 1))}
                onNext={() => setBookIdx(i => Math.min(BOOKS.length - 1, i + 1))}
                onOpenDiary={() => setScreen("diary")}
                onMenuOpen={() => setSidebar(true)}
                onFriends={() => setScreen("friends")}
                onNewDiary={() => setScreen("newdiary")}
              />
            )}
            {screen === "diary" && (
              <DiaryScreen book={bookIdx < 3 ? BOOKS[bookIdx] : BOOKS[0]} page={diaryPage}
                onPageChange={setDiaryPage}
                onBack={() => setScreen("bookshelf")}
                onAddRecord={() => setScreen("capsule")}
                bgmPlaying={bgmPlaying} trackIdx={trackIdx}
                onBgmToggle={() => setBgmPlaying(p => !p)}
                onPrevTrack={() => setTrackIdx(t => (t - 1 + TRACKS.length) % TRACKS.length)}
                onNextTrack={() => setTrackIdx(t => (t + 1) % TRACKS.length)}
              />
            )}
            {screen === "capsule" && (
              <CapsuleScreen onClose={() => setScreen("diary")} onReveal={() => setScreen("add")} />
            )}
            {screen === "add" && (
              <AddScreen text={entryText} onText={setEntryText}
                photoAdded={photoAdded} onPhoto={() => setPhotoAdded(p => !p)}
                concept={concept} onConcept={setConcept}
                musicQ={musicQ} onMusicQ={setMusicQ}
                selTracks={selTracks} onTrackToggle={toggleTrack}
                psEnabled={psEnabled} onPsToggle={() => setPsEnabled(p => !p)}
                onBack={() => setScreen("capsule")}
                onSave={() => { setScreen("ai"); }}
              />
            )}
            {screen === "ai" && <AiScreen onFinish={() => setScreen("diary")} />}
            {screen === "friends" && <FriendsScreen query={friendQ} onQuery={setFriendQ} onBack={() => setScreen("bookshelf")} />}
            {screen === "newdiary" && <NewDiaryScreen onBack={() => setScreen("bookshelf")} onCreate={() => setScreen("ai")} />}
          </div>
          <div className="absolute rounded-full" style={{ bottom: 8, left: "50%", transform: "translateX(-50%)", width: 130, height: 5, background: isDarkScreen ? "rgba(200,169,122,0.2)" : "rgba(42,35,24,0.18)" }} />
        </div>
        {/* Nav pills — 3 rows */}
        <div className="flex flex-col items-center gap-1.5">
          {[NAV.slice(0, 4), NAV.slice(4, 7), NAV.slice(7)].map((row, ri) => (
            <div key={ri} className="flex gap-1.5">
              {row.map(({ label, s }) => (
                <button key={s} onClick={() => setScreen(s)}
                  className="px-3 py-1.5 text-[11px] rounded-full transition-all"
                  style={{
                    background: screen === s ? "#2A2318" : "rgba(42,35,24,0.12)",
                    color: screen === s ? "#F4F1EB" : "#6A6560",
                    fontFamily: "'DM Serif Display', serif", letterSpacing: "0.5px",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
