// src/app/components/Sidebar.tsx
import { Screen } from "../types";

export default function Sidebar({ activeScreen, onClose, onNavigate }: {
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