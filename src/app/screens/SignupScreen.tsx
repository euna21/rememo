import React, { useState } from "react";
import { AtSign, User, Mail, Lock } from "lucide-react";
// 1. 파이어베이스 인증 도구 불러오기
import { auth, db } from "../../firebase"; 
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export default function SignupScreen({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  // 2. 유저가 입력하는 4가지 값을 하나의 상자(formData)에 담아서 기억하기
  const [formData, setFormData] = useState({
    id: "",
    nickname: "",
    email: "",
    password: ""
  });

  // 3. 가입 버튼을 눌렀을 때 실행될 로직
  const handleSignupSubmit = async () => {
    // 빈칸이 있는지 먼저 확인
    if (!formData.email || !formData.password || !formData.nickname) {
      alert("모든 정보를 입력해 주세요!");
      return;
    }

    try {
      // 4. 파이어베이스에 이메일과 비밀번호를 보내서 진짜 계정 만들기
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 5. 파이어베이스 계정 정보에 유저가 입력한 '닉네임' 추가로 저장해주기
      await updateProfile(userCredential.user, {
        displayName: formData.nickname
      });
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: formData.nickname,
        email: formData.email,
        id: formData.nickname, // 만약 아이디를 따로 입력받지 않는다면 닉네임을 ID로 사용
        createdAt: new Date()
      });

      console.log("회원가입 완료!", userCredential.user);
      alert(`${formData.nickname}님, 환영합니다!`);
      
      // 6. 성공하면 네가 만들어둔 onSignup 함수를 실행해서 다음 화면으로 넘기기
      onSignup();

    } catch (error: any) {
      // 에러 상황별로 친절한 안내 메시지 띄우기
      if (error.code === "auth/email-already-in-use") {
        alert("이미 가입된 이메일입니다.");
      } else if (error.code === "auth/weak-password") {
        alert("비밀번호는 6자리 이상으로 설정해 주세요.");
      } else {
        alert("가입 중 문제가 발생했습니다. 다시 시도해 주세요.");
      }
    }
  };

  // 기존 배열에 각 인풋을 구별할 'name' 속성을 추가했어!
  const fields = [
    { name: "id", label: "아이디 (검색용)", placeholder: "예: user123", icon: <AtSign size={14} color="#B0A898" />, type: "text" },
    { name: "nickname", label: "이름 / 닉네임", placeholder: "실명 또는 닉네임", icon: <User size={14} color="#B0A898" />, type: "text" },
    { name: "email", label: "이메일", placeholder: "example@email.com", icon: <Mail size={14} color="#B0A898" />, type: "email" },
    { name: "password", label: "비밀번호 (6자 이상)", placeholder: "비밀번호 입력", icon: <Lock size={14} color="#B0A898" />, type: "password" },
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
                <input 
                  type={f.type} 
                  placeholder={f.placeholder}
                  // 7. 입력창에 글자를 칠 때마다 formData 상자에 값 저장하기
                  value={formData[f.name as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                  className="w-full rounded-xl outline-none"
                  style={{ padding: "12px 14px 12px 36px", border: "1.5px solid #D5D0C5", background: "#fff", fontSize: 13, color: "#2A2318" }} 
                />
              </div>
            </div>
          ))}
          
          {/* 8. 버튼을 누르면 handleSignupSubmit 함수가 실행되도록 변경 */}
          <button onClick={handleSignupSubmit} className="w-full py-3.5 rounded-[14px] font-bold text-sm mt-2 mb-4"
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