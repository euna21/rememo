
import { openNativeDiary, closeNativeDiary, addPageSelectedListener, addDiaryBackListener } from "./components/DiaryNative";
import { Capacitor } from "@capacitor/core";
import { useState, useEffect } from "react";
import { Screen } from "./types";
import { TRACKS } from "./data/mockData";
import { db, auth } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import Sidebar from "./components/Sidebar";

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
  const [psEnabled, setPsEnabled] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user ? user.uid : null);
      if (user) setScreen("bookshelf");
      else setScreen("login");
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore 데이터 구독 (내가 초대된 다이어리만 보이도록 클라이언트에서 필터링)
  useEffect(() => {
    if (!currentUid) {
      setBooks([]);
      return;
    }
    const unsub = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const roomList = snapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter((room: any) => Array.isArray(room.memberUids) && room.memberUids.includes(currentUid));
      setBooks(roomList);
    });
    return () => unsub();
  }, [currentUid]);

  const toggleTrack = (i: number) =>
    setSelTracks(ts => ts.includes(i) ? ts.filter(x => x !== i) : ts.length < 3 ? [...ts, i] : ts);

  const isDarkScreen = screen === "login" || screen === "signup" || screen === "ai";

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
    <div className="h-screen w-full overflow-hidden relative flex flex-col"
      style={{ background: isDarkScreen ? "#1E1B16" : "#EAE6DF", fontFamily: "'Noto Sans KR', sans-serif" }}>

      <style>{`
        @keyframes capsuleShake { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-8px) rotate(-3deg)} 30%,60%,90%{transform:translateX(8px) rotate(3deg)} }
        @keyframes pulseFade { 0%,100%{opacity:0.45} 50%{opacity:1} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .no-scroll::-webkit-scrollbar{display:none}
      `}</style>

      {sidebar && (
        <Sidebar activeScreen={screen} onClose={() => setSidebar(false)} onNavigate={(s) => { setScreen(s); setSidebar(false); }} />
      )}

      {/* 알맹이(스크린) 화면: 실제 폰 화면 전체를 사용 */}
      <div className="absolute inset-0 flex flex-col">
        {screen === "login" && <LoginScreen onLogin={() => setScreen("bookshelf")} onSignup={() => setScreen("signup")} />}
        {screen === "signup" && <SignupScreen onSignup={() => setScreen("bookshelf")} onLogin={() => setScreen("login")} />}
        {screen === "bookshelf" && (
          <BookshelfScreen bookIdx={bookIdx} books={books}
            onPrev={() => setBookIdx(i => Math.max(0, i - 1))}
            onNext={() => setBookIdx(i => Math.min(books.length, i + 1))}
           onOpenDiary={() => {
  if (Capacitor.isNativePlatform()) {
    addPageSelectedListener((pageIdx) => {
      closeNativeDiary();
      setDiaryPage(pageIdx);
      setScreen("diary");
    });
    addDiaryBackListener(() => {
      setScreen("bookshelf");
    });
    openNativeDiary(3);
  } else {
    setDiaryPage(0);
    setScreen("diary");
  }
}}
            onMenuOpen={() => setSidebar(true)}
            onFriends={() => setScreen("friends")}
            onNewDiary={() => setScreen("newdiary")} />
        )}

        {/* 다이어리 화면 */}
{screen === "diary" && books.length > 0 && (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
    <DiaryScreen
      book={books[bookIdx] || books[0]}
      page={diaryPage}
      onPageChange={setDiaryPage}
      onBack={() => setScreen("bookshelf")}
      onAddRecord={() => setScreen("capsule")}
      bgmPlaying={bgmPlaying}
      trackIdx={trackIdx}
      onBgmToggle={() => setBgmPlaying(p => !p)}
      onPrevTrack={() => setTrackIdx(t => (t - 1 + TRACKS.length) % TRACKS.length)}
      onNextTrack={() => setTrackIdx(t => (t + 1) % TRACKS.length)}
    />
  </div>
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