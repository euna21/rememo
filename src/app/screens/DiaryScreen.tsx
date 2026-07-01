import { ChevronLeft, ChevronRight, Camera, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { DIARY_PAGES, TRACKS } from "../data/mockData";
import { Book } from "../types";

export default function DiaryScreen({ book, page, onPageChange, onBack, onAddRecord, bgmPlaying, trackIdx, onBgmToggle, onPrevTrack, onNextTrack }: {
  book: Book; page: number; onPageChange: (p: number) => void;
  onBack: () => void; onAddRecord: () => void;
  bgmPlaying: boolean; trackIdx: number;
  onBgmToggle: () => void; onPrevTrack: () => void; onNextTrack: () => void;
}) {
  const pg = DIARY_PAGES[page % DIARY_PAGES.length];
  const track = TRACKS[trackIdx];

  // 텍스트 편집 상태
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState(pg.text.content);
  const [saving, setSaving] = useState(false);

  // 페이지 바뀌면 텍스트 초기화
  useEffect(() => {
    setTextContent(pg.text.content);
    setIsEditing(false);
  }, [page]);

  // Firebase에 저장
 const saveText = async () => {
  if (!book.id) return;
  setSaving(true);
  try {
    const bookRef = doc(db, "rooms", String(book.id));
    await updateDoc(bookRef, {
      [`pages.${page}.text`]: textContent
    });
  } catch (e) {
    console.error("저장 실패:", e);
  } finally {
    setSaving(false);
    setIsEditing(false);
  }
};

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

            {/* 폴라로이드 사진들 */}
            {pg.polaroids.map((p, i) => (
              <div key={i} className="absolute" style={{ left: p.x, top: p.y, width: p.w, padding: "6px 6px 22px", background: "#fff", transform: `rotate(${p.rot}deg)`, boxShadow: "0 6px 22px rgba(0,0,0,0.16),0 1px 4px rgba(0,0,0,0.08)", zIndex: i + 1 }}>
                <div style={{ height: Math.round(p.h * 0.78), background: p.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Camera size={16} color="rgba(255,255,255,0.5)" />
                </div>
                <div style={{ fontFamily: "'Gowun Batang', serif", fontSize: 8, color: "#4A4236", textAlign: "center", paddingTop: 5 }}>{p.caption}</div>
              </div>
            ))}

            {/* 텍스트 박스 - 클릭하면 편집 가능 */}
            <div className="absolute rounded-xl" style={{ left: pg.text.x, top: pg.text.y, maxWidth: 175, zIndex: 10 }}>
              {isEditing ? (
                <div>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    autoFocus
                    style={{
                      width: 175, minHeight: 80, padding: "10px 12px",
                      background: "rgba(255,255,255,0.95)",
                      border: "1.5px solid rgba(200,169,122,0.6)",
                      borderRadius: 12, resize: "none",
                      fontFamily: "'Gowun Batang', serif", fontSize: 12,
                      color: "#2A2318", lineHeight: 1.65, outline: "none"
                    }}
                  />
                  <div className="flex gap-1 mt-1">
                    <button onClick={saveText} disabled={saving}
                      style={{ flex: 1, padding: "4px 8px", background: "#C8A97A", color: "#fff", border: "none", borderRadius: 8, fontSize: 10, cursor: "pointer" }}>
                      {saving ? "저장 중..." : "저장"}
                    </button>
                    <button onClick={() => { setIsEditing(false); setTextContent(pg.text.content); }}
                      style={{ flex: 1, padding: "4px 8px", background: "transparent", color: "#7A7064", border: "1px solid rgba(200,169,122,0.4)", borderRadius: 8, fontSize: 10, cursor: "pointer" }}>
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: "10px 12px", background: "rgba(255,255,255,0.88)",
                    backdropFilter: "blur(4px)", boxShadow: "0 3px 12px rgba(0,0,0,0.09)",
                    borderRadius: 12, fontFamily: "'Gowun Batang', serif",
                    fontSize: 12, color: "#2A2318", lineHeight: 1.65,
                    whiteSpace: "pre-line", cursor: "text",
                    border: "1.5px dashed rgba(200,169,122,0.3)"
                  }}>
                  {textContent || "✏️ 클릭해서 일기를 작성하세요"}
                </div>
              )}
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