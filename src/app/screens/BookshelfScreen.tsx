// src/app/screens/BookshelfScreen.tsx
import { useState } from "react";
import { Menu, ChevronLeft, ChevronRight, Users, Trash2 } from "lucide-react";
import { auth, db } from "../../firebase";
import { deleteDoc, doc } from "firebase/firestore";

export default function BookshelfScreen({ bookIdx, books, onPrev, onNext, onOpenDiary, onMenuOpen, onFriends, onNewDiary }: {
  bookIdx: number; books: any[]; onPrev: () => void; onNext: () => void;
  onOpenDiary: () => void; onMenuOpen: () => void; onFriends: () => void; onNewDiary: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Firestore에서 불러온 실제 책 목록 + 마지막에 "새 앨범 만들기" 카드 하나 붙이기
  const displayBooks = [...books, { id: "__blank__", blank: true }];

  const handleDelete = async (e: React.MouseEvent, book: any) => {
    e.stopPropagation(); // 카드 클릭(다이어리 열기)으로 안 번지게
    if (deletingId) return;
    const ok = window.confirm(`'${book.title}' 다이어리를 정말 삭제할까요?\n삭제하면 되돌릴 수 없어요.`);
    if (!ok) return;
    setDeletingId(book.id);
    try {
      await deleteDoc(doc(db, "rooms", book.id));
    } catch (error) {
      console.error("다이어리 삭제 실패:", error);
      alert("삭제 중 문제가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setDeletingId(null);
    }
  };

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
          {displayBooks.map((book, i) => {
            const off = i - bookIdx;
            if (Math.abs(off) > 1) return null;
            const active = off === 0;
            const isOwner = !book.blank && !!book.ownerId && auth.currentUser?.uid === book.ownerId;
            const showDeleteBtn = active && isOwner && hoveredId === book.id;
            return (
              <div key={book.id}
                onClick={active ? (book.blank ? onNewDiary : onOpenDiary) : undefined}
                onMouseEnter={() => active && setHoveredId(book.id)}
                onMouseLeave={() => setHoveredId(prev => (prev === book.id ? null : prev))}
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
                {isOwner && (
                  <button onClick={(e) => handleDelete(e, book)} disabled={deletingId === book.id}
                    className="flex items-center gap-1.5"
                    style={{
                      position: "absolute", bottom: 16, left: "50%",
                      transform: `translateX(-50%) translateY(${showDeleteBtn ? 0 : 8}px)`,
                      zIndex: 30,
                      padding: "7px 14px", borderRadius: 20,
                      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      fontSize: 11, fontWeight: 600, color: "#F4F1EB",
                      opacity: showDeleteBtn ? (deletingId === book.id ? 0.5 : 1) : 0,
                      pointerEvents: showDeleteBtn ? "auto" : "none",
                      transition: "opacity 0.2s ease, transform 0.2s ease",
                    }}>
                    <Trash2 size={12} color="#F4F1EB" />
                    {deletingId === book.id ? "삭제 중..." : "삭제"}
                  </button>
                )}
                {book.blank ? (
                  <>
                    <span style={{ fontSize: 36, color: "#C8A97A", marginBottom: 12, display: "block" }}>＋</span>
                    <span style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 13, color: "#A8A095" }}>새 앨범 만들기</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 28, marginBottom: 10, display: "block" }}>{book.emoji}</span>
                    <span style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 17, fontWeight: 700, color: "#F4F1EB", textShadow: "1px 2px 6px rgba(0,0,0,0.4)", lineHeight: 1.4, marginBottom: 5, display: "block" }}>{book.title}</span>
                    {book.subtitle && (
                      <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: 3, display: "block" }}>{book.subtitle}</span>
                    )}
                    <span style={{ marginTop: 16, padding: "6px 14px", borderRadius: 20, fontSize: 11, color: "#EAE6DF", background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.16)", backdropFilter: "blur(6px)", display: "inline-block" }}>기록 {book.count ?? 0}개</span>
                    <div style={{ display: "flex", marginTop: 12 }}>
                      {(book.members || []).slice(0, 3).map((m: string, mi: number) => (
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
        <button onClick={onNext} disabled={bookIdx === displayBooks.length - 1}
          className="absolute z-20 w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-0 transition-opacity"
          style={{ right: 14, background: "rgba(255,255,255,0.82)", border: "2px solid #C8A97A", color: "#C8A97A" }}>
          <ChevronRight size={18} />
        </button>
        <div className="absolute bottom-0 flex items-center gap-2">
          {displayBooks.map((_, i) => (
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