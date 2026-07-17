import { useState, useEffect } from "react";
import { Screen } from "./types"; // 💡 에러가 났었다면 프로젝트 구조에 맞게 "./types" 또는 "./index"로 유지해줘!
import { TRACKS } from "./data/mockData";
import { db, auth } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Components
import StatusBar from "./components/StatusBar";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";

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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
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
  const [books, setBooks] = useState<any[]>([]);

  // 자동 로그인 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setScreen("bookshelf");
      else setScreen("login");
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore 데이터 구독
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const roomList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setBooks(roomList);
    });
    return () => unsub();
  }, []);

  const toggleTrack = (i: number) =>
    setSelTracks(ts => ts.includes(i) ? ts.filter(x => x !== i) : ts.length < 3 ? [...ts, i] : ts);

  const isDarkScreen = screen === "login" || screen === "signup" || screen === "ai";

  // 깜빡임 방지용 로딩 UI
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-6" 
           style={{ background: "radial-gradient(ellipse at 45% 35%,#C8C3B6 0%,#A8A39A 100%)" }}>
        
        <style>
          {`
            @keyframes strongPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.2; transform: scale(0.98); }
            }
          `}
        </style>

        {/* 🌟 텍스트를 're:memo'로 바꾸고, 글씨 크기(text-[28px])를 시원하게 키웠어! */}
        <p className="text-[28px] tracking-[6px] text-[#5A554E]" 
           style={{ 
             fontFamily: "'DM Serif Display', serif",
             animation: "strongPulse 1.5s ease-in-out infinite" 
           }}>
          re:memo
        </p>
      </div>
    );
  }

  return (
    // 🌟 1. 최상단 부모 태그 수정: 스크롤을 막고(overflow-hidden) 폰 화면에 꽉 차게(h-screen w-full) 변경
    <div className="h-screen w-full overflow-hidden relative flex flex-col"
      style={{ background: isDarkScreen ? "#1E1B16" : "#EAE6DF", fontFamily: "'Noto Sans KR', sans-serif" }}>
      
      {/* 🌟 2. 애니메이션 코드는 그대로 유지 */}
      <style>{`
        @keyframes capsuleShake { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-8px) rotate(-3deg)} 30%,60%,90%{transform:translateX(8px) rotate(3deg)} }
        @keyframes pulseFade { 0%,100%{opacity:0.45} 50%{opacity:1} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .no-scroll::-webkit-scrollbar{display:none}
      `}</style>
      
      {sidebar && (
        <Sidebar activeScreen={screen} onClose={() => setSidebar(false)} onNavigate={(s) => { setScreen(s); setSidebar(false); }} />
      )}
      
      {/* 🌟 3. 알맹이(스크린) 화면: 가짜 폰 테두리와 노치를 지우고 화면 전체를 쓰도록 수정 */}
      <div className="absolute inset-0 flex flex-col">
        {screen === "login" && <LoginScreen onLogin={() => setScreen("bookshelf")} onSignup={() => setScreen("signup")} />}
        {screen === "signup" && <SignupScreen onSignup={() => setScreen("bookshelf")} onLogin={() => setScreen("login")} />}
        {screen === "bookshelf" && ( 
          <BookshelfScreen bookIdx={bookIdx} books={books}
            onPrev={() => setBookIdx(i => Math.max(0, i - 1))}
            onNext={() => setBookIdx(i => Math.min(books.length, i + 1))}
            onOpenDiary={() => setScreen("diary")} onMenuOpen={() => setSidebar(true)}
            onFriends={() => setScreen("friends")} onNewDiary={() => setScreen("newdiary")} />
        )}
        {screen === "diary" && books.length > 0 && (
          <DiaryScreen book={books[bookIdx] || books[0]} page={diaryPage} onPageChange={setDiaryPage}
            onBack={() => setScreen("bookshelf")} onAddRecord={() => setScreen("capsule")}
            bgmPlaying={bgmPlaying} trackIdx={trackIdx} onBgmToggle={() => setBgmPlaying(p => !p)}
            onPrevTrack={() => setTrackIdx(t => (t - 1 + TRACKS.length) % TRACKS.length)}
            onNextTrack={() => setTrackIdx(t => (t + 1) % TRACKS.length)} />
        )}
        {screen === "capsule" && <CapsuleScreen onClose={() => setScreen("diary")} onReveal={() => setScreen("add")} />}
        {screen === "add" && (
          <AddScreen text={entryText} onText={setEntryText} photoAdded={photoAdded} onPhoto={() => setPhotoAdded(p => !p)}
            concept={concept} onConcept={setConcept} musicQ={musicQ} onMusicQ={setMusicQ}
            selTracks={selTracks} onTrackToggle={toggleTrack} psEnabled={psEnabled} onPsToggle={() => setPsEnabled(p => !p)}
            onBack={() => setScreen("capsule")} onSave={() => setScreen("ai")} />
        )}
        {screen === "ai" && <AiScreen onFinish={() => setScreen("diary")} />}
        {screen === "friends" && <FriendsScreen onBack={() => setScreen("bookshelf")} />}
        {screen === "newdiary" && <NewDiaryScreen onBack={() => setScreen("bookshelf")} onCreate={() => setScreen("capsule")} />}
        {screen === "profile" && <ProfileScreen onBack={() => setScreen("bookshelf")} />}
      </div>
      
    </div>
  );
}