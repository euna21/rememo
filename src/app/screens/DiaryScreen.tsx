import { ChevronLeft, ChevronRight, Camera, Play, Pause, SkipBack, SkipForward, X, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { DIARY_PAGES, TRACKS } from "../data/mockData";
import { Book, DiaryPageDef } from "../types";

const STICKERS = [
  "🌸", "🌷", "🌼", "🌻", "🍀", "🍁", "🌿",
  "⭐", "✨", "💫", "🌙", "☀️", "🌈",
  "🎀", "💝", "💖", "🎵", "🎶", "📷", "🎞️",
  "☕", "🍰", "🧁", "🍓", "🌮",
  "✈️", "🗺️", "🏖️", "🏔️", "🎡"
];

const FONT_OPTIONS = [
  { label: "고운바탕", value: "'Gowun Batang', serif" },
  { label: "DM Serif", value: "'DM Serif Display', serif" },
  { label: "Pretendard", value: "'Pretendard', sans-serif" },
];

const COLOR_OPTIONS = [
  { label: "검정", value: "#2A2318" },
  { label: "갈색", value: "#7A5C3A" },
  { label: "골드", value: "#C8A97A" },
  { label: "빨강", value: "#C0392B" },
  { label: "파랑", value: "#2980B9" },
  { label: "초록", value: "#27AE60" },
  { label: "보라", value: "#8E44AD" },
  { label: "회색", value: "#7F8C8D" },
];

const SIZE_OPTIONS = [10, 12, 14, 16, 20];

const EMPTY_PAGE: DiaryPageDef = {
  polaroids: [],
  text: { x: 40, y: 100, content: "" },
  date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
  washi: null,
  deco: null,
};

interface Sticker {
  id: string; emoji: string; x: number; y: number; size: number;
}

interface TextBox {
  id: string; content: string; x: number; y: number;
  fontSize: number; color: string; fontFamily: string; bold: boolean;
}

interface PhotoBox {
  id: string; src: string; x: number; y: number; width: number; rotation: number;
}

export default function DiaryScreen({ book, page, onPageChange, onBack, onAddRecord, bgmPlaying, trackIdx, onBgmToggle, onPrevTrack, onNextTrack }: {
  book: Book; page: number; onPageChange: (p: number) => void;
  onBack: () => void; onAddRecord: () => void;
  bgmPlaying: boolean; trackIdx: number;
  onBgmToggle: () => void; onPrevTrack: () => void; onNextTrack: () => void;
}) {
  const [pages, setPages] = useState<DiaryPageDef[]>(DIARY_PAGES);
  const [showPagePanel, setShowPagePanel] = useState(false);
  const pg = pages[page % pages.length];
  const track = TRACKS[trackIdx];

  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState(pg.text.content);
  const [saving, setSaving] = useState(false);
  const [decorMode, setDecorMode] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ type: "sticker" | "textbox" | "photo"; id: string; offsetX: number; offsetY: number } | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBox, setSelectedTextBox] = useState<string | null>(null);
  const [editingTextBox, setEditingTextBox] = useState<string | null>(null);
  const [newTextInput, setNewTextInput] = useState("");
  const [newFontSize, setNewFontSize] = useState(12);
  const [newColor, setNewColor] = useState("#2A2318");
  const [newFont, setNewFont] = useState("'Gowun Batang', serif");
  const [newBold, setNewBold] = useState(false);

  // 사진 state
  const [photoBoxes, setPhotoBoxes] = useState<PhotoBox[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // 페이지 전환 직후엔 자동저장이 빈 배열로 덮어쓰지 않도록 막는 플래그
  const isInitialLoad = useRef(true);

  useEffect(() => {
    isInitialLoad.current = true;
    setTextContent(pg.text.content);
    setIsEditing(false);
    setSelectedSticker(null);
    setSelectedTextBox(null);
    setEditingTextBox(null);
    setShowStickerPanel(false);
    setShowTextPanel(false);
    setShowPagePanel(false);
    // pg에 저장된 값이 있으면 불러오고, 없으면 빈 배열
    setStickers((pg as any).stickers || []);
    setTextBoxes((pg as any).textBoxes || []);
    setPhotoBoxes((pg as any).photoBoxes || []);
    setSelectedPhoto(null);
  }, [page]);

  // 스티커/텍스트박스/사진 자동저장 (변경 후 800ms 뒤 저장)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (!book.id) return;

    const timer = setTimeout(async () => {
      try {
        const bookRef = doc(db, "rooms", String(book.id));
        await updateDoc(bookRef, {
          [`pages.${page}.stickers`]: stickers,
          [`pages.${page}.textBoxes`]: textBoxes,
          [`pages.${page}.photoBoxes`]: photoBoxes,
        });
      } catch (e) {
        console.error("자동 저장 실패:", e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [stickers, textBoxes, photoBoxes]);

  const addPage = () => {
    const newPages = [...pages];
    newPages.splice(page + 1, 0, { ...EMPTY_PAGE, date: new Date().toISOString().slice(0, 10).replace(/-/g, ".") });
    setPages(newPages);
    setShowPagePanel(false);
    onPageChange(page + 1);
  };

  const deletePage = () => {
    if (pages.length <= 1) { alert("페이지가 1개뿐이라 삭제할 수 없어요!"); return; }
    if (!confirm("이 페이지를 삭제할까요?")) return;
    const newPages = pages.filter((_, i) => i !== page);
    setPages(newPages);
    setShowPagePanel(false);
    onPageChange(Math.max(0, page - 1));
  };

  const saveText = async () => {
    if (!book.id) return;
    setSaving(true);
    try {
      const bookRef = doc(db, "rooms", String(book.id));
      await updateDoc(bookRef, { [`pages.${page}.text`]: textContent });
    } catch (e) {
      console.error("저장 실패:", e);
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Date.now().toString(), emoji,
      x: 80 + Math.random() * 100, y: 80 + Math.random() * 150, size: 28,
    };
    setStickers(prev => [...prev, newSticker]);
    setShowStickerPanel(false);
    setSelectedSticker(newSticker.id);
  };

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    setSelectedSticker(null);
  };

  const addTextBox = () => {
    if (!newTextInput.trim()) return;
    const newBox: TextBox = {
      id: Date.now().toString(), content: newTextInput,
      x: 60 + Math.random() * 80, y: 60 + Math.random() * 120,
      fontSize: newFontSize, color: newColor, fontFamily: newFont, bold: newBold,
    };
    setTextBoxes(prev => [...prev, newBox]);
    setNewTextInput("");
    setShowTextPanel(false);
    setSelectedTextBox(newBox.id);
  };

  const deleteTextBox = (id: string) => {
    setTextBoxes(prev => prev.filter(t => t.id !== id));
    setSelectedTextBox(null);
    setEditingTextBox(null);
  };

  const updateTextBox = (id: string, content: string) => {
    setTextBoxes(prev => prev.map(t => t.id === id ? { ...t, content } : t));
  };

  // 사진 업로드
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newPhoto: PhotoBox = {
        id: Date.now().toString(),
        src: ev.target?.result as string,
        x: 60 + Math.random() * 80,
        y: 60 + Math.random() * 100,
        width: 120,
        rotation: Math.random() * 10 - 5,
      };
      setPhotoBoxes(prev => [...prev, newPhoto]);
      setSelectedPhoto(newPhoto.id);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deletePhoto = (id: string) => {
    setPhotoBoxes(prev => prev.filter(p => p.id !== id));
    setSelectedPhoto(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    if (dragging.type === "sticker") {
      setStickers(prev => prev.map(s =>
        s.id === dragging.id ? { ...s, x: e.clientX - dragging.offsetX, y: e.clientY - dragging.offsetY } : s
      ));
    } else if (dragging.type === "textbox") {
      setTextBoxes(prev => prev.map(t =>
        t.id === dragging.id ? { ...t, x: e.clientX - dragging.offsetX, y: e.clientY - dragging.offsetY } : t
      ));
    } else if (dragging.type === "photo") {
      setPhotoBoxes(prev => prev.map(p =>
        p.id === dragging.id ? { ...p, x: e.clientX - dragging.offsetX, y: e.clientY - dragging.offsetY } : p
      ));
    }
  };

  const onMouseUp = () => setDragging(null);

  const onStickerMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedSticker(id); setSelectedTextBox(null); setSelectedPhoto(null);
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;
    setDragging({ type: "sticker", id, offsetX: e.clientX - sticker.x, offsetY: e.clientY - sticker.y });
  };

  const onTextBoxMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingTextBox === id) return;
    setSelectedTextBox(id); setSelectedSticker(null); setSelectedPhoto(null);
    const box = textBoxes.find(t => t.id === id);
    if (!box) return;
    setDragging({ type: "textbox", id, offsetX: e.clientX - box.x, offsetY: e.clientY - box.y });
  };

  const onPhotoMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedPhoto(id); setSelectedSticker(null); setSelectedTextBox(null);
    const photo = photoBoxes.find(p => p.id === id);
    if (!photo) return;
    setDragging({ type: "photo", id, offsetX: e.clientX - photo.x, offsetY: e.clientY - photo.y });
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
          { label: decorMode ? "✅ 완료" : "🎨 꾸미기", fn: () => { setDecorMode(!decorMode); setShowStickerPanel(false); setShowTextPanel(false); setShowPagePanel(false); setSelectedSticker(null); setSelectedTextBox(null); setSelectedPhoto(null); } }, null,
          { label: "📄 페이지", fn: () => { setShowPagePanel(!showPagePanel); setShowStickerPanel(false); setShowTextPanel(false); } },
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

      {/* 페이지 관리 패널 */}
      {showPagePanel && (
        <div className="mx-4 mt-2 p-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(200,169,122,0.3)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: 10, color: "#7A7064", marginBottom: 10, fontWeight: 600 }}>페이지 관리</div>
          <div className="flex gap-2">
            <button onClick={addPage}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
              style={{ background: "rgba(200,169,122,0.1)", border: "1.5px solid rgba(200,169,122,0.4)", color: "#7A5C3A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} />현재 페이지 뒤에 추가
            </button>
            <button onClick={deletePage}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(231,76,60,0.08)", border: "1.5px solid rgba(231,76,60,0.3)", color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Trash2 size={14} />삭제
            </button>
          </div>
          <div style={{ fontSize: 10, color: "rgba(200,169,122,0.6)", marginTop: 8, textAlign: "center" }}>
            현재 {page + 1} / {pages.length} 페이지
          </div>
        </div>
      )}

      {/* 꾸미기 툴바 */}
      {decorMode && (
        <div className="flex items-center justify-center gap-2 mx-4 mt-2 px-3 py-2 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(200,169,122,0.3)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <button onClick={() => { setShowStickerPanel(!showStickerPanel); setShowTextPanel(false); }}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: showStickerPanel ? "rgba(200,169,122,0.15)" : "transparent", border: "1px solid rgba(200,169,122,0.3)" }}>
            <span style={{ fontSize: 18 }}>😊</span>
            <span style={{ fontSize: 9, color: "#7A7064" }}>스티커</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl"
            style={{ border: "1px solid rgba(200,169,122,0.3)", opacity: 0.5 }}>
            <span style={{ fontSize: 18 }}>✏️</span>
            <span style={{ fontSize: 9, color: "#7A7064" }}>그림판</span>
          </button>
          {/* 사진 버튼 - label로 file input 연결 */}
          <label className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl cursor-pointer"
            style={{ border: "1px solid rgba(200,169,122,0.3)" }}>
            <span style={{ fontSize: 18 }}>🖼️</span>
            <span style={{ fontSize: 9, color: "#7A7064" }}>사진</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
          </label>
          <button onClick={() => { setShowTextPanel(!showTextPanel); setShowStickerPanel(false); }}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: showTextPanel ? "rgba(200,169,122,0.15)" : "transparent", border: "1px solid rgba(200,169,122,0.3)" }}>
            <span style={{ fontSize: 18 }}>T</span>
            <span style={{ fontSize: 9, color: "#7A7064" }}>텍스트</span>
          </button>
        </div>
      )}

      {/* 스티커 패널 */}
      {showStickerPanel && (
        <div className="mx-4 mt-1 p-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(200,169,122,0.3)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: 10, color: "#7A7064", marginBottom: 8, fontWeight: 600 }}>스티커 선택</div>
          <div className="flex flex-wrap gap-1">
            {STICKERS.map((emoji, i) => (
              <button key={i} onClick={() => addSticker(emoji)}
                className="rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ width: 36, height: 36, fontSize: 20, background: "rgba(200,169,122,0.08)", border: "1px solid rgba(200,169,122,0.2)" }}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 텍스트 박스 추가 패널 */}
      {showTextPanel && (
        <div className="mx-4 mt-1 p-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(200,169,122,0.3)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: 10, color: "#7A7064", marginBottom: 8, fontWeight: 600 }}>텍스트 추가</div>
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex gap-1">
              {FONT_OPTIONS.map(f => (
                <button key={f.value} onClick={() => setNewFont(f.value)}
                  style={{ flex: 1, padding: "4px 2px", fontSize: 9, borderRadius: 6, border: newFont === f.value ? "1.5px solid #C8A97A" : "1px solid rgba(200,169,122,0.3)", background: newFont === f.value ? "rgba(200,169,122,0.15)" : "transparent", color: "#5A5040", fontFamily: f.value, cursor: "pointer" }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 9, color: "#7A7064", flexShrink: 0 }}>크기</span>
              <div className="flex gap-1">
                {SIZE_OPTIONS.map(size => (
                  <button key={size} onClick={() => setNewFontSize(size)}
                    style={{ width: 28, height: 22, fontSize: 9, borderRadius: 6, border: newFontSize === size ? "1.5px solid #C8A97A" : "1px solid rgba(200,169,122,0.3)", background: newFontSize === size ? "rgba(200,169,122,0.15)" : "transparent", color: "#5A5040", cursor: "pointer" }}>
                    {size}
                  </button>
                ))}
              </div>
              <button onClick={() => setNewBold(!newBold)}
                style={{ width: 28, height: 22, fontSize: 11, fontWeight: 700, borderRadius: 6, border: newBold ? "1.5px solid #C8A97A" : "1px solid rgba(200,169,122,0.3)", background: newBold ? "rgba(200,169,122,0.15)" : "transparent", color: "#5A5040", cursor: "pointer" }}>
                B
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 9, color: "#7A7064", flexShrink: 0 }}>색상</span>
              <div className="flex gap-1 flex-wrap">
                {COLOR_OPTIONS.map(c => (
                  <button key={c.value} onClick={() => setNewColor(c.value)}
                    style={{ width: 20, height: 20, borderRadius: "50%", background: c.value, border: newColor === c.value ? "2.5px solid #C8A97A" : "2px solid rgba(255,255,255,0.8)", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: "6px 10px", background: "rgba(200,169,122,0.05)", borderRadius: 8, marginBottom: 8, minHeight: 28, fontFamily: newFont, fontSize: newFontSize, color: newColor, fontWeight: newBold ? 700 : 400 }}>
            {newTextInput || <span style={{ color: "rgba(200,169,122,0.4)", fontSize: 10 }}>미리보기</span>}
          </div>
          <textarea value={newTextInput} onChange={(e) => setNewTextInput(e.target.value)} placeholder="추가할 텍스트를 입력하세요"
            style={{ width: "100%", minHeight: 50, padding: "8px 10px", border: "1.5px solid rgba(200,169,122,0.4)", borderRadius: 10, resize: "none", fontFamily: newFont, fontSize: newFontSize, color: newColor, fontWeight: newBold ? 700 : 400, outline: "none" }} />
          <div className="flex gap-2 mt-2">
            <button onClick={addTextBox} style={{ flex: 1, padding: "6px", background: "#C8A97A", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>추가하기</button>
            <button onClick={() => { setShowTextPanel(false); setNewTextInput(""); }} style={{ flex: 1, padding: "6px", background: "transparent", color: "#7A7064", border: "1px solid rgba(200,169,122,0.4)", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>취소</button>
          </div>
        </div>
      )}

      <div className="text-center mt-2 mb-2">
        <span className="text-xs tracking-widest" style={{ fontFamily: "'DM Serif Display', serif", color: "#7A7064" }}>
          {book.emoji} {book.title}
        </span>
      </div>

      {/* Page */}
      <div className="mx-4 flex-1 min-h-0 relative overflow-hidden"
        style={{ maxHeight: 430 }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClick={() => { setSelectedSticker(null); setSelectedTextBox(null); setSelectedPhoto(null); }}>
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

            {/* 기본 텍스트 박스 */}
            <div className="absolute rounded-xl" style={{ left: pg.text.x, top: pg.text.y, maxWidth: 175, zIndex: 10 }}>
              {isEditing ? (
                <div>
                  <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} autoFocus
                    style={{ width: 175, minHeight: 80, padding: "10px 12px", background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(200,169,122,0.6)", borderRadius: 12, resize: "none", fontFamily: "'Gowun Batang', serif", fontSize: 12, color: "#2A2318", lineHeight: 1.65, outline: "none" }} />
                  <div className="flex gap-1 mt-1">
                    <button onClick={saveText} disabled={saving} style={{ flex: 1, padding: "4px 8px", background: "#C8A97A", color: "#fff", border: "none", borderRadius: 8, fontSize: 10, cursor: "pointer" }}>
                      {saving ? "저장 중..." : "저장"}
                    </button>
                    <button onClick={() => { setIsEditing(false); setTextContent(pg.text.content); }} style={{ flex: 1, padding: "4px 8px", background: "transparent", color: "#7A7064", border: "1px solid rgba(200,169,122,0.4)", borderRadius: 8, fontSize: 10, cursor: "pointer" }}>취소</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => !decorMode && setIsEditing(true)}
                  style={{ padding: "10px 12px", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)", boxShadow: "0 3px 12px rgba(0,0,0,0.09)", borderRadius: 12, fontFamily: "'Gowun Batang', serif", fontSize: 12, color: "#2A2318", lineHeight: 1.65, whiteSpace: "pre-line", cursor: decorMode ? "default" : "text", border: "1.5px dashed rgba(200,169,122,0.3)" }}>
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

            {/* 추가된 사진들 (틀 없이 이미지만) */}
            {photoBoxes.map(photo => (
              <div key={photo.id} className="absolute select-none"
                style={{ left: photo.x, top: photo.y, width: photo.width, zIndex: 22, transform: `rotate(${photo.rotation}deg)`, cursor: decorMode ? "grab" : "default", position: "absolute" }}
                onMouseDown={(e) => decorMode && onPhotoMouseDown(e, photo.id)}>
                <img src={photo.src} style={{
                  width: "100%", display: "block", objectFit: "cover", borderRadius: 6,
                  boxShadow: selectedPhoto === photo.id ? "0 0 0 2px #C8A97A, 0 6px 18px rgba(0,0,0,0.2)" : "0 6px 18px rgba(0,0,0,0.2)"
                }} />
                {selectedPhoto === photo.id && decorMode && (
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                    style={{ position: "absolute", top: -8, right: -8, width: 16, height: 16, background: "#e74c3c", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                    <X size={10} color="#fff" />
                  </button>
                )}
              </div>
            ))}

            {/* 추가된 텍스트 박스들 */}
            {textBoxes.map(box => (
              <div key={box.id} className="absolute"
                style={{ left: box.x, top: box.y, zIndex: 25, maxWidth: 160, position: "absolute" }}
                onMouseDown={(e) => decorMode && onTextBoxMouseDown(e, box.id)}>
                {editingTextBox === box.id ? (
                  <textarea value={box.content} onChange={(e) => updateTextBox(box.id, e.target.value)} autoFocus onBlur={() => setEditingTextBox(null)}
                    style={{ width: 150, minHeight: 50, padding: "6px 8px", background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(200,169,122,0.6)", borderRadius: 8, resize: "none", fontFamily: box.fontFamily, fontSize: box.fontSize, color: box.color, fontWeight: box.bold ? 700 : 400, lineHeight: 1.6, outline: "none" }} />
                ) : (
                  <div onDoubleClick={() => decorMode && setEditingTextBox(box.id)}
                    style={{ padding: "6px 10px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderRadius: 8, fontFamily: box.fontFamily, fontSize: box.fontSize, color: box.color, fontWeight: box.bold ? 700 : 400, lineHeight: 1.6, whiteSpace: "pre-line", cursor: decorMode ? "grab" : "default", border: selectedTextBox === box.id && decorMode ? "1.5px solid rgba(200,169,122,0.6)" : "1px dashed rgba(200,169,122,0.3)", userSelect: "none", position: "relative" }}>
                    {box.content}
                    {selectedTextBox === box.id && decorMode && (
                      <button onMouseDown={(e) => { e.stopPropagation(); deleteTextBox(box.id); }}
                        style={{ position: "absolute", top: -8, right: -8, width: 16, height: 16, background: "#e74c3c", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                        <X size={10} color="#fff" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 스티커들 */}
            {stickers.map(sticker => (
              <div key={sticker.id} onMouseDown={(e) => decorMode && onStickerMouseDown(e, sticker.id)}
                className="absolute select-none"
                style={{ left: sticker.x, top: sticker.y, fontSize: sticker.size, cursor: decorMode ? "grab" : "default", zIndex: 20, filter: selectedSticker === sticker.id ? "drop-shadow(0 0 4px rgba(200,169,122,0.8))" : "none", userSelect: "none" }}>
                {sticker.emoji}
                {selectedSticker === sticker.id && decorMode && (
                  <button onMouseDown={(e) => { e.stopPropagation(); deleteSticker(sticker.id); }}
                    style={{ position: "absolute", top: -8, right: -8, width: 16, height: 16, background: "#e74c3c", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                    <X size={10} color="#fff" />
                  </button>
                )}
              </div>
            ))}

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
          {page + 1} / {pages.length}
        </span>
        <button onClick={() => onPageChange(Math.min(pages.length - 1, page + 1))} disabled={page === pages.length - 1}
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