import { useState, useEffect } from "react";
import { ChevronLeft, Check, X } from "lucide-react";
// 파이어베이스 설정 (경로는 프로젝트에 맞게 유지)
import { db, auth } from "../../firebase"; 
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc } from "firebase/firestore";

interface Friendship {
  id: string;
  status: 'pending' | 'accepted';
  senderId: string;
  receiverId: string;
  members: string[];
}

// 🌟 개별 친구 아이템 컴포넌트 (UI 업그레이드!)
function FriendItem({ userId, onAccept, onDecline, onDelete, isPending }: { userId: string, onAccept?: () => void, onDecline?: () => void, onDelete?: () => void, isPending: boolean }) {
  const [nickname, setNickname] = useState("로딩중...");
  const [displayId, setDisplayId] = useState(""); // @아이디 출력을 위한 상태 추가

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setNickname(userSnap.data().name);
          setDisplayId(userSnap.data().id || "알수없음");
        } else {
          const q = query(collection(db, "users"), where("id", "==", userId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            setNickname(querySnapshot.docs[0].data().name);
            setDisplayId(querySnapshot.docs[0].data().id || "알수없음");
          } else {
            setNickname("알 수 없는 사용자");
          }
        }
      } catch (error) {
        console.error("에러 발생:", error);
      }
    };
    fetchUser();
  }, [userId]);

  // 프로필 아바타에 들어갈 첫 글자 추출
  const avatarChar = nickname !== "로딩중..." && nickname !== "알 수 없는 사용자" ? nickname.charAt(0) : "?";

  return (
    <div className="flex items-center justify-between p-4 bg-white">
      {/* 왼쪽: 동그란 프로필, 이름, 아이디 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[15px]" style={{ backgroundColor: "#A08865" }}>
          {avatarChar}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#2A2318]">{nickname}</span>
          <span className="text-[11px] text-[#A69B8D] mt-0.5">@{displayId || userId.substring(0, 6)}</span>
        </div>
      </div>

      {/* 오른쪽: 상태에 따른 버튼들 */}
      {isPending ? (
        <div className="flex gap-1.5">
          <button onClick={onAccept} className="w-8 h-8 rounded-full bg-[#4A3F33] text-white flex items-center justify-center transition-transform active:scale-95"><Check size={14} /></button>
          <button onClick={onDecline} className="w-8 h-8 rounded-full border border-[#D5D0C5] text-[#7A7064] flex items-center justify-center transition-transform active:scale-95"><X size={14} /></button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <button className="px-3 py-1.5 rounded-full border border-[#D5D0C5] text-[10px] text-[#7A7064] bg-white transition-colors active:bg-[#F4F1EB]">
            앨범 보기
          </button>
          <button onClick={onDelete} className="px-3 py-1.5 rounded-full border border-[#FFD6D6] text-[10px] text-[#FF6B6B] bg-white transition-colors active:bg-[#FFF0F0]">
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

// 🌟 메인 친구 관리 화면 컴포넌트
export default function FriendsScreen({ onBack }: { onBack: () => void }) {
  const [queryId, setQueryId] = useState("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const currentUser = auth.currentUser;

  // 1. 실시간 친구 데이터 불러오기
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "friendships"), where("members", "array-contains", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Friendship, 'id'> }));
      setFriends(list.filter(f => f.status === "accepted"));
      setPendingRequests(list.filter(f => f.status === "pending" && f.receiverId === currentUser.uid));
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 2. 친구 신청 보내기
  const sendRequest = async () => {
    if (!currentUser || !queryId) return;
    try {
      const userQuery = query(collection(db, "users"), where("id", "==", queryId));
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        alert("존재하지 않는 ID입니다.");
        return;
      }

      const targetUid = querySnapshot.docs[0].id;
      if (targetUid === currentUser.uid) {
        alert("자기 자신에게는 신청할 수 없습니다.");
        return;
      }

      await addDoc(collection(db, "friendships"), {
        members: [currentUser.uid, targetUid],
        senderId: currentUser.uid,
        receiverId: targetUid,
        status: "pending"
      });

      setQueryId("");
      alert("친구 신청을 보냈습니다!");
    } catch (error) {
      console.error("신청 오류:", error);
      alert("신청 중 문제가 발생했습니다.");
    }
  };

  // 3. 친구 수락 / 4. 친구 거절 및 삭제
  const acceptRequest = async (docId: string) => updateDoc(doc(db, "friendships", docId), { status: "accepted" });
  const deleteFriendship = async (docId: string) => deleteDoc(doc(db, "friendships", docId));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F1EB] pt-4 pb-10"> 
      
      {/* 상단 헤더 영역 */}
      <div className="flex items-center px-6 pt-2 pb-4">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EAE6DF] text-[#7A7064] transition-transform active:scale-95">
          <ChevronLeft size={20} />
        </button>
        <h2 className="flex-1 text-center text-xl font-bold text-[#2A2318] pr-8" style={{ fontFamily: "'Noto Serif KR', serif" }}>
          친구 관리
        </h2>
      </div>

      <p className="text-center text-xs text-[#7A7064] mb-6">
        친구의 아이디를 검색해 친구 신청을 보내보세요.
      </p>

      <div className="flex-1 overflow-y-auto px-6 pb-5">
        
        {/* 친구 검색 입력칸 */}
        <div className="flex gap-2 mb-6">
          <input 
            value={queryId} 
            onChange={e => setQueryId(e.target.value)} 
            placeholder="친구 검색용 아이디" 
            className="flex-1 rounded-xl outline-none px-4 py-3 text-sm transition-all focus:border-[#A08865]"
            style={{ background: "#FFFFFF", border: "1.5px solid #D5D0C5", color: "#2A2318" }}
          />
          <button onClick={sendRequest} className="px-6 rounded-xl font-bold text-sm text-[#F4F1EB] transition-transform active:scale-95" style={{ background: "#4A3F33" }}>
            신청
          </button>
        </div>

        {/* 받은 요청 목록 */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <div className="text-center text-xs font-semibold text-[#7A7064] mt-2 mb-2">
              받은 요청 ({pendingRequests.length})
            </div>
            {/* [&>*:not(:last-child)]:border-b : 마지막 아이템 빼고 모두 밑줄 긋는 마법의 CSS! */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EAE6DF] [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-[#F4F1EB]">
              {pendingRequests.map((p) => (
                <FriendItem key={p.id} userId={p.senderId} isPending={true} onAccept={() => acceptRequest(p.id)} onDecline={() => deleteFriendship(p.id)} />
              ))}
            </div>
          </div>
        )}

        {/* 내 친구 목록 */}
        <div className="text-center text-xs font-semibold text-[#7A7064] mt-2 mb-2">
          내 친구 목록 ({friends.length})
        </div>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EAE6DF] [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-[#F4F1EB]">
          {friends.length === 0 ? (
             <div className="p-8 text-center text-sm text-[#A69B8D]">아직 추가된 친구가 없어요.</div>
          ) : (
            friends.map((f) => {
              const friendId = f.senderId === currentUser?.uid ? f.receiverId : f.senderId;
              return (
                <FriendItem 
                  key={f.id} 
                  userId={friendId} 
                  isPending={false} 
                  onDelete={() => deleteFriendship(f.id)} 
                />
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}