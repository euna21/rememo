// src/app/components/Sidebar.tsx
import { useState, useEffect } from "react";
import { Screen } from "../types";
// 1. 파이어베이스 인증 도구 불러오기 (경로는 본인 프로젝트에 맞게 수정 필요할 수 있음!)
import { auth } from "../../firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Sidebar({ activeScreen, onClose, onNavigate }: {
  activeScreen: Screen; onClose: () => void; onNavigate: (s: Screen) => void;
}) {
  // 2. 유저 정보를 담을 상태(State) 만들기
  const [userName, setUserName] = useState("로딩중...");
  const [userEmail, setUserEmail] = useState("");
  const [userInitial, setUserInitial] = useState("");

  // 3. 사이드바가 열릴 때 로그인된 유저 정보 가져오기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 닉네임이 설정되어 있지 않으면 이메일의 @ 앞부분을 이름으로 사용!
        const name = user.displayName || (user.email ? user.email.split("@")[0] : "사용자");
        setUserName(name);
        setUserEmail(user.email || "");
        setUserInitial(name.charAt(0).toUpperCase()); // 이름의 첫 글자를 따서 동그라미 아이콘에 넣기
      }
    });
    return () => unsubscribe();
  }, []);

  // 4. 로그아웃 기능 구현
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose(); // 사이드바 닫기
      onNavigate("login" as Screen); // 로그인 화면으로 쫓아내기(?)
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(5px)" }} />
      <div className="relative flex flex-col z-10" style={{ width: 280, height: "100%", background: "#1E1B16" }}
        onClick={e => e.stopPropagation()}>
        <div className="pt-16 px-5 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-center mb-5 tracking-[5px]"
            style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", color: "#C8A97A" }}>
            MEMORY ARCHIVE
          </div>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(0,0,0,0.3)" }}>
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#C8A97A,#A88550)", color: "#1E1B16", fontSize: 15 }}>
              {/* 가짜 데이터 '이' 대신 진짜 이니셜 출력 */}
              {userInitial}
            </div>
            <div>
              {/* 가짜 데이터 대신 진짜 이름과 이메일 출력 */}
              <div className="font-semibold text-sm" style={{ color: "#F4F1EB" }}>{userName}</div>
              <div className="text-xs mt-0.5" style={{ color: "#7A7064" }}>{userEmail}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 pt-2">
          {[
            { icon: "📚", label: "나의 책장", screen: "bookshelf" as Screen },
            { icon: "👥", label: "친구 관리", screen: "friends" as Screen, badge: 2 },
            { icon: "🔗", label: "초대 코드로 참여", screen: null as Screen | null },
          ].map(item => {
            const active = item.screen === activeScreen;
            return (
              <button key={item.label}
                onClick={() => { if (item.screen) { onNavigate(item.screen); } else { onClose(); } }}
                className="w-full flex items-center justify-between py-[17px] px-[26px] text-sm transition-all"
                style={{
                  color: active ? "#fff" : "#8A8278",
                  background: active ? "#332C22" : "transparent",
                  borderLeft: active ? "3px solid #C8A97A" : "3px solid transparent",
                  fontWeight: active ? 700 : 500,
                }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>{item.icon} {item.label}</span>
                {"badge" in item && item.badge ? (
                  <span className="text-white text-[10px] rounded-full px-2 py-0.5" style={{ background: "#e74c3c" }}>{item.badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
        {/* 5. 로그아웃 버튼에 handleLogout 함수 연결 */}
        <button className="flex items-center gap-3 px-[26px] py-4 text-sm w-full" onClick={handleLogout}
          style={{ color: "#8A8278", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          🚪 로그아웃
        </button>
      </div>
    </div>
  );
}