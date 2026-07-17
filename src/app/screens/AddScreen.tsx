// src/app/screens/AddScreen.tsx
import { useRef, useState } from "react";
import { Camera, Search, X, Check, ChevronLeft, Music, Play, Pause, Loader2, Plus, Trash2 } from "lucide-react";
import SectionLabel from "../components/SectionLabel";
import { PS_CONCEPTS } from "../data/mockData";
import { roomState } from "../roomState";
import { auth } from "../../firebase";

const WEATHER_TAGS = ["☀️ 맑음", "☁️ 흐림", "🌧️ 비", "❄️ 눈", "💨 바람"];

// iTunes Search API로 실제 검색된 곡 (API 키 없이 쓸 수 있는 무료 공개 API)
interface SearchedTrack {
  id: number;
  title: string;
  artist: string;
  artworkUrl: string;
  previewUrl: string;
}

export default function AddScreen({ text, onText, photoAdded, onPhoto, concept, onConcept, musicQ, onMusicQ, selTracks, onTrackToggle, onBack, onSave, psEnabled, onPsToggle }: {
  text: string; onText: (v: string) => void;
  photoAdded: boolean; onPhoto: () => void;
  concept: string; onConcept: (v: string) => void;
  musicQ: string; onMusicQ: (v: string) => void;
  selTracks: number[]; onTrackToggle: (i: number) => void;
  onBack: () => void; onSave: () => void;
  psEnabled: boolean; onPsToggle: () => void;
}) {
  // 역할 확인 (내가 받은 역할에 해당하는 섹션만 노출)
  const myRoleNames = roomState.myRoles.map(r => r.name);
  const hasRole = (name: string) => myRoleNames.includes(name);

  // 사진: 내 PC에서 실제로 고른 파일 + 미리보기 URL (App.tsx의 photoAdded는 그대로 on/off 스위치로만 사용)
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const handlePhotoBoxClick = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    if (!photoAdded) onPhoto();
    e.target.value = "";
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
    if (photoAdded) onPhoto();
  };

  // 음악: iTunes Search API로 실제 곡 검색
  const [searchResults, setSearchResults] = useState<SearchedTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<SearchedTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const runSearch = async () => {
    const term = musicQ.trim();
    if (!term) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=12`
      );
      if (!res.ok) throw new Error("검색 요청 실패");
      const data = await res.json();
      const results: SearchedTrack[] = (data.results ?? []).map((r: any) => ({
        id: r.trackId,
        title: r.trackName,
        artist: r.artistName,
        artworkUrl: r.artworkUrl100,
        previewUrl: r.previewUrl,
      }));
      setSearchResults(results);
    } catch (err) {
      console.error("음악 검색 실패:", err);
      setSearchError("검색 중 문제가 발생했어요. 다시 시도해주세요.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") runSearch();
  };

  const toggleTrackSelect = (track: SearchedTrack) => {
    setSelectedTracks(prev => {
      const already = prev.some(t => t.id === track.id);
      if (already) return prev.filter(t => t.id !== track.id);
      if (prev.length >= 3) {
        alert("배경음악은 최대 3곡까지 선택할 수 있어요.");
        return prev;
      }
      return [...prev, track];
    });
  };

  const togglePreview = (track: SearchedTrack) => {
    if (!track.previewUrl) return;
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(track.previewUrl);
    audioRef.current = audio;
    audio.play();
    audio.onended = () => setPlayingId(null);
    setPlayingId(track.id);
  };

  // 분위기 수집가: 날씨 태그 + 소품/디테일 사진 + 메모 (신규)
  const moodPhotoInputRef = useRef<HTMLInputElement>(null);
  const [moodPhotoPreviewUrl, setMoodPhotoPreviewUrl] = useState<string | null>(null);
  const [weatherTag, setWeatherTag] = useState<string | null>(null);
  const [propNote, setPropNote] = useState("");

  const handleMoodPhotoBoxClick = () => {
    moodPhotoInputRef.current?.click();
  };
  const handleMoodPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (moodPhotoPreviewUrl) URL.revokeObjectURL(moodPhotoPreviewUrl);
    setMoodPhotoPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };
  const handleRemoveMoodPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (moodPhotoPreviewUrl) URL.revokeObjectURL(moodPhotoPreviewUrl);
    setMoodPhotoPreviewUrl(null);
  };

  // 대화 저장자: 오늘의 대화 한마디 (신규)
  const [convoInput, setConvoInput] = useState("");
  const [convoLines, setConvoLines] = useState<string[]>([]);
  const addConvoLine = () => {
    const v = convoInput.trim();
    if (!v) return;
    setConvoLines(prev => [...prev, v]);
    setConvoInput("");
  };
  const removeConvoLine = (i: number) => {
    setConvoLines(prev => prev.filter((_, idx) => idx !== i));
  };

  void selTracks;
  void onTrackToggle;
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
            {auth.currentUser?.displayName || "나"} 
          </div>
        </div>

        {roomState.myRoles.length === 0 && (
          <div className="rounded-xl p-4 mb-4 text-center text-sm" style={{ border: "1.5px dashed #D5D0C5", color: "#7A7064" }}>
            아직 배정된 역할이 없어서 작성할 수 있는 항목이 없어요.<br />방장이 역할을 배정하면 항목이 나타납니다.
          </div>
        )}

        {/* 촬영자: 사진 업로드 + AI 보정 */}
        {hasRole("촬영자") && (
          <>
            <SectionLabel>📸 사진 업로드 + AI 보정 (촬영자)</SectionLabel>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoFileChange} style={{ display: "none" }} />
            {!photoAdded ? (
              <div onClick={handlePhotoBoxClick} className="rounded-[14px] py-6 flex flex-col items-center gap-2 cursor-pointer mb-4"
                style={{ border: "2px dashed rgba(200,169,122,0.6)", background: "rgba(200,169,122,0.04)" }}>
                <Camera size={26} color="#C8A97A" />
                <span className="text-sm font-medium" style={{ color: "#C8A97A" }}>사진을 선택하세요</span>
                <span className="text-xs" style={{ color: "#7A7064" }}>JPG · PNG · HEIC · 최대 5MB</span>
              </div>
            ) : (
              <div className="mb-4">
                <div onClick={handlePhotoBoxClick} className="relative rounded-[14px] overflow-hidden mb-3 cursor-pointer" style={{ height: 115 }}>
                  {photoPreviewUrl ? (
                    <img src={photoPreviewUrl} alt="선택한 사진 미리보기" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#C4B8A8,#B4A898)" }}>
                      <Camera size={28} color="rgba(255,255,255,0.5)" />
                    </div>
                  )}
                  <button onClick={handleRemovePhoto} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#e74c3c" }}>
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
          </>
        )}

        {/* 분위기 수집가: 날씨 · 디테일 · 소품 사진 (신규) */}
        {hasRole("분위기 수집가") && (
          <>
            <SectionLabel>🌿 날씨 · 디테일 · 소품 사진 (분위기 수집가)</SectionLabel>
            <div className="flex flex-wrap gap-2 mb-3">
              {WEATHER_TAGS.map(w => (
                <button key={w} onClick={() => setWeatherTag(w)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: weatherTag === w ? "rgba(107,139,164,0.14)" : "#fff",
                    border: `1.5px solid ${weatherTag === w ? "#6B8BA4" : "#D5D0C5"}`,
                    color: weatherTag === w ? "#6B8BA4" : "#7A7064",
                  }}>
                  {w}
                </button>
              ))}
            </div>
            <input ref={moodPhotoInputRef} type="file" accept="image/*" onChange={handleMoodPhotoFileChange} style={{ display: "none" }} />
            {!moodPhotoPreviewUrl ? (
              <div onClick={handleMoodPhotoBoxClick} className="rounded-[14px] py-5 flex flex-col items-center gap-2 cursor-pointer mb-3"
                style={{ border: "2px dashed rgba(107,139,164,0.5)", background: "rgba(107,139,164,0.05)" }}>
                <Camera size={22} color="#6B8BA4" />
                <span className="text-sm font-medium" style={{ color: "#6B8BA4" }}>소품·디테일 사진 추가</span>
              </div>
            ) : (
              <div onClick={handleMoodPhotoBoxClick} className="relative rounded-[14px] overflow-hidden mb-3 cursor-pointer" style={{ height: 90 }}>
                <img src={moodPhotoPreviewUrl} alt="소품·디테일 사진 미리보기" className="w-full h-full object-cover" />
                <button onClick={handleRemoveMoodPhoto} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#e74c3c" }}>
                  <X size={12} color="#fff" />
                </button>
              </div>
            )}
            <textarea value={propNote} onChange={e => setPropNote(e.target.value)}
              placeholder="소품이나 디테일에 대한 메모를 남겨주세요."
              rows={2} className="w-full rounded-xl px-4 py-3 resize-none outline-none mb-4"
              style={{ background: "#fff", border: "1.5px solid #D5D0C5", fontFamily: "'Gowun Batang', serif", fontSize: "0.9rem", color: "#2A2318", lineHeight: 1.7 }}
            />
          </>
        )}

        {/* 기록자: 텍스트(자막·문구·일기체) */}
        {hasRole("기록자") && (
          <>
            <SectionLabel>✍️ 자막 · 문구 · 일기체 텍스트 (기록자)</SectionLabel>
            <textarea value={text} onChange={e => onText(e.target.value)}
              placeholder="역할에 맞는 에피소드나 감상을 자유롭게 적어주세요."
              rows={3} className="w-full rounded-xl px-4 py-3 resize-none outline-none mb-4"
              style={{ background: "#fff", border: "1.5px solid #D5D0C5", fontFamily: "'Gowun Batang', serif", fontSize: "0.95rem", color: "#2A2318", lineHeight: 1.7 }}
              onFocus={e => { e.currentTarget.style.borderColor = "#C8A97A"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,169,122,0.15)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#D5D0C5"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </>
        )}

        {/* 사운드 수집가: 배경음악 등록 + 현장음 메모 */}
        {hasRole("사운드 수집가") && (
          <>
            <SectionLabel>♪ 배경음악 등록 (최대 3곡) · 사운드 수집가</SectionLabel>
            <div className="rounded-[14px] p-3 flex flex-col gap-3 mb-3"
              style={{ border: "1.5px solid rgba(107,139,164,0.38)", background: "rgba(107,139,164,0.06)" }}>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input value={musicQ} onChange={e => onMusicQ(e.target.value)} onKeyDown={handleSearchKeyDown}
                    placeholder="곡 제목 또는 아티스트 검색"
                    className="w-full pl-3 pr-3 py-2.5 rounded-[10px] text-sm outline-none"
                    style={{ border: "1.5px solid #D5D0C5", background: "#fff", color: "#2A2318" }} />
                </div>
                <button onClick={runSearch} disabled={isSearching}
                  className="px-3 py-2 rounded-[10px] flex items-center justify-center" style={{ background: "#6B8BA4", opacity: isSearching ? 0.6 : 1 }}>
                  {isSearching ? <Loader2 size={15} color="#fff" className="animate-spin" /> : <Search size={15} color="#fff" />}
                </button>
              </div>

              {selectedTracks.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {selectedTracks.map(track => (
                    <div key={track.id} className="flex items-center gap-2.5 px-3 py-2 rounded-[10px]"
                      style={{ background: "rgba(107,139,164,0.14)", border: "1.5px solid rgba(107,139,164,0.48)" }}>
                      <img src={track.artworkUrl} alt="" className="rounded-md flex-shrink-0" style={{ width: 34, height: 34 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: "#2A2318" }}>{track.title}</div>
                        <div className="text-[10px] mt-0.5 truncate" style={{ color: "#7A7064" }}>{track.artist}</div>
                      </div>
                      <button onClick={() => toggleTrackSelect(track)} className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#e74c3c" }}>
                        <X size={10} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchError && <div className="text-xs text-center py-1" style={{ color: "#e74c3c" }}>{searchError}</div>}
              {!searchError && searchResults.length === 0 && !isSearching && (
                <div className="text-xs text-center py-2" style={{ color: "#7A7064" }}>검색어를 입력하고 트랙을 선택하세요</div>
              )}
              <div className="flex flex-col gap-1.5">
                {searchResults.map(track => {
                  const sel = selectedTracks.some(t => t.id === track.id);
                  const playing = playingId === track.id;
                  return (
                    <div key={track.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer"
                      onClick={() => toggleTrackSelect(track)}
                      style={{ background: sel ? "rgba(107,139,164,0.14)" : "#fff", border: `1.5px solid ${sel ? "rgba(107,139,164,0.48)" : "transparent"}` }}>
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt="" className="rounded-md flex-shrink-0" style={{ width: 34, height: 34 }} />
                      ) : (
                        <div className="rounded-md flex-shrink-0 flex items-center justify-center" style={{ width: 34, height: 34, background: "rgba(107,139,164,0.22)" }}>
                          <Music size={15} color="#6B8BA4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: "#2A2318" }}>{track.title}</div>
                        <div className="text-[10px] mt-0.5 truncate" style={{ color: "#7A7064" }}>{track.artist}</div>
                      </div>
                      {track.previewUrl && (
                        <button onClick={(e) => { e.stopPropagation(); togglePreview(track); }}
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(107,139,164,0.2)" }}>
                          {playing ? <Pause size={11} color="#6B8BA4" /> : <Play size={11} color="#6B8BA4" />}
                        </button>
                      )}
                      <div className="rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ width: 20, height: 20, background: sel ? "#6B8BA4" : "transparent", border: `1.5px solid ${sel ? "#6B8BA4" : "#D5D0C5"}` }}>
                        {sel && <Check size={10} color="#fff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-right text-[10px] italic" style={{ color: "#7A7064", fontFamily: "'DM Serif Display', serif" }}>
                {selectedTracks.length} / 3 곡 선택됨
              </div>
            </div>
            
          </>
        )}

        {/* 대화 저장자: 오늘의 대화 한마디 (신규) */}
        {hasRole("대화 저장자") && (
          <>
            <SectionLabel>💬 오늘의 대화 한마디 (대화 저장자)</SectionLabel>
            <div className="flex gap-2 mb-2">
              <input value={convoInput} onChange={e => setConvoInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addConvoLine(); }}
                placeholder="오늘 나눈 대화 한마디를 적어주세요."
                className="flex-1 px-3 py-2.5 rounded-[10px] text-sm outline-none"
                style={{ border: "1.5px solid #D5D0C5", background: "#fff", color: "#2A2318" }} />
              <button onClick={addConvoLine} className="px-3 py-2 rounded-[10px] flex items-center justify-center"
                style={{ background: "#A88550" }}>
                <Plus size={15} color="#fff" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              {convoLines.length === 0 ? (
                <div className="text-xs text-center py-3" style={{ color: "#7A7064" }}>아직 저장된 대화가 없어요.</div>
              ) : (
                convoLines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-[10px]"
                    style={{ background: "#fff", border: "1.5px solid rgba(200,169,122,0.3)" }}>
                    <span className="flex-1 text-sm" style={{ fontFamily: "'Gowun Batang', serif", color: "#2A2318" }}>“{line}”</span>
                    <button onClick={() => removeConvoLine(i)} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(231,76,60,0.1)" }}>
                      <Trash2 size={12} color="#e74c3c" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}