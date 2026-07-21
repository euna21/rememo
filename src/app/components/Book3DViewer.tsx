import { useState, useRef } from "react";

interface Book3DViewerProps {
  pageCount: number;
  onPageSelect: (pageIndex: number) => void;
  onBack: () => void;
}

export default function Book3DViewer({ pageCount, onPageSelect, onBack }: Book3DViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [openAnim, setOpenAnim] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const total = Math.max(pageCount, 8);

  const openBook = () => {
    if (isAnimating || isOpen) return;
    setIsAnimating(true);
    setOpenAnim(true);
    setTimeout(() => {
      setIsOpen(true);
      setIsAnimating(false);
    }, 800);
  };

  const flipNext = () => {
    if (isAnimating || currentPage >= total - 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(p => p + 1);
      setIsAnimating(false);
    }, 400);
  };

  const flipPrev = () => {
    if (isAnimating || currentPage <= 0) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(p => p - 1);
      setIsAnimating(false);
    }, 400);
  };

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = "touches" in e ? e.touches[0].clientX : e.clientX;
  };

  const handleUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const x = "changedTouches" in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const delta = x - dragStartXRef.current;
    if (Math.abs(delta) < 10) {
      if (!isOpen) openBook();
      else onPageSelect(currentPage);
      return;
    }
    if (isOpen) {
      if (delta < -40) flipNext();
      else if (delta > 40) flipPrev();
    }
  };

  // 왼쪽에 쌓인 페이지 수
  const leftCount = currentPage + 1; // 표지 포함
  // 오른쪽 남은 페이지 수
  const rightCount = total - currentPage - 1;

  const MAX_SPREAD = 35; // 최대 펼쳐지는 각도
  const PAGE_W = 130;
  const PAGE_H = 180;

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse at 50% 35%, #C0BBB3 0%, #9A958D 100%)",
      userSelect: "none",
    }}>
      {/* 상단 */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#5A5040", fontSize: 13, cursor: "pointer" }}>◀ 책장</button>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 11, letterSpacing: 3, color: "#5A5040" }}>
          {isOpen ? `${currentPage + 1} / ${total}` : "RE:MEMO"}
        </span>
        {isOpen
          ? <button onClick={() => onPageSelect(currentPage)}
              style={{ background: "rgba(200,169,122,0.2)", border: "1px solid rgba(200,169,122,0.5)", color: "#7A5C3A", fontSize: 11, padding: "5px 12px", borderRadius: 10, cursor: "pointer" }}>
              편집하기
            </button>
          : <div style={{ width: 60 }} />
        }
      </div>

      {/* 책 영역 */}
      <div
        style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          perspective: "800px",
        }}
        onMouseDown={handleDown} onMouseUp={handleUp}
        onMouseLeave={() => { isDraggingRef.current = false; }}
        onTouchStart={handleDown} onTouchEnd={handleUp}
      >
        {!isOpen ? (
          /* ── 닫힌 책 ── */
          <div style={{
            position: "relative",
            width: PAGE_W,
            height: PAGE_H,
            transformStyle: "preserve-3d",
            transform: "rotateX(15deg) rotateY(-20deg)",
            cursor: "pointer",
            transition: "transform 0.3s ease",
          }} onClick={openBook}>
            {/* 앞표지 */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(160deg, #4A3525 0%, #2A1A0A 100%)",
              borderRadius: "3px 10px 10px 3px",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset -4px 0 10px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.2)",
            }}>
              <div style={{ border: "1px solid rgba(200,169,122,0.4)", padding: "14px 18px", textAlign: "center" }}>
                <div style={{ color: "rgba(210,175,125,0.95)", fontFamily: "Georgia,serif", fontSize: 18, fontWeight: "bold", letterSpacing: 2 }}>RE:MEMO</div>
                <div style={{ color: "rgba(200,165,110,0.55)", fontFamily: "Georgia,serif", fontSize: 7, letterSpacing: 3, marginTop: 6 }}>✦ MEMORY ARCHIVE ✦</div>
              </div>
            </div>

            {/* 오른쪽 면 (두께) */}
            <div style={{
              position: "absolute",
              top: 0, right: -22, width: 22, height: "100%",
              background: "linear-gradient(to right, #E8E2D8, #F0EBE2)",
              transform: "rotateY(90deg)",
              transformOrigin: "left center",
              overflow: "hidden",
            }}>
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} style={{
                  position: "absolute", left: 0, right: 0,
                  top: `${(i / total) * 100}%`,
                  height: 2,
                  background: i % 2 === 0 ? "rgba(200,169,122,0.2)" : "rgba(200,169,122,0.08)"
                }} />
              ))}
            </div>

            {/* 왼쪽 면 (책등) */}
            <div style={{
              position: "absolute",
              top: 0, left: -12, width: 12, height: "100%",
              background: "linear-gradient(to right, #0D0700, #1A0E05)",
              transform: "rotateY(-90deg)",
              transformOrigin: "right center",
            }} />

            {/* 윗면 */}
            <div style={{
              position: "absolute",
              top: -8, left: 0, right: 0, height: 8,
              background: "linear-gradient(to bottom, #F5F0E8, #EDE8DF)",
              transform: "rotateX(90deg)",
              transformOrigin: "bottom center",
            }} />

            {/* 그림자 */}
            <div style={{
              position: "absolute", bottom: -25, left: "5%", right: "5%",
              height: 18, background: "rgba(0,0,0,0.35)",
              filter: "blur(14px)", borderRadius: "50%",
            }} />
          </div>
        ) : (
          /* ── 펼쳐진 책 (Paper 앱처럼) ── */
          <div style={{
            position: "relative",
            transformStyle: "preserve-3d",
            transform: "rotateX(42deg) rotateZ(0deg)",
            transition: "transform 0.5s ease",
          }}>
            {/* 바닥 그림자 */}
            <div style={{
              position: "absolute",
              bottom: -40, left: "10%", right: "10%",
              height: 30, background: "rgba(0,0,0,0.35)",
              filter: "blur(20px)", borderRadius: "50%",
            }} />

            <div style={{ display: "flex", alignItems: "flex-end", position: "relative" }}>

              {/* 왼쪽 - 넘어간 페이지들 */}
              <div style={{
                position: "relative",
                width: PAGE_W, height: PAGE_H,
                transformStyle: "preserve-3d",
                transformOrigin: "right center",
              }}>
                {Array.from({ length: Math.min(leftCount, 10) }).map((_, i) => {
                  const idx = Math.min(leftCount, 10) - 1 - i;
                  const spreadAngle = leftCount <= 1 ? 0 : (idx / Math.max(Math.min(leftCount, 10) - 1, 1)) * -MAX_SPREAD;
                  const isTopLeft = i === 0;
                  return (
                    <div key={i} style={{
                      position: "absolute", inset: 0,
                      background: idx === Math.min(leftCount, 10) - 1
                        ? "linear-gradient(160deg, #4A3525, #2A1A0A)"  // 표지
                        : `hsl(38, ${30 + idx * 2}%, ${96 - idx}%)`,
                      transform: `rotateY(${spreadAngle}deg)`,
                      transformOrigin: "right center",
                      borderRadius: "10px 2px 2px 10px",
                      transition: isAnimating ? "transform 0.4s ease" : "none",
                      boxShadow: isTopLeft
                        ? "2px 0 15px rgba(0,0,0,0.3), 4px 0 6px rgba(0,0,0,0.15)"
                        : "none",
                    }}>
                      {isTopLeft && idx < Math.min(leftCount, 10) - 1 && (
                        <div style={{ padding: "10px 12px 10px 10px", height: "100%", position: "relative" }}>
                          {/* 줄 */}
                          {Array.from({ length: 7 }).map((_, j) => (
                            <div key={j} style={{
                              height: 1, background: "rgba(200,169,122,0.18)",
                              marginTop: j === 0 ? 22 : 18
                            }} />
                          ))}
                          <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: 7, color: "rgba(120,80,40,0.35)", fontFamily: "Georgia" }}>
                            {currentPage}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 책 등 */}
              <div style={{
                width: 14, height: PAGE_H, flexShrink: 0,
                background: "linear-gradient(to right, #0D0700, #3A2A1A, #0D0700)",
                boxShadow: "-6px 0 16px rgba(0,0,0,0.5), 6px 0 16px rgba(0,0,0,0.5)",
                zIndex: 50,
                borderRadius: 2,
              }} />

              {/* 오른쪽 - 남은 페이지들 */}
              <div style={{
                position: "relative",
                width: PAGE_W, height: PAGE_H,
                transformStyle: "preserve-3d",
                transformOrigin: "left center",
              }}>
                {Array.from({ length: Math.min(rightCount, 10) }).map((_, i) => {
                  const spreadAngle = rightCount <= 1 ? 0 : (i / Math.max(Math.min(rightCount, 10) - 1, 1)) * MAX_SPREAD;
                  const isTopRight = i === 0;
                  return (
                    <div key={i} style={{
                      position: "absolute", inset: 0,
                      background: `hsl(38, ${30 + i * 2}%, ${96 - i}%)`,
                      transform: `rotateY(${spreadAngle}deg)`,
                      transformOrigin: "left center",
                      borderRadius: "2px 10px 10px 2px",
                      transition: isAnimating ? "transform 0.4s ease" : "none",
                      boxShadow: isTopRight
                        ? "-2px 0 15px rgba(0,0,0,0.25), -4px 0 6px rgba(0,0,0,0.12)"
                        : "none",
                    }}>
                      {isTopRight && (
                        <div style={{ padding: "10px 10px 10px 12px", height: "100%", position: "relative" }}>
                          <div style={{ fontSize: 7, color: "rgba(120,80,40,0.4)", fontFamily: "Georgia", marginBottom: 4 }}>
                            2024.0{currentPage + 1}.15
                          </div>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <div key={j} style={{
                              height: 1, background: "rgba(200,169,122,0.18)",
                              marginTop: j === 0 ? 14 : 18
                            }} />
                          ))}
                          <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 7, color: "rgba(120,80,40,0.3)", fontFamily: "Georgia" }}>
                            {currentPage + 1}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 하단 */}
      <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        {isOpen ? (
          <>
            <button onClick={flipPrev} disabled={currentPage === 0 || isAnimating}
              style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(200,169,122,0.4)", color: "#5A5040", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 20, opacity: currentPage === 0 ? 0.3 : 1 }}>‹</button>
            <span style={{ fontSize: 10, color: "rgba(90,70,50,0.5)", letterSpacing: 2 }}>드래그하여 넘기기</span>
            <button onClick={flipNext} disabled={currentPage >= total - 1 || isAnimating}
              style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(200,169,122,0.4)", color: "#5A5040", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 20, opacity: currentPage >= total - 1 ? 0.3 : 1 }}>›</button>
          </>
        ) : (
          <div style={{ width: "100%", textAlign: "center" }}>
            <span style={{ fontSize: 10, color: "rgba(90,70,50,0.45)", letterSpacing: 2 }}>탭하여 다이어리 열기</span>
          </div>
        )}
      </div>
    </div>
  );
}