import PageFlip3D from "../components/PageFlip3D";
import { ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward, X, Plus, Trash2, Palette, RotateCw, Maximize2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { TRACKS } from "../data/mockData";
import { Book } from "../types";

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
  { label: "흰색", value: "#FFFFFF" },
  { label: "갈색", value: "#7A5C3A" },
  { label: "골드", value: "#C8A97A" },
  { label: "빨강", value: "#C0392B" },
  { label: "파랑", value: "#2980B9" },
  { label: "초록", value: "#27AE60" },
  { label: "보라", value: "#8E44AD" },
  { label: "회색", value: "#7F8C8D" },
];

const PALETTE_6_COLORS = ["#FFFFFF", "#C0392B", "#F1C40F", "#27AE60", "#2980B9", "#2A2318"];

const SIZE_OPTIONS = [10, 12, 14, 16, 20];

const SHAPE_OPTIONS = [
  { label: "각진", value: 4 },
  { label: "둥근", value: 14 },
  { label: "완전둥근", value: 999 },
];

interface Sticker {
  id: string; emoji: string; x: number; y: number; size: number; rotation: number;
}

interface TextBox {
  id: string; content: string; x: number; y: number;
  fontSize: number; color: string; fontFamily: string; bold: boolean;
  bgColor: string; borderColor: string; borderWidth: number; borderRadius: number;
}

interface PhotoBox {
  id: string; src: string; x: number; y: number; width: number; rotation: number;
  borderWidth: number; borderColor: string;
}

interface LinePoint {
  x: number; y: number;
}

interface LineStroke {
  id: string;
  points: LinePoint[];
  color: string;
  width: number;
  mode: "pen" | "highlighter" | "neon" | "pencil" | "eraser";
}

interface FirestorePage {
  text?: string;
  stickers?: Sticker[];
  textBoxes?: TextBox[];
  photoBoxes?: PhotoBox[];
  lines?: LineStroke[];
}

const EMPTY_FIRESTORE_PAGE: FirestorePage = { text: "", stickers: [], textBoxes: [], photoBoxes: [], lines: [] };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function DiaryScreen({ book, page, onPageChange, onBack, onAddRecord, bgmPlaying, trackIdx, onBgmToggle, onPrevTrack, onNextTrack }: {
  book: Book; page: number; onPageChange: (p: number) => void;
  onBack: () => void; onAddRecord: () => void;
  bgmPlaying: boolean; trackIdx: number;
  onBgmToggle: () => void; onPrevTrack: () => void; onNextTrack: () => void;
}) {
  const [pagesMap, setPagesMap] = useState<Record<string, FirestorePage>>({});
  const [showPagePanel, setShowPagePanel] = useState(false);
  const track = TRACKS[trackIdx];

  useEffect(() => {
    console.log("book id:", book?.id);
    console.log("pagesMap:", pagesMap);
    if (!book?.id) return;
    if (!book?.id) return;
    const bookRef = doc(db, "rooms", String(book.id));
    const unsub = onSnapshot(bookRef, (snap) => {
      const data = snap.data();
      const fetchedPages = data?.pages || {};
      if (Object.keys(fetchedPages).length === 0) {
        setPagesMap({ "0": EMPTY_FIRESTORE_PAGE });
      } else {
        setPagesMap(fetchedPages);
      }
    });
    return () => unsub();
  }, [book?.id]);

  const pageKeys = Object.keys(pagesMap).sort((a, b) => Number(a) - Number(b));
  const currentKey = String(page);
  const pg: FirestorePage = pagesMap[currentKey] || EMPTY_FIRESTORE_PAGE;

  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState(pg.text || "");
  const [saving, setSaving] = useState(false);
  const [savingDecor, setSavingDecor] = useState(false);
  const [decorMode, setDecorMode] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);

  // 펜 기능 관련 상태
  const [lines, setLines] = useState<LineStroke[]>([]);
  const [drawingTool, setDrawingTool] = useState<"pen" | "highlighter" | "neon" | "pencil" | "eraser">("pen");
  const [brushColor, setBrushColor] = useState("#2A2318");
  const [brushWidth, setBrushWidth] = useState(4);
  const [isStrokeEraserMode, setIsStrokeEraserMode] = useState(true);

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ type: "sticker" | "textbox" | "photo"; id: string; offsetX: number; offsetY: number } | null>(null);
  // 크기조절/회전 드래그 전용
  const [transformDrag, setTransformDrag] = useState<{ type: "resize" | "rotate"; target: "sticker" | "photo"; id: string } | null>(null);

  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBox, setSelectedTextBox] = useState<string | null>(null);
  const [editingTextBox, setEditingTextBox] = useState<string | null>(null);
  const [newTextInput, setNewTextInput] = useState("");
  const [newFontSize, setNewFontSize] = useState(12);
  const [newColor, setNewColor] = useState("#2A2318");
  const [newFont, setNewFont] = useState("'Gowun Batang', serif");
  const [newBold, setNewBold] = useState(false);

  const [photoBoxes, setPhotoBoxes] = useState<PhotoBox[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<LinePoint[]>([]);
  // 다이어리 페이지 영역 기준 좌표를 계산하기 위한 ref (회전/크기조절 계산에 필수)
  const pageRef = useRef<HTMLDivElement | null>(null);

  // 페이지가 바뀌거나 Firestore에서 새 데이터가 오면 로컬 state 동기화
  useEffect(() => {
    setTextContent(pg.text || "");
    setIsEditing(false);
    setSelectedSticker(null);
    setSelectedTextBox(null);
    setEditingTextBox(null);
    setShowStickerPanel(false);
    setShowTextPanel(false);
    setShowPagePanel(false);
    setShowDrawingPanel(false);
    setStickers((pg.stickers || []).map(s => ({ ...s, rotation: s.rotation ?? 0 })));
    setTextBoxes((pg.textBoxes || []).map(t => ({
      ...t,
      bgColor: t.bgColor ?? "rgba(255,255,255,0.9)",
      borderColor: t.borderColor ?? "#C8A97A",
      borderWidth: t.borderWidth ?? 0,
      borderRadius: t.borderRadius ?? 8,
    })));
    setPhotoBoxes((pg.photoBoxes || []).map(p => ({
      ...p,
      borderWidth: p.borderWidth ?? 0,
      borderColor: p.borderColor ?? "#FFFFFF",
    })));
    setLines(pg.lines || []);
    setSelectedPhoto(null);
  }, [page, pagesMap]);

  // 캔버스 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lines.forEach((line) => {
      if (line.points.length < 1) return;
      ctx.save();
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (line.mode === "eraser") {
        ctx.strokeStyle = "#F9F7F2";
        ctx.lineWidth = line.width;
        ctx.globalAlpha = 1.0;
      } else {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;

        if (line.mode === "highlighter") {
          ctx.globalAlpha = 0.4;
          ctx.lineCap = "square";
        } else if (line.mode === "neon") {
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = line.width * 1.5;
          ctx.shadowColor = line.color;
        } else if (line.mode === "pencil") {
          ctx.globalAlpha = 0.65;
        } else {
          ctx.globalAlpha = 1.0;
        }
      }

      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }

      if (line.mode === "pencil") {
        ctx.stroke();
        ctx.fillStyle = line.color;
        for (let i = 0; i < line.points.length; i += 2) {
          ctx.fillRect(line.points[i].x + (Math.random() * 2 - 1), line.points[i].y + (Math.random() * 2 - 1), 1.5, 1.5);
        }
      } else {
        ctx.stroke();
      }
      ctx.restore();
    });
  }, [lines, showDrawingPanel]);

  // ===== 자동저장 없음: "완료" 버튼 눌렀을 때만 저장 =====
  const saveDecorations = async () => {
    if (!book?.id) return;
    setSavingDecor(true);
    try {
      const bookRef = doc(db, "rooms", String(book.id));
      await updateDoc(bookRef, {
        [`pages.${page}.stickers`]: stickers,
        [`pages.${page}.textBoxes`]: textBoxes,
        [`pages.${page}.photoBoxes`]: photoBoxes,
        [`pages.${page}.lines`]: lines,
      });
    } catch (e) {
      console.error("저장 실패:", e);
    } finally {
      setSavingDecor(false);
    }
  };

  const handleDecorDone = async () => {
    await saveDecorations();
    setDecorMode(false);
    setShowStickerPanel(false); setShowTextPanel(false); setShowDrawingPanel(false); setShowPagePanel(false);
    setSelectedSticker(null); setSelectedTextBox(null); setSelectedPhoto(null);
  };

  // 캔버스 드로잉 핸들러
  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    isDrawingRef.current = true;
    const pos = getCanvasMousePos(e);

    if (drawingTool === "eraser" && isStrokeEraserMode) {
      eraseStrokeAt(pos.x, pos.y);
      return;
    }

    currentPointsRef.current = [pos];
    const newLine: LineStroke = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      points: [pos],
      color: brushColor,
      width: brushWidth,
      mode: drawingTool
    };
    setLines(prev => [...prev, newLine]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pos = getCanvasMousePos(e);

    if (drawingTool === "eraser" && isStrokeEraserMode) {
      eraseStrokeAt(pos.x, pos.y);
      return;
    }

    currentPointsRef.current.push(pos);
    setLines(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const lastIndex = copy.length - 1;
      copy[lastIndex] = { ...copy[lastIndex], points: [...currentPointsRef.current] };
      return copy;
    });
  };

  const handleCanvasMouseUp = () => {
    isDrawingRef.current = false;
    currentPointsRef.current = [];
  };

  const eraseStrokeAt = (x: number, y: number) => {
    const clickRadius = brushWidth + 8;
    setLines(prev => prev.filter(line => {
      if (line.mode === "eraser") return true;
      const hit = line.points.some(pt => {
        const dist = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
        return dist <= clickRadius;
      });
      return !hit;
    }));
  };

  const addPage = async () => {
    if (!book?.id) return;
    const newPageNum = pageKeys.length;
    try {
      const bookRef = doc(db, "rooms", String(book.id));
      // 0번 페이지가 없으면 같이 만들어주기
      const updates: Record<string, any> = {
        [`pages.${newPageNum}`]: EMPTY_FIRESTORE_PAGE
      };
      if (!pagesMap["0"]) {
        updates["pages.0"] = EMPTY_FIRESTORE_PAGE;
      }
      await updateDoc(bookRef, updates);
      setShowPagePanel(false);
      onPageChange(newPageNum);
    } catch (e) {
      console.error("페이지 추가 실패:", e);
    }
  };

  const deletePage = async () => {
    if (!book?.id) return;
    if (pageKeys.length <= 1) { alert("페이지가 1개뿐이라 삭제할 수 없어요!"); return; }
    if (!confirm("이 페이지를 삭제할까요?")) return;
    try {
      const bookRef = doc(db, "rooms", String(book.id));
      const newPagesMap = { ...pagesMap };
      delete newPagesMap[currentKey];
      const reindexed: Record<string, FirestorePage> = {};
      Object.values(newPagesMap).forEach((p, i) => { reindexed[String(i)] = p; });
      await updateDoc(bookRef, { pages: reindexed });
      setShowPagePanel(false);
      onPageChange(Math.max(0, page - 1));
    } catch (e) {
      console.error("페이지 삭제 실패:", e);
    }
  };

  const saveText = async () => {
    if (!book?.id) return;
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
      x: 80 + Math.random() * 100, y: 80 + Math.random() * 150, size: 28, rotation: 0,
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
      bgColor: "rgba(255,255,255,0.9)", borderColor: "#C8A97A", borderWidth: 0, borderRadius: 8,
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

  const updateTextBoxStyle = (id: string, patch: Partial<TextBox>) => {
    setTextBoxes(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  };

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
        rotation: 0,
        borderWidth: 0,
        borderColor: "#FFFFFF",
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

  const updatePhoto = (id: string, patch: Partial<PhotoBox>) => {
    setPhotoBoxes(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  // ===== 이동/크기조절/회전 드래그 =====
  const onMouseMove = (e: React.MouseEvent) => {
    if (transformDrag) {
      const { type, target, id } = transformDrag;
      // 페이지 영역 기준 상대 좌표로 변환 (sticker/photo의 x,y도 같은 기준이라 좌표계를 맞춰야 함)
      const rect = pageRef.current?.getBoundingClientRect();
      const mouseX = e.clientX - (rect?.left ?? 0);
      const mouseY = e.clientY - (rect?.top ?? 0);

      if (target === "sticker") {
        setStickers(prev => prev.map(s => {
          if (s.id !== id) return s;
          if (type === "resize") {
            const dx = mouseX - s.x;
            const dy = mouseY - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return { ...s, size: clamp(dist, 14, 120) };
          } else {
            const centerX = s.x + s.size / 2;
            const centerY = s.y + s.size / 2;
            let deg = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI + 90;
            if (deg < 0) deg += 360;
            return { ...s, rotation: Math.round(deg) };
          }
        }));
      } else {
        setPhotoBoxes(prev => prev.map(p => {
          if (p.id !== id) return p;
          if (type === "resize") {
            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return { ...p, width: clamp(dist, 50, 320) };
          } else {
            const centerX = p.x + p.width / 2;
            const centerY = p.y + p.width / 2;
            let deg = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI + 90;
            if (deg < 0) deg += 360;
            return { ...p, rotation: Math.round(deg) };
          }
        }));
      }
      return;
    }

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

  // 마우스를 어디서 떼든(다이어리 영역 밖이라도) 확실히 드래그 종료되도록
  useEffect(() => {
    if (!dragging && !transformDrag) return;
    const handleWindowMouseUp = () => {
      setDragging(null);
      setTransformDrag(null);
    };
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => window.removeEventListener("mouseup", handleWindowMouseUp);
  }, [dragging, transformDrag]);

  const onMouseUp = () => {
    setDragging(null);
    setTransformDrag(null);
  };

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

  const onResizeHandleDown = (e: React.MouseEvent, target: "sticker" | "photo", id: string) => {
    e.stopPropagation();
    setTransformDrag({ type: "resize", target, id });
  };

  const onRotateHandleDown = (e: React.MouseEvent, target: "sticker" | "photo", id: string) => {
    e.stopPropagation();
    setTransformDrag({ type: "rotate", target, id });
  };

  const activePhoto = photoBoxes.find(p => p.id === selectedPhoto);
  const activeTextBox = textBoxes.find(t => t.id === selectedTextBox);
  const showEditPanel = decorMode && !showStickerPanel && !showTextPanel && !showPagePanel && !showDrawingPanel && !editingTextBox;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Action bar */}
      <div className="flex items-center mx-4 mt-3 rounded-[22px] overflow-hidden"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", border: "1px solid rgba(200,169,122,0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.09)", padding: "3px 4px" }}>
        {([
          { label: "◀ 책장", fn: onBack }, null,
          { label: "기록 편집", fn: () => {} }, null,
          { label: "+ 추가", fn: onAddRecord }, null,
          { label: decorMode ? (savingDecor ? "저장 중..." : "✅ 완료") : "🎨 꾸미기", fn: () => { decorMode ? handleDecorDone() : setDecorMode(true); } }, null,
          { label: "📄 페이지", fn: () => { setShowPagePanel(!showPagePanel); setShowStickerPanel(false); setShowTextPanel(false); setShowDrawingPanel(false); } },
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
              <Plus size={14} />페이지 추가
            </button>
            <button onClick={deletePage}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(231,76,60,0.08)", border: "1.5px solid rgba(231,76,60,0.3)", color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Trash2 size={14} />삭제
            </button>
          </div>
          <div style={{ fontSize: 10, color: "rgba(200,169,122,0.6)", marginTop: 8, textAlign: "center" }}>
            현재 {page + 1} / {pageKeys.length} 페이지
          </div>
        </div>
      )}

      {/* 꾸미기 툴바 */}
      {decorMode && (
        <div className="flex items-center justify-center gap-2 mx-4 mt-2 px-3 py-2 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(200,169,122,0.3)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <button onClick={() => { setShowStickerPanel(!showStickerPanel); setShowTextPanel(false); setShowDrawingPanel(false); setSelectedSticker(null); setSelectedPhoto(null); setSelectedTextBox(null); }}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: showStickerPanel ? "rgba(200,169,122,0.15)" : "transparent", border: "1px solid rgba(200,169,122,0.3)" }}>
            <span style={{ fontSize: 18 }}>😊</span>
            <span style={{ fontSize: 9, color: "#7A7064" }}>스티커</span>
          </button>
          <button onClick={() => { setShowDrawingPanel(!showDrawingPanel); setShowStickerPanel(false); setShowTextPanel(false); setSelectedSticker(null); setSelectedPhoto(null); setSelectedTextBox(null); }}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: showDrawingPanel ? "rgba(200,169,122,0.15)" : "transparent", border: "1px solid rgba(200,169,122,0.3)" }}>
            <span style={{ fontSize: 18 }}>✏️</span>
            <span style={{ fontSize: 9, color: "#7A7064" }}>그림판</span>
          </button>
          <label className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl cursor-pointer"
            style={{ border: "1px solid rgba(200,169,122,0.3)" }}>
            <span style={{ fontSize: 18 }}>🖼️</span>
            <span style={{ fontSize: 9, color: "#7A7064" }}>사진</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
          </label>
          <button onClick={() => { setShowTextPanel(!showTextPanel); setShowStickerPanel(false); setShowDrawingPanel(false); setSelectedSticker(null); setSelectedPhoto(null); setSelectedTextBox(null); }}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: showTextPanel ? "rgba(200,169,122,0.15)" : "transparent", border: "1px solid rgba(200,169,122,0.3)" }}>
            <span style={{ fontSize: 18 }}>T</span>
            <span style={{ fontSize: 9, color: "#7A7064" }}>텍스트</span>
          </button>
        </div>
      )}

      {/* 그림판 패널 */}
      {showDrawingPanel && decorMode && (
        <div className="mx-4 mt-1 p-3 rounded-2xl flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(200,169,122,0.3)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div className="flex gap-1">
            {([
              { id: "pen", label: "볼펜" },
              { id: "highlighter", label: "형광펜" },
              { id: "neon", label: "네온" },
              { id: "pencil", label: "연필" },
              { id: "eraser", label: "지우개" }
            ] as const).map(tool => (
              <button key={tool.id} onClick={() => setDrawingTool(tool.id)}
                style={{ flex: 1, padding: "5px 2px", fontSize: 10, borderRadius: 6, border: drawingTool === tool.id ? "1.5px solid #C8A97A" : "1px solid rgba(200,169,122,0.3)", background: drawingTool === tool.id ? "rgba(200,169,122,0.15)" : "transparent", fontWeight: drawingTool === tool.id ? 700 : 400, cursor: "pointer" }}>
                {tool.label}
              </button>
            ))}
          </div>

          {drawingTool !== "eraser" && (
            <div className="flex items-center justify-between gap-2 bg-amber-50/20 p-1.5 rounded-xl border border-amber-900/5">
              <div className="flex gap-1.5 flex-wrap flex-1">
                {PALETTE_6_COLORS.map(color => (
                  <button key={color} onClick={() => setBrushColor(color)}
                    style={{ width: 22, height: 22, borderRadius: "50%", background: color, border: brushColor === color ? "2.5px solid #C8A97A" : "1.5px solid rgba(0,0,0,0.15)", cursor: "pointer" }} />
                ))}
              </div>
              <div style={{ width: 1, height: 20, background: "rgba(200,169,122,0.3)" }} />
              <div className="flex items-center gap-1">
                <Palette size={11} color="#7A7064" />
                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)}
                  style={{ width: 24, height: 22, border: "none", padding: 0, background: "transparent", cursor: "pointer" }} />
              </div>
            </div>
          )}

          {drawingTool === "eraser" && (
            <div className="flex items-center justify-between p-1 px-2 rounded-xl" style={{ background: "rgba(200,169,122,0.05)" }}>
              <span style={{ fontSize: 10, color: "#7A7064", fontWeight: 600 }}>획 별 지우기 모드</span>
              <button onClick={() => setIsStrokeEraserMode(!isStrokeEraserMode)}
                style={{ padding: "3px 8px", fontSize: 9, borderRadius: 6, border: "1px solid #C8A97A", background: isStrokeEraserMode ? "#C8A97A" : "transparent", color: isStrokeEraserMode ? "#FFF" : "#7A5C3A", fontWeight: 600 }}>
                {isStrokeEraserMode ? "ON (선 전체 삭제)" : "OFF (일반 지우개)"}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span style={{ fontSize: 9, color: "#7A7064", width: 40, flexShrink: 0 }}>굵기 조절</span>
            <input type="range" min={1} max={50} value={brushWidth}
              onChange={(e) => setBrushWidth(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#C8A97A" }} />
            <span style={{ fontSize: 9, color: "#7A7064", width: 20, textAlign: "right", fontWeight: 700 }}>{brushWidth}</span>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setLines([])} style={{ flex: 1, padding: "5px", background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 7, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>그림 전체 초기화</button>
            <button onClick={() => setShowDrawingPanel(false)} style={{ flex: 1, padding: "5px", background: "#C8A97A", color: "#fff", border: "none", borderRadius: 7, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>접기</button>
          </div>
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

      {/* 사진 테두리 편집 패널 (크기/회전은 사진 손잡이로) */}
      {showEditPanel && activePhoto && (
        <div className="mx-4 mt-1 p-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(200,169,122,0.3)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: 10, color: "#7A7064", marginBottom: 10, fontWeight: 600 }}>사진 테두리 (크기·회전은 사진 손잡이를 직접 드래그)</div>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontSize: 9, color: "#7A7064", width: 40, flexShrink: 0 }}>두께</span>
            <input type="range" min={0} max={12} value={activePhoto.borderWidth}
              onChange={(e) => updatePhoto(activePhoto.id, { borderWidth: Number(e.target.value) })}
              style={{ flex: 1 }} />
            <span style={{ fontSize: 9, color: "#7A7064", width: 40, textAlign: "right" }}>
              {activePhoto.borderWidth === 0 ? "없음" : `${activePhoto.borderWidth}px`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <span style={{ fontSize: 9, color: "#7A7064", flexShrink: 0 }}>색상</span>
            <button onClick={() => updatePhoto(activePhoto.id, { borderWidth: 0 })}
              style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, border: activePhoto.borderWidth === 0 ? "1.5px solid #C8A97A" : "1px solid rgba(200,169,122,0.3)", background: activePhoto.borderWidth === 0 ? "rgba(200,169,122,0.15)" : "transparent", color: "#5A5040", cursor: "pointer" }}>
              없음
            </button>
            <div className="flex gap-1 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c.value} onClick={() => updatePhoto(activePhoto.id, { borderColor: c.value, borderWidth: activePhoto.borderWidth || 4 })}
                  style={{ width: 20, height: 20, borderRadius: "50%", background: c.value, border: activePhoto.borderColor === c.value && activePhoto.borderWidth > 0 ? "2.5px solid #C8A97A" : "2px solid rgba(0,0,0,0.15)", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
              ))}
            </div>
          </div>
          <button onClick={() => deletePhoto(activePhoto.id)}
            style={{ width: "100%", padding: "6px", background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            사진 삭제
          </button>
        </div>
      )}

      {/* 텍스트박스 편집 패널 */}
      {showEditPanel && activeTextBox && (
        <div className="mx-4 mt-1 p-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(200,169,122,0.3)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: 10, color: "#7A7064", marginBottom: 10, fontWeight: 600 }}>텍스트 편집 (클릭하면 바로 내용 수정)</div>
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 9, color: "#7A7064", width: 48, flexShrink: 0 }}>글자크기</span>
              <input type="range" min={8} max={36} value={activeTextBox.fontSize}
                onChange={(e) => updateTextBoxStyle(activeTextBox.id, { fontSize: Number(e.target.value) })}
                style={{ flex: 1 }} />
              <span style={{ fontSize: 9, color: "#7A7064", width: 24, textAlign: "right" }}>{activeTextBox.fontSize}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 9, color: "#7A7064", width: 48, flexShrink: 0 }}>테두리</span>
              <input type="range" min={0} max={6} value={activeTextBox.borderWidth}
                onChange={(e) => updateTextBoxStyle(activeTextBox.id, { borderWidth: Number(e.target.value) })}
                style={{ flex: 1 }} />
              <span style={{ fontSize: 9, color: "#7A7064", width: 40, textAlign: "right" }}>
                {activeTextBox.borderWidth === 0 ? "없음" : `${activeTextBox.borderWidth}px`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span style={{ fontSize: 9, color: "#7A7064", flexShrink: 0, width: 48 }}>배경</span>
            <button onClick={() => updateTextBoxStyle(activeTextBox.id, { bgColor: "transparent" })}
              style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, border: activeTextBox.bgColor === "transparent" ? "1.5px solid #C8A97A" : "1px solid rgba(200,169,122,0.3)", background: activeTextBox.bgColor === "transparent" ? "rgba(200,169,122,0.15)" : "transparent", color: "#5A5040", cursor: "pointer" }}>
              없음
            </button>
            <div className="flex gap-1 flex-wrap">
              {["rgba(255,255,255,0.9)", "#FFF8E7", "#2A2318", "#F0EAD6", "#E8DFF5"].map(bg => (
                <button key={bg} onClick={() => updateTextBoxStyle(activeTextBox.id, { bgColor: bg })}
                  style={{ width: 20, height: 20, borderRadius: "50%", background: bg, border: activeTextBox.bgColor === bg ? "2.5px solid #C8A97A" : "2px solid rgba(0,0,0,0.15)", cursor: "pointer" }} />
              ))}
            </div>
            <input type="color"
              value={activeTextBox.bgColor.startsWith("#") ? activeTextBox.bgColor : "#ffffff"}
              onChange={(e) => updateTextBoxStyle(activeTextBox.id, { bgColor: e.target.value })}
              style={{ width: 24, height: 22, border: "1px solid rgba(200,169,122,0.3)", borderRadius: 4, padding: 0, cursor: "pointer" }} />
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <span style={{ fontSize: 9, color: "#7A7064", flexShrink: 0, width: 48 }}>테두리색</span>
            <div className="flex gap-1 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c.value} onClick={() => updateTextBoxStyle(activeTextBox.id, { borderColor: c.value, borderWidth: activeTextBox.borderWidth || 2 })}
                  style={{ width: 20, height: 20, borderRadius: "50%", background: c.value, border: activeTextBox.borderColor === c.value ? "2.5px solid #C8A97A" : "2px solid rgba(0,0,0,0.15)", cursor: "pointer" }} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 9, color: "#7A7064", flexShrink: 0, width: 48 }}>모양</span>
            <div className="flex gap-1">
              {SHAPE_OPTIONS.map(s => (
                <button key={s.label} onClick={() => updateTextBoxStyle(activeTextBox.id, { borderRadius: s.value })}
                  style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, border: activeTextBox.borderRadius === s.value ? "1.5px solid #C8A97A" : "1px solid rgba(200,169,122,0.3)", background: activeTextBox.borderRadius === s.value ? "rgba(200,169,122,0.15)" : "transparent", color: "#5A5040", cursor: "pointer" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => deleteTextBox(activeTextBox.id)}
            style={{ width: "100%", padding: "6px", background: "rgba(231,76,60,0.1)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 8, fontSize: 10, fontWeight: 600, marginTop: 8, cursor: "pointer" }}>
            글상자 삭제
          </button>
        </div>
      )}

      <div className="text-center mt-2 mb-2">
        <span className="text-xs tracking-widest" style={{ fontFamily: "'DM Serif Display', serif", color: "#7A7064" }}>
          {book.emoji} {book.title}
        </span>
      </div>

      {/* Page */}
      <PageFlip3D
        canFlipNext={page < pageKeys.length - 1}
        canFlipPrev={page > 0}
        onFlipComplete={(dir) => {
          if (dir === "next") onPageChange(Math.min(pageKeys.length - 1, page + 1));
          else onPageChange(Math.max(0, page - 1));
        }}
      >
        <div className="mx-4 flex-1 min-h-0 relative overflow-hidden"
        style={{ maxHeight: 430 }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}>
        <div className="w-full h-full rounded-lg overflow-hidden relative"
          style={{ background: "#F9F7F2", boxShadow: "-8px 0 28px rgba(0,0,0,0.07),8px 0 28px rgba(0,0,0,0.05),0 20px 40px rgba(0,0,0,0.1)", border: "1px solid rgba(229,219,197,0.8)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "repeating-linear-gradient(transparent,transparent 27px,rgba(200,169,122,0.1) 28px)" }} />
          <div className="absolute top-0 bottom-0" style={{ left: 26, width: 1, background: "rgba(200,169,122,0.22)" }} />
          <canvas ref={canvasRef} width={400} height={430} className="absolute inset-0 w-full h-full"
            style={{ zIndex: showDrawingPanel ? 50 : 25, pointerEvents: showDrawingPanel ? "auto" : "none", cursor: drawingTool === "eraser" ? "cell" : "crosshair" }}
            onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} />
          <div className="relative w-full h-full" ref={pageRef} style={{ padding: "14px 14px 14px 32px" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) { setSelectedSticker(null); setSelectedTextBox(null); setSelectedPhoto(null); } }}>
            <div className="absolute rounded-xl" style={{ left: 14, top: 60, maxWidth: 175, zIndex: 10 }}>
              {isEditing ? (
                <div>
                  <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} autoFocus
                    style={{ width: 175, minHeight: 80, padding: "10px 12px", background: "rgba(255,255,255,0.95)", border: "1.5px solid rgba(200,169,122,0.6)", borderRadius: 12, resize: "none", fontFamily: "'Gowun Batang', serif", fontSize: 13 }} />
                  <div className="flex gap-1.5 mt-1">
                    <button onClick={saveText} disabled={saving} style={{ padding: "4px 8px", background: "#C8A97A", color: "#fff", border: "none", borderRadius: 6, fontSize: 10 }}>{saving ? "저장중" : "저장"}</button>
                    <button onClick={() => setIsEditing(false)} style={{ padding: "4px 8px", background: "#ccc", color: "#333", border: "none", borderRadius: 6, fontSize: 10 }}>취소</button>
                  </div>
                </div>
              ) : (
                <div onDoubleClick={() => !decorMode && setIsEditing(true)} style={{ fontFamily: "'Gowun Batang', serif", fontSize: 13, color: "#2A2318", whiteSpace: "pre-wrap", lineHeight: "28px" }}>
                  {textContent || <span className="text-amber-900/30 text-xs">더블클릭하여 일기를 작성하세요.</span>}
                </div>
              )}
            </div>
            {photoBoxes.map((p) => (
              <div key={p.id} className="absolute select-none"
                style={{ left: p.x, top: p.y, width: p.width, zIndex: 30, transform: `rotate(${p.rotation}deg)`, cursor: decorMode ? "grab" : "default" }}
                onMouseDown={(e) => decorMode && onPhotoMouseDown(e, p.id)}>
                <img src={p.src} alt="upload" style={{ width: "100%", display: "block", objectFit: "cover", borderRadius: 6, border: p.borderWidth > 0 ? `${p.borderWidth}px solid ${p.borderColor}` : "none", boxShadow: selectedPhoto === p.id ? "0 0 0 2px #C8A97A, 0 6px 18px rgba(0,0,0,0.2)" : "0 6px 18px rgba(0,0,0,0.2)" }} />
                {selectedPhoto === p.id && decorMode && (
                  <>
                    <button onMouseDown={(e) => { e.stopPropagation(); deletePhoto(p.id); }} style={{ position: "absolute", top: -8, right: -8, width: 16, height: 16, background: "#e74c3c", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 5 }}>
                      <X size={10} color="#fff" />
                    </button>
                    <div onMouseDown={(e) => onRotateHandleDown(e, "photo", p.id)} style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)", width: 22, height: 22, borderRadius: "50%", background: "#C8A97A", border: "2px solid #fff", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.25)", zIndex: 5 }}>
                      <RotateCw size={11} color="#fff" />
                    </div>
                    <div onMouseDown={(e) => onResizeHandleDown(e, "photo", p.id)} style={{ position: "absolute", bottom: -10, right: -10, width: 22, height: 22, borderRadius: "50%", background: "#C8A97A", border: "2px solid #fff", cursor: "nwse-resize", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.25)", zIndex: 5 }}>
                      <Maximize2 size={11} color="#fff" />
                    </div>
                  </>
                )}
              </div>
            ))}
            {textBoxes.map((t) => (
              <div key={t.id} onMouseDown={(e) => decorMode && onTextBoxMouseDown(e, t.id)}
                onClick={(e) => { e.stopPropagation(); if (decorMode) setEditingTextBox(t.id); }}
                style={{ position: "absolute", left: t.x, top: t.y, zIndex: 32, cursor: decorMode ? "move" : "default", padding: "6px 10px", background: t.bgColor, border: `${t.borderWidth}px solid ${t.borderColor}`, borderRadius: t.borderRadius, fontFamily: t.fontFamily, fontSize: t.fontSize, color: t.color, fontWeight: t.bold ? 700 : 400, boxShadow: t.bgColor !== "transparent" ? "0 2px 8px rgba(0,0,0,0.06)" : "none", borderStyle: selectedTextBox === t.id ? "dashed" : "solid" }}>
                {editingTextBox === t.id ? (
                  <input type="text" value={t.content} onChange={(e) => updateTextBox(t.id, e.target.value)}
                    onBlur={() => setEditingTextBox(null)} onKeyDown={(e) => e.key === "Enter" && setEditingTextBox(null)} autoFocus
                    style={{ background: "transparent", border: "none", outline: "none", width: "auto", font: "inherit", color: "inherit" }} />
                ) : t.content}
              </div>
            ))}
            {stickers.map((s) => (
              <div key={s.id} onMouseDown={(e) => decorMode && onStickerMouseDown(e, s.id)}
                className="absolute select-none"
                style={{ left: s.x, top: s.y, fontSize: s.size, transform: `rotate(${s.rotation || 0}deg)`, zIndex: 40, cursor: decorMode ? "grab" : "default", userSelect: "none" }}>
                {s.emoji}
                {selectedSticker === s.id && decorMode && (
                  <>
                    <button onMouseDown={(e) => { e.stopPropagation(); deleteSticker(s.id); }} style={{ position: "absolute", top: -8, right: -8, width: 16, height: 16, background: "#e74c3c", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transform: `rotate(${-(s.rotation || 0)}deg)`, zIndex: 5 }}>
                      <X size={10} color="#fff" />
                    </button>
                    <div onMouseDown={(e) => onRotateHandleDown(e, "sticker", s.id)} style={{ position: "absolute", top: -26, left: "50%", transform: `translateX(-50%) rotate(${-(s.rotation || 0)}deg)`, width: 18, height: 18, borderRadius: "50%", background: "#C8A97A", border: "2px solid #fff", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.25)", zIndex: 5 }}>
                      <RotateCw size={9} color="#fff" />
                    </div>
                    <div onMouseDown={(e) => onResizeHandleDown(e, "sticker", s.id)} style={{ position: "absolute", bottom: -8, right: -8, width: 18, height: 18, borderRadius: "50%", background: "#C8A97A", border: "2px solid #fff", cursor: "nwse-resize", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.25)", zIndex: 5, transform: `rotate(${-(s.rotation || 0)}deg)` }}>
                      <Maximize2 size={9} color="#fff" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageFlip3D>
    </div>
  );
}