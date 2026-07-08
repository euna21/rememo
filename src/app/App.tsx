import { useState, useEffect } from "react";
import { Screen } from "./types";
import { TRACKS } from "./data/mockData"; // BOOKS는 이제 안 씀
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

// Components
import StatusBar from "./components/StatusBar";
import Sidebar from "./components/Sidebar";

// Screens
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import BookshelfScreen from "./screens/BookshelfScreen";
import DiaryScreen from "./screens/DiaryScreen";
import CapsuleScreen from "./screens/CapsuleScreen";
import AddScreen from "./screens/AddScreen";
import AiScreen from "./screens/AiScreen";
import FriendsScreen from "./screens/FriendsScreen";
import NewDiaryScreen from "./screens/NewDiaryScreen";
import ProfileScreen from "./screens/ProfileScreen";


export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [sidebar, setSidebar] = useState(false);
  const [bookIdx, setBookIdx] = useState(0);
  const [diaryPage, setDiaryPage] = useState(0);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [concept, setConcept] = useState("");
  const [entryText, setEntryText] = useState("");
  const [musicQ, setMusicQ] = useState("");
  const [selTracks, setSelTracks] = useState<number[]>([]);
  const [friendQ, setFriendQ] = useState("");
  const [psEnabled, setPsEnabled] = useState(false);

  // ✅ 여기 추가: Firestore rooms 실시간 구독
  const [books, setBooks] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const roomList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,          // ✅ 실제 Firestore 문서 ID
        ...docSnap.data(),       // title, emoji, gradient, count, members, pages, roles 등
      }));
      setBooks(roomList);
    });
    return () => unsub(); // 컴포넌트 사라질 때 구독 해제
  }, []);

  const toggleTrack = (i: number) =>
    setSelTracks(ts => ts.includes(i) ? ts.filter(x => x !== i) : ts.length < 3 ? [...ts, i] : ts);

  const isDarkScreen = screen === "login" || screen === "signup" || screen === "ai";

  const NAV: { label: string; s: Screen }[] = [
    { label: "로그인", s: "login" }, { label: "회원가입", s: "signup" },
    { label: "책장", s: "bookshelf" }, { label: "다이어리", s: "diary" },
    { label: "캡슐", s: "capsule" }, { label: "기록추가", s: "add" },
    { label: "AI생성", s: "ai" }, { label: "친구", s: "friends" },
    { label: "새다이어리", s: "newdiary" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-6"
      style={{ background: "radial-gradient(ellipse at 45% 35%,#C8C3B6 0%,#A8A39A 100%)", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`
        @keyframes capsuleShake {
          0%,100%{transform:translateX(0)}
          15%,45%,75%{transform:translateX(-8px) rotate(-3deg)}
          30%,60%,90%{transform:translateX(8px) rotate(3deg)}
        }
        @keyframes pulseFade {
          0%,100%{opacity:0.45} 50%{opacity:1}
        }
        @keyframes floatUp {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)}
        }
        .no-scroll::-webkit-scrollbar{display:none}
      `}</style>
      <div className="flex flex-col items-center gap-4">
        <p className="text-[11px] tracking-[5px] uppercase" style={{ fontFamily: "'DM Serif Display', serif", color: "#5A554E" }}>
          Memory Archive — Mobile Wireframe
        </p>
        
        {/* Phone */}
        <div className="relative overflow-hidden"
          style={{ width: 390, height: 844, borderRadius: 50, background: isDarkScreen ? "#1E1B16" : "#EAE6DF", boxShadow: "0 0 0 10px #2A2318,0 0 0 12px #3D372D,0 55px 130px rgba(0,0,0,0.58)" }}>
          <div className="absolute z-50" style={{ top: 0, left: "50%", transform: "translateX(-50%)", width: 126, height: 37, background: "#2A2318", borderRadius: "0 0 20px 20px" }} />
          <StatusBar dark={isDarkScreen} />
          
          {sidebar && (
            <Sidebar activeScreen={screen} onClose={() => setSidebar(false)}
              onNavigate={(s) => { setScreen(s); setSidebar(false); }} />
          )}
          
          {/* Screen content (라우팅 타워 역할) */}
          <div className="absolute inset-0 pt-[52px] flex flex-col">
            {screen === "login" && <LoginScreen onLogin={() => setScreen("bookshelf")} onSignup={() => setScreen("signup")} />}
            {screen === "signup" && <SignupScreen onSignup={() => setScreen("bookshelf")} onLogin={() => setScreen("login")} />}
            {screen === "bookshelf" && (
              <BookshelfScreen bookIdx={bookIdx}
                books={books}  // ✅ mock 대신 실제 데이터 전달 (BookshelfScreen도 수정 필요할 수 있음)
                onPrev={() => setBookIdx(i => Math.max(0, i - 1))}
                onNext={() => setBookIdx(i => Math.min(books.length - 1, i + 1))}
                onOpenDiary={() => setScreen("diary")}
                onMenuOpen={() => setSidebar(true)}
                onFriends={() => setScreen("friends")}
                onNewDiary={() => setScreen("newdiary")}
              />
            )}
            {screen === "diary" && books.length > 0 && (
              <DiaryScreen book={books[bookIdx] || books[0]} page={diaryPage}
                onPageChange={setDiaryPage}
                onBack={() => setScreen("bookshelf")}
                onAddRecord={() => setScreen("capsule")}
                bgmPlaying={bgmPlaying} trackIdx={trackIdx}
                onBgmToggle={() => setBgmPlaying(p => !p)}
                onPrevTrack={() => setTrackIdx(t => (t - 1 + TRACKS.length) % TRACKS.length)}
                onNextTrack={() => setTrackIdx(t => (t + 1) % TRACKS.length)}
              />
            )}
            {screen === "capsule" && <CapsuleScreen onClose={() => setScreen("diary")} onReveal={() => setScreen("add")} />}
            {screen === "add" && (
              <AddScreen text={entryText} onText={setEntryText}
                photoAdded={photoAdded} onPhoto={() => setPhotoAdded(p => !p)}
                concept={concept} onConcept={setConcept}
                musicQ={musicQ} onMusicQ={setMusicQ}
                selTracks={selTracks} onTrackToggle={toggleTrack}
                psEnabled={psEnabled} onPsToggle={() => setPsEnabled(p => !p)}
                onBack={() => setScreen("capsule")}
                onSave={() => setScreen("ai")}
              />
            )}
            {screen === "ai" && <AiScreen onFinish={() => setScreen("diary")} />}
            {screen === "friends" && <FriendsScreen onBack={() => setScreen("bookshelf")} />}
            {screen === "newdiary" && <NewDiaryScreen onBack={() => setScreen("bookshelf")} onCreate={() => setScreen("ai")} />}
            {screen === "profile" && (<ProfileScreen onBack={() => setScreen("bookshelf")} />)}
          </div>
          
          <div className="absolute rounded-full" style={{ bottom: 8, left: "50%", transform: "translateX(-50%)", width: 130, height: 5, background: isDarkScreen ? "rgba(200,169,122,0.2)" : "rgba(42,35,24,0.18)" }} />
        </div>
        
        {/* Nav pills */}
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
      </div>
    </div>
  );
}