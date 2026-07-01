import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
// 1. 파이어베이스 인증 도구와 로그인 함수 불러오기
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const [showPw, setShowPw] = useState(false);
  
  // 2. 유저가 입력할 이메일과 비밀번호를 기억할 상태값 추가
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 3. 로그인 버튼을 눌렀을 때 실행될 함수
  const handleLoginSubmit = async () => {
    // 빈칸 확인
    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해 주세요!");
      return;
    }

    try {
      // 4. 파이어베이스에 로그인 요청
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("로그인 성공!", userCredential.user);
      
      // 5. 로그인 성공 시 메인 화면(다이어리)으로 이동하는 함수 실행
      onLogin();

    } catch (error: any) {
      // 에러 발생 시 안내창 띄우기
      console.error("로그인 실패:", error);
      alert("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(160deg,#1E1B16 0%,#2A2318 55%,#332C20 100%)" }}>
      {/* Hero area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="mb-4" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 11, letterSpacing: 8, color: "rgba(200,169,122,0.5)", textTransform: "uppercase" }}>
          BETA · v2.0
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, letterSpacing: 6, color: "#C8A97A", lineHeight: 1.15, textAlign: "center" }}>
          MEMORY<br />ARCHIVE
        </div>
        <div className="mt-3" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 12, color: "rgba(200,169,122,0.55)", letterSpacing: 2, textAlign: "center" }}>
          합동형 기억 아카이브
        </div>
        {/* Decorative capsule hint */}
        <div className="mt-10 flex flex-col items-center gap-2 opacity-60">
          <div style={{ width: 44, height: 64, background: "linear-gradient(155deg,#CEBBA0,#A08865)", borderRadius: "50% 50% 40% 40% / 30% 30% 20% 20%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🕰️</div>
          <div style={{ width: "62%", height: 8, background: "linear-gradient(90deg,#7B5C10,#D4A843,#7B5C10)", borderRadius: 4 }} />
        </div>
      </div>
      {/* Form card */}
      <div style={{ background: "#F4F1EB", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", boxShadow: "0 -20px 60px rgba(0,0,0,0.3)" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#2A2318", marginBottom: 4 }}>시작하기</h2>
        <p className="text-xs mb-5" style={{ color: "#7A7064" }}>함께한 기억을 보관하기 위해 로그인해주세요.</p>
        
        {/* 이메일 입력 영역 */}
        {[
          { label: "이메일", placeholder: "example@email.com", icon: <Mail size={14} color="#B0A898" />, type: "email" },
        ].map(f => (
          <div key={f.label} className="mb-3.5">
            <label className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A7064" }}>{f.label}</label>
            <div className="relative">
              <div className="absolute flex items-center" style={{ left: 13, top: "50%", transform: "translateY(-50%)" }}>{f.icon}</div>
              <input 
                type={f.type} 
                placeholder={f.placeholder} 
                // 6. 이메일 상태값 연결
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl outline-none"
                style={{ padding: "13px 14px 13px 36px", border: "1.5px solid #D5D0C5", background: "#fff", fontSize: 14, color: "#2A2318" }} 
              />
            </div>
          </div>
        ))}
        
        {/* 비밀번호 입력 영역 */}
        <div className="mb-5">
          <label className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A7064" }}>비밀번호</label>
          <div className="relative">
            <div className="absolute flex items-center" style={{ left: 13, top: "50%", transform: "translateY(-50%)" }}><Lock size={14} color="#B0A898" /></div>
            <input 
              type={showPw ? "text" : "password"} 
              placeholder="비밀번호 입력" 
              // 7. 비밀번호 상태값 연결
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl outline-none"
              style={{ padding: "13px 42px 13px 36px", border: "1.5px solid #D5D0C5", background: "#fff", fontSize: 14, color: "#2A2318" }} 
            />
            <button onClick={() => setShowPw(p => !p)} className="absolute flex items-center" style={{ right: 13, top: "50%", transform: "translateY(-50%)" }}>
              {showPw ? <EyeOff size={15} color="#B0A898" /> : <Eye size={15} color="#B0A898" />}
            </button>
          </div>
        </div>
        
        {/* 8. 버튼 클릭 시 handleLoginSubmit 실행되도록 변경 */}
        <button onClick={handleLoginSubmit} className="w-full py-3.5 rounded-[14px] font-bold text-sm mb-4 transition-transform active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB", boxShadow: "0 6px 20px rgba(0,0,0,0.16)", fontFamily: "'Noto Sans KR', sans-serif" }}>
          시작하기
        </button>
        <p onClick={onSignup} className="text-center text-xs cursor-pointer underline underline-offset-2" style={{ color: "#7A7064" }}>
          계정이 없으신가요? 회원가입하기
        </p>
      </div>
    </div>
  );
}