import { useState, useEffect } from "react";
import { AI_STEPS } from "../data/mockData";

export default function AiScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setTimeout(onFinish, 600); return 100; }
        const next = p + 2;
        setActiveStep(Math.floor((next / 100) * AI_STEPS.length));
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onFinish]);
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8"
      style={{ background: "rgba(30,27,22,0.95)", backdropFilter: "blur(10px)" }}>
      <div className="text-4xl mb-6" style={{ animation: "floatUp 2.5s ease-in-out infinite", color: "#C8A97A" }}>✦</div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#C8A97A", letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>
        MEMORY ARCHIVE
      </div>
      <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 12, color: "rgba(200,169,122,0.6)", letterSpacing: 1, marginBottom: 32, textAlign: "center" }}>
        AI가 여러분의 기억을 콜라주하고 있습니다
      </div>
      <div className="w-full rounded-full overflow-hidden mb-6" style={{ height: 3, background: "rgba(200,169,122,0.2)", maxWidth: 280 }}>
        <div style={{ height: "100%", background: "#C8A97A", width: `${progress}%`, borderRadius: 2, transition: "width 0.15s ease" }} />
      </div>
      <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 260 }}>
        {AI_STEPS.map((step, i) => (
          <div key={i} style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, letterSpacing: 0.5,
            color: i < activeStep ? "rgba(200,169,122,0.75)" : i === activeStep ? "#C8A97A" : "rgba(200,169,122,0.28)",
            transition: "color 0.4s",
          }}>
            {step}
          </div>
        ))}
      </div>
      <div className="mt-8 text-xs" style={{ color: "rgba(200,169,122,0.35)", letterSpacing: 1 }}>
        {Math.min(progress, 99)}%
      </div>
    </div>
  );
}