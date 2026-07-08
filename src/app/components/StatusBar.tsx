export default function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? "#F4F1EB" : "#2A2318";
  const bg = dark ? "rgba(30,27,22,0.95)" : "rgba(234,230,223,0.95)";
  return (
    <div className="absolute top-0 left-0 right-0 h-[52px] flex items-end justify-between px-8 pb-2 z-40"
      style={{ background: bg, backdropFilter: "blur(10px)" }}>
      <span className="text-xs font-bold" style={{ color }}>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-[2px]">
          {[3, 5, 7, 9].map((h, i) => (
            <div key={i} style={{ width: 3, height: h, background: color, opacity: i < 3 ? 1 : 0.28, borderRadius: 1 }} />
          ))}
        </div>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path d="M7.5 9a1 1 0 100 2 1 1 0 000-2z" fill={color} />
          <path d="M4.8 6.8C5.8 5.8 6.6 5.5 7.5 5.5s1.7.3 2.7 1.3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M2.5 4.5C4 3 5.6 2.3 7.5 2.3S11 3 12.5 4.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
        </svg>
        <div className="flex items-center">
          <div className="flex items-center px-[2px]" style={{ width: 23, height: 12, border: `1.5px solid ${color}`, borderRadius: 3 }}>
            <div style={{ width: 14, height: 8, background: color, borderRadius: 1.5 }} />
          </div>
          <div style={{ width: 2, height: 5, background: color, opacity: 0.5, borderRadius: "0 1px 1px 0", marginLeft: -1 }} />
        </div>
      </div>
    </div>
  );
}