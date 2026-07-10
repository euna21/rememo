// src/app/screens/NewDiaryScreen.tsx
import { useState, useEffect } from "react";
import { ChevronLeft, Check, Dices } from "lucide-react";
import SectionLabel from "../components/SectionLabel";
import { auth, db } from "../../firebase";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { roomState, assignRoles } from "../roomState";

// 표지 테마 6종
const COVER_THEMES = [
  { emoji: "🌸", gradient: "linear-gradient(155deg,#9B8B7A,#6B5D4D)", label: "봄" },
  { emoji: "🌊", gradient: "linear-gradient(155deg,#4A7A8A,#2C5368)", label: "바다" },
  { emoji: "🍂", gradient: "linear-gradient(155deg,#A07850,#7B5830)", label: "가을" },
  { emoji: "🌙", gradient: "linear-gradient(155deg,#5A5D7A,#33364D)", label: "밤" },
  { emoji: "✈️", gradient: "linear-gradient(155deg,#7A8A6B,#4D5D40)", label: "여행" },
  { emoji: "🎂", gradient: "linear-gradient(155deg,#A0708A,#6B4055)", label: "기념일" },
];

// 아바타 색상 (실제 친구는 저장된 색이 없어서, 순서대로 돌려가며 씀)
const AVATAR_COLORS = ["#C8A97A", "#6B8BA4", "#9B8B7A", "#7B8A6B", "#A0708A"];

interface FriendInfo {
  uid: string;
  name: string;
}

export default function NewDiaryScreen({ onBack, onCreate }: { onBack: () => void; onCreate: () => void }) {
  const [title, setTitle] = useState("");
  const [themeIdx, setThemeIdx] = useState(0);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [friends, setFriends] = useState<FriendInfo[]>([]);

  const currentUser = auth.currentUser;
  const myName = currentUser?.displayName || "나";

  // 친구관리 화면과 똑같은 방식으로, 실제 "수락된" 친구만 실시간으로 불러오기
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "friendships"), where("members", "array-contains", currentUser.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const accepted = snapshot.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter(f => f.status === "accepted");

      const list: FriendInfo[] = [];
      for (const f of accepted) {
        const friendUid = f.senderId === currentUser.uid ? f.receiverId : f.senderId;
        try {
          const userSnap = await getDoc(doc(db, "users", friendUid));
          if (userSnap.exists()) {
            list.push({ uid: friendUid, name: userSnap.data().name || "이름 없음" });
          }
        } catch (error) {
          console.error("친구 정보 불러오기 실패:", error);
        }
      }
      setFriends(list);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const selectedFriends = friends.filter(f => selectedUids.includes(f.uid));
  const allMembers = [myName, ...selectedFriends.map(f => f.name)];
  const canCreate = title.trim().length > 0 && !creating;

  const toggleFriend = (uid: string) => {
    setSelectedUids(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const theme = COVER_THEMES[themeIdx];
      const assignments = assignRoles(allMembers);

      const docRef = await addDoc(collection(db, "rooms"), {
        title: title.trim(),
        emoji: theme.emoji,
        gradient: theme.gradient,
        ownerId: currentUser?.uid ?? null,
        members: allMembers,
        memberUids: [currentUser?.uid, ...selectedUids].filter(Boolean),
        assignments,
        createdAt: serverTimestamp(),
      });

      roomState.roomId = docRef.id;
      roomState.title = title.trim();
      roomState.emoji = theme.emoji;
      roomState.gradient = theme.gradient;
      roomState.myRoles = assignments[myName] ?? [];
      roomState.allAssignments = assignments;

      onCreate();
    } catch (error) {
      console.error("다이어리 생성 실패:", error);
      alert("다이어리 생성 중 문제가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-3 pb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(42,35,24,0.06)" }}>
          <ChevronLeft size={18} color="#2A2318" />
        </button>
        <h2 className="font-semibold" style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, color: "#2A2318" }}>새로운 다이어리</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: "none" }}>
        <p className="text-sm mb-5 mt-1" style={{ color: "#7A7064", lineHeight: 1.7 }}>
          방을 만들면 멤버 모두에게<br />
          역할이 <b style={{ color: "#A88550" }}>랜덤으로 배정</b>돼요.
        </p>

        <SectionLabel>다이어리 제목</SectionLabel>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="예: 2026 우리의 타이베이 기록"
          className="w-full rounded-xl px-4 py-3 mb-5 text-sm outline-none"
          style={{ border: "1.5px solid #D5D0C5", background: "#fff", color: "#2A2318" }}
          onFocus={e => e.currentTarget.style.borderColor = "#C8A97A"}
          onBlur={e => e.currentTarget.style.borderColor = "#D5D0C5"}
        />

        <SectionLabel>표지 테마</SectionLabel>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {COVER_THEMES.map((theme, i) => {
            const active = i === themeIdx;
            return (
              <button key={theme.label} onClick={() => setThemeIdx(i)}
                className="relative rounded-[12px] py-3 flex flex-col items-center gap-1 transition-all"
                style={{
                  background: theme.gradient,
                  border: active ? "2px solid #C8A97A" : "2px solid transparent",
                  boxShadow: active ? "0 4px 14px rgba(200,169,122,0.4)" : "none",
                  opacity: active ? 1 : 0.75,
                }}>
                {active && (
                  <span className="absolute top-1 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "#C8A97A" }}>
                    <Check size={10} color="#1E1B16" />
                  </span>
                )}
                <span style={{ fontSize: 20 }}>{theme.emoji}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{theme.label}</span>
              </button>
            );
          })}
        </div>

        <SectionLabel>함께할 친구 초대</SectionLabel>
        {friends.length === 0 ? (
          <div className="rounded-xl p-4 mb-4 text-center text-xs" style={{ border: "1.5px solid #E5E0D8", background: "#fff", color: "#7A7064" }}>
            아직 친구가 없어요. 친구 관리에서 먼저 친구를 추가해주세요.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1.5px solid #E5E0D8", background: "#fff" }}>
            {friends.map((f, i) => {
              const active = selectedUids.includes(f.uid);
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div key={f.uid} onClick={() => toggleFriend(f.uid)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    borderBottom: i < friends.length - 1 ? "1px solid #F0ECE4" : "none",
                    background: active ? "rgba(200,169,122,0.07)" : "transparent",
                  }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${color}28`, color }}>{f.name[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: "#2A2318" }}>{f.name}</div>
                  </div>
                  <div className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ width: 20, height: 20, background: active ? "#C8A97A" : "transparent", border: `1.5px solid ${active ? "#C8A97A" : "#D5D0C5"}` }}>
                    {active && <Check size={11} color="#1E1B16" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
          style={{ border: "1px dashed rgba(200,169,122,0.5)", background: "rgba(200,169,122,0.05)" }}>
          <Dices size={18} color="#A88550" style={{ flexShrink: 0, marginTop: 1 }} />
          <div className="text-xs" style={{ color: "#7A7064", lineHeight: 1.7 }}>
            <b style={{ color: "#A88550" }}>멤버 {allMembers.length}명</b> ({allMembers.join(", ")})에게 방 생성과 동시에 서로 다른 역할이 무작위로 배정됩니다.
          </div>
        </div>

        <button onClick={handleCreate} disabled={!canCreate}
          className="w-full py-4 rounded-[14px] font-bold flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#6B5D4D,#4A3F33)", color: "#F4F1EB", boxShadow: "0 6px 20px rgba(0,0,0,0.16)", fontSize: 15, opacity: canCreate ? 1 : 0.45, transition: "opacity 0.2s" }}>
          {creating ? "방을 만드는 중..." : "다이어리 생성하기 ✦"}
        </button>
      </div>
    </div>
  );
}