// src/app/screens/AddScreen.tsx
import { Camera, Search, X, Check, ChevronLeft } from "lucide-react";
import SectionLabel from "../components/SectionLabel";
import { PS_CONCEPTS, TRACKS } from "../data/mockData";
import { roomState } from "../roomState";
import { auth } from "../../firebase";

export default function AddScreen({ text, onText, photoAdded, onPhoto, concept, onConcept, musicQ, onMusicQ, selTracks, onTrackToggle, onBack, onSave, psEnabled, onPsToggle }: {
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
          <div className="text-lg font-bold" style={{ fontFamily: "'Noto Serif KR', serif", color: "#A88550" }}>
            {roomState.myRoles.length > 0
              ? roomState.myRoles.map(r => `${r.icon} ${r.name}`).join(" · ")
              : "역할 미배정"}
          </div>
          <div className="text-xs mt-1" style={{ color: "#7A7064" }}>
            {auth.currentUser?.displayName || "나"} · @{auth.currentUser?.uid?.slice(0, 8) ?? "me"}
          </div>
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