// components/BottomNav.tsx
import { Screen } from "../types";
import { NAV } from "../constants"; // 2단계에서 만든 상수 파일 불러오기

interface BottomNavProps {
  screen: Screen;
  setScreen: (s: Screen) => void;
}

export default function BottomNav({ screen, setScreen }: BottomNavProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {[NAV.slice(0, 4), NAV.slice(4, 7), NAV.slice(7)].map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map(({ label, s }) => (
            <button key={s} onClick={() => setScreen(s)}
              className="px-3 py-1.5 text-[11px] rounded-full transition-all"
              style={{
                background: screen === s ? "#2A2318" : "rgba(42,35,24,0.12)",
                color: screen === s ? "#F4F1EB" : "#6A6560",
                fontFamily: "'DM Serif Display', serif", letterSpacing: "0.5px",
              }}>
              {label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}