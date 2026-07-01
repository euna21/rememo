import { ChevronLeft, Search, Check, X } from "lucide-react";
import { FRIENDS, PENDING } from "../data/mockData";

export default function FriendsScreen({ query, onQuery, onBack }: { query: string; onQuery: (v: string) => void; onBack: () => void }) {
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