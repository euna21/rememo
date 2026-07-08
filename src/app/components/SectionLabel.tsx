export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#7A7064" }}>
      {children}
    </div>
  );
}