import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import SectionLabel from "../components/SectionLabel";
import { FRIENDS } from "../data/mockData";

export default function NewDiaryScreen({ onBack, onCreate }: { onBack: () => void; onCreate: () => void }) {
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