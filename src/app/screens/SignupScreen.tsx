import { AtSign, User, Mail, Lock } from "lucide-react";

export default function SignupScreen({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  const fields = [
    { label: "아이디 (검색용)", placeholder: "예: user123", icon: <AtSign size={14} color="#B0A898" />, type: "text" },
    { label: "이름 / 닉네임", placeholder: "실명 또는 닉네임", icon: <User size={14} color="#B0A898" />, type: "text" },
    { label: "이메일", placeholder: "example@email.com", icon: <Mail size={14} color="#B0A898" />, type: "email" },
    { label: "비밀번호 (6자 이상)", placeholder: "비밀번호 입력", icon: <Lock size={14} color="#B0A898" />, type: "password" },
  ];
  return (
    <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(160deg,#1E1B16 0%,#2A2318 45%,#332C20 100%)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, letterSpacing: 6, color: "#C8A97A", textAlign: "center", marginBottom: 6 }}>
          JOIN US
        </div>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 12, color: "rgba(200,169,122,0.55)", letterSpacing: 2, textAlign: "center" }}>
          새로운 아카이브를 만듭니다.
        </div>
      </div>
      <div style={{ background: "#F4F1EB", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", boxShadow: "0 -20px 60px rgba(0,0,0,0.3)" }}>
        <div className="overflow-y-auto" style={{ maxHeight: 380, scrollbarWidth: "none" }}>
          {fields.map(f => (
            <div key={f.label} className="mb-3">
              <label className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A7064" }}>{f.label}</label>
              <div className="relative">
                <div className="absolute flex items-center" style={{ left: 13, top: "50%", transform: "translateY(-50%)" }}>{f.icon}</div>
                <input type={f.type} placeholder={f.placeholder} className="w-full rounded-xl outline-none"
                  style={{ padding: "12px 14px 12px 36px", border: "1.5px solid #D5D0C5", background: "#fff", fontSize: 13, color: "#2A2318" }} />
              </div>
            </div>
          ))}
          <button onClick={onSignup} className="w-full py-3.5 rounded-[14px] font-bold text-sm mt-2 mb-4"
            style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB", boxShadow: "0 6px 20px rgba(0,0,0,0.16)" }}>
            가입 완료
          </button>
          <p onClick={onLogin} className="text-center text-xs cursor-pointer underline underline-offset-2" style={{ color: "#7A7064" }}>
            이미 계정이 있으신가요? 로그인하기
          </p>
        </div>
      </div>
    </div>
  );
}