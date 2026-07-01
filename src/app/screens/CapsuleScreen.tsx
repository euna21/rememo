import { useState } from "react";
import { X } from "lucide-react";

export default function CapsuleScreen({ onClose, onReveal }: { onClose: () => void; onReveal: () => void }) {
  const [phase, setPhase] = useState<"idle" | "shaking" | "revealed">("idle");
  const [role] = useState({ name: "관찰자", icon: "🔭", desc: "여행의 시선으로 순간을 포착하는 역할" });

  const handleCapsuleClick = () => {
    if (phase !== "idle") return;
    setPhase("shaking");
    setTimeout(() => setPhase("revealed"), 700);
  };
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#EAE6DF" }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 11, letterSpacing: 4, color: "#7A7064" }}>
          기록 추가
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(42,35,24,0.08)" }}>
          <X size={16} color="#2A2318" />
        </button>
      </div>

      {phase !== "revealed" ? (
        /* Phase 1: Capsule */
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <h2 className="text-center mb-2" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: "#C8A97A" }}>
            나의 역할 확인하기
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: "#7A7064", lineHeight: 1.6 }}>
            캡슐을 클릭해 역할을 확인하고<br />기록을 추가하세요!
          </p>
          {/* Capsule */}
          <div onClick={handleCapsuleClick} className="flex flex-col items-center gap-3 cursor-pointer"
            style={{
              filter: "drop-shadow(0 15px 35px rgba(200,169,122,0.35))",
              animation: phase === "shaking" ? "capsuleShake 0.6s ease" : undefined,
              transform: phase === "idle" ? "translateY(0)" : undefined,
              transition: "transform 0.3s ease",
            }}>
            <div style={{ position: "relative", width: 130, height: 190 }}>
              {/* Body */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg,#CEBBA0 0%,#A08865 55%,#B89878 100%)", borderRadius: "50% 50% 40% 40% / 30% 30% 20% 20%", border: "1.5px solid rgba(200,169,122,0.5)", overflow: "hidden" }}>
                {/* Shine */}
                <div style={{ position: "absolute", top: "10%", left: "12%", width: "28%", height: "55%", background: "linear-gradient(135deg,rgba(255,255,255,0.2),transparent)", borderRadius: "50%" }} />
                {/* Emblem */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", width: 58, height: 58, border: "1.5px solid rgba(200,169,122,0.55)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: "rgba(200,169,122,0.1)" }}>🕰️</div>
                {/* Label */}
                <div style={{ position: "absolute", bottom: "23%", left: "50%", transform: "translateX(-50%)", fontFamily: "'DM Serif Display', serif", fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", whiteSpace: "nowrap" }}>MEMORY</div>
              </div>
              {/* Ring */}
              <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: "78%", height: 16, background: "linear-gradient(90deg,#7B5C10,#D4A843,#7B5C10)", borderRadius: 8, boxShadow: "0 5px 12px rgba(0,0,0,0.45)" }} />
            </div>
          </div>
          <div className="mt-8 text-sm font-semibold" style={{ color: "#C8A97A", animation: "pulseFade 2.4s ease-in-out infinite" }}>
            캡슐을 터치하세요
          </div>
        </div>
      ) : (
        /* Phase 2: Role revealed */
        <div className="flex-1 flex flex-col px-5 pt-2 pb-5">
          <div className="rounded-xl p-4 mb-4 text-center" style={{ border: "1.5px solid rgba(200,169,122,0.35)", background: "rgba(200,169,122,0.05)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#7A7064" }}>당신의 역할은</div>
            <div className="text-2xl mb-1" style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, color: "#A88550" }}>
              {role.icon} {role.name}
            </div>
            <div className="text-xs" style={{ color: "#7A7064" }}>{role.desc}</div>
          </div>
          <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: "#F4F1EB", border: "1px solid rgba(200,169,122,0.2)" }}>
            <div className="font-semibold mb-1" style={{ color: "#2A2318" }}>이 역할에서 작성할 내용</div>
            <ul className="text-xs space-y-1" style={{ color: "#7A7064" }}>
              <li>• 여행/모임 현장의 사진 업로드</li>
              <li>• AI 컨셉 보정 (Pixel Studio)</li>
              <li>• 배경음악 등록 (최대 3곡)</li>
              <li>• 비밀 코멘트 작성</li>
            </ul>
          </div>
          <button onClick={onReveal} className="w-full py-3.5 rounded-[14px] font-bold text-sm"
            style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB", boxShadow: "0 6px 20px rgba(0,0,0,0.16)" }}>
            기록 작성 시작하기 ✦
          </button>
        </div>
      )}
    </div>
  );
}