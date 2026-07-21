import { openNativeDiary, addPageSelectedListener } from "./components/DiaryNative";
import { Capacitor } from "@capacitor/core";
import { useState, useEffect } from "react";
import { Screen } from "./types";
import { TRACKS } from "./data/mockData";
import { db, auth } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import StatusBar from "./components/StatusBar";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import Book3DViewer from "./components/Book3DViewer";

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
  const [showBook3D, setShowBook3D] = useState(true); // 다이어리 들어가면 3D 뷰 먼저 보여줌

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setScreen("bookshelf");
      else setScreen("login");
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8 px-6"
        style={{ background: "radial-gradient(ellipse at 45% 35%,#C8C3B6 0%,#A8A39A 100%)" }}>
        <p className="text-[12px] tracking-[5px] text-[#5A554E]" style={{ fontFamily: "'DM Serif Display', serif" }}>
          ARCHIVE LOADING...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-6"
      style={{ background: "radial-gradient(ellipse at 45% 35%,#C8C3B6 0%,#A8A39A 100%)", fontFamily: "'Noto Sans KR', sans-serif" }}>

      <style>{`
        @keyframes capsuleShake { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-8px) rotate(-3deg)} 30%,60%,90%{transform:translateX(8px) rotate(3deg)} }
        @keyframes pulseFade { 0%,100%{opacity:0.45} 50%{opacity:1} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
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
            <Sidebar activeScreen={screen} onClose={() => setSidebar(false)} onNavigate={(s) => { setScreen(s); setSidebar(false); }} />
          )}

          {/* Screen content */}
          <div className="absolute inset-0 pt-[52px] flex flex-col">
            {screen === "login" && <LoginScreen onLogin={() => setScreen("bookshelf")} onSignup={() => setScreen("signup")} />}
            {screen === "signup" && <SignupScreen onSignup={() => setScreen("bookshelf")} onLogin={() => setScreen("login")} />}
            {screen === "bookshelf" && (
              <BookshelfScreen bookIdx={bookIdx} books={books}
                onPrev={() => setBookIdx(i => Math.max(0, i - 1))}
                onNext={() => setBookIdx(i => Math.min(books.length, i + 1))}
                onOpenDiary={() => {
  if (Capacitor.isNativePlatform()) {
    // 네이티브 앱에서는 Kotlin OpenGL 뷰어 열기
    addPageSelectedListener((pageIdx) => {
      setDiaryPage(pageIdx);
      setScreen("diary");
      setShowBook3D(false);
    });
    openNativeDiary(3);
  } else {
    // 웹에서는 기존 방식
    setShowBook3D(true);
    setScreen("diary");
  }
}}
                onMenuOpen={() => setSidebar(true)}
                onFriends={() => setScreen("friends")}
                onNewDiary={() => setScreen("newdiary")} />
            )}

            {/* 다이어리 화면 */}
            {screen === "diary" && books.length > 0 && (
              <>
                {/* 3D 책 뷰어 */}
                {showBook3D && (
                  <Book3DViewer
                    pageCount={3}
                    onBack={() => setScreen("bookshelf")}
                    onPageSelect={(pageIdx) => {
                      setDiaryPage(pageIdx);
                      setShowBook3D(false);
                    }}
                  />
                )}

                {/* 페이지 편집 화면 */}
                {!showBook3D && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                    <DiaryScreen
                      book={books[bookIdx] || books[0]}
                      page={diaryPage}
                      onPageChange={setDiaryPage}
                      onBack={() => setShowBook3D(true)}
                      onAddRecord={() => setScreen("capsule")}
                      bgmPlaying={bgmPlaying}
                      trackIdx={trackIdx}
                      onBgmToggle={() => setBgmPlaying(p => !p)}
                      onPrevTrack={() => setTrackIdx(i => Math.max(0, i - 1))}
                      onNextTrack={() => setTrackIdx(i => Math.min(TRACKS.length - 1, i + 1))}
                    />
                    {/* 책 보기 버튼 */}
                    <button
                      onClick={() => setShowBook3D(true)}
                      style={{ position: "absolute", bottom: 90, right: 12, zIndex: 99, background: "#C8A97A", color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 11, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                      📖 책 보기
                    </button>
                  </div>
                )}
              </>
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

          <div className="absolute rounded-full" style={{ bottom: 8, left: "50%", transform: "translateX(-50%)", width: 130, height: 5, background: isDarkScreen ? "rgba(200,169,122,0.2)" : "rgba(42,35,24,0.18)" }} />
        </div>

        {/* 하단 네비게이션 */}
        <BottomNav screen={screen} setScreen={setScreen} />
      </div>
    </div>
  );
}