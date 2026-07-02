// src/app/components/Sidebar.tsx
import { useState, useEffect } from "react";
import { Screen } from "../types";
// 1. 파이어베이스 인증 도구 불러오기 (경로는 본인 프로젝트에 맞게 수정 필요할 수 있음!)
import { db, auth } from "../../firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Sidebar({ activeScreen, onClose, onNavigate }: {
  activeScreen: Screen; onClose: () => void; onNavigate: (s: Screen) => void;
}) {
  const [userName, setUserName] = useState("로딩중...");
  const [userEmail, setUserEmail] = useState("");
  const [userInitial, setUserInitial] = useState("");
  
  // 1. 실시간 알림 개수 상태 추가
  const [pendingCount, setPendingCount] = useState(0);
  // 3. 사이드바가 열릴 때 로그인된 유저 정보 가져오기
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const name = user.displayName || (user.email ? user.email.split("@")[0] : "사용자");
        setUserName(name);
        setUserEmail(user.email || "");
        setUserInitial(name.charAt(0).toUpperCase());

        // 2. 친구 요청 개수 실시간 구독
        const q = query(
          collection(db, "friendships"), 
          where("receiverId", "==", user.uid), 
          where("status", "==", "pending")
        );

        const unsubscribeFriends = onSnapshot(q, (snapshot) => {
          setPendingCount(snapshot.size); // 스냅샷의 문서 개수가 곧 요청 개수
        });

        return () => unsubscribeFriends();
      }
    });
    return () => unsubscribeAuth();
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
        <nav className="flex-1 pt-6"> {/* 상단 여백을 살짝 더 주어서 분리감을 줬어 */}
  {[
    { icon: "📚", label: "나의 책장", screen: "bookshelf" as Screen },
    { icon: "👥", label: "친구 관리", screen: "friends" as Screen, badge: pendingCount },
    { icon: "🔗", label: "초대 코드로 참여", screen: null as Screen | null },
  ].map(item => {
    const active = item.screen === activeScreen;
    return (
      <button key={item.label}
        onClick={() => { if (item.screen) { onNavigate(item.screen); } else { onClose(); } }}
        className="w-full flex items-center justify-between py-5 px-[26px] transition-all"
        style={{
          // 글자 색상을 더 밝고 선명하게 조정
          color: active ? "#FFFFFF" : "#D1CFC9", 
          background: active ? "#332C22" : "transparent",
          borderLeft: active ? "4px solid #C8A97A" : "4px solid transparent",
        }}>
        
        {/* 글자 크기를 16px로 키우고 폰트 무게를 더 확실하게 줬어 */}
        <span className="flex items-center gap-4 text-[16px]" style={{ fontWeight: active ? 700 : 600 }}>
          {item.icon} {item.label}
        </span>
        
        {/* 배지 디자인도 글씨가 잘 보이게 조정 */}
        {item.badge !== undefined && item.badge > 0 ? (
          <span className="text-white text-[12px] font-bold rounded-full px-2.5 py-0.5" 
                style={{ background: "#C8A97A", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
            {item.badge}
          </span>
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