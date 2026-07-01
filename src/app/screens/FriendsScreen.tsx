import { useState, useEffect } from "react";
import { ChevronLeft, Search, Check, X } from "lucide-react";
// 파이어베이스 설정 (경로는 프로젝트에 맞게 수정해줘)
import { db, auth } from "../../firebase"; 
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc } from "firebase/firestore";

interface Friendship {
  id: string;
  status: 'pending' | 'accepted';
  senderId: string;
  receiverId: string;
  members: string[];
}
// 닉네임을 비동기로 불러오는 작은 컴포넌트
function FriendItem({ userId, onAccept, onDecline, isPending }: { userId: string, onAccept?: () => void, onDecline?: () => void, isPending: boolean }) {
  const [nickname, setNickname] = useState("로딩중...");

 useEffect(() => {
    const fetchUser = async () => {
      try {
        // 1. userId가 UID(문서 ID)일 경우 바로 접근
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setNickname(userSnap.data().name);
        } else {
          // 2. 만약 UID로 안 찾아진다면, 'id' 필드로 다시 검색 (방어 코드)
          const q = query(collection(db, "users"), where("id", "==", userId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            setNickname(querySnapshot.docs[0].data().name);
          } else {
            setNickname("알 수 없는 사용자");
          }
        }
      } catch (error) {
        console.error("닉네임 불러오기 실패:", error);
        setNickname("오류 발생");
      }
    };
    fetchUser();
  }, [userId]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border mb-2">
      <div className="flex-1 text-sm font-semibold">{nickname}</div>
      {isPending && (
        <div className="flex gap-2">
          <button onClick={onAccept} className="w-8 h-8 rounded-full bg-[#C8A97A] flex items-center justify-center"><Check size={14} /></button>
          <button onClick={onDecline} className="w-8 h-8 rounded-full bg-[#F0ECE4] flex items-center justify-center"><X size={14} /></button>
        </div>
      )}
      {!isPending && <button className="text-[10px] px-3 py-1.5 rounded-full border">앨범 보기</button>}
    </div>
  );
}
export default function FriendsScreen({ onBack }: { onBack: () => void }) {
  const [queryId, setQueryId] = useState("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const currentUser = auth.currentUser;

  // 1. 실시간 친구 데이터 불러오기
  useEffect(() => {
    if (!currentUser) return;

    // 친구 목록 구독 (내가 보냈거나 받은 것 중 accepted인 것)
    const q = query(collection(db, "friendships"), where("members", "array-contains", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
  // 2. doc.data()를 Friendship 타입으로 캐스팅 (as Friendship)
  const list = snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() as Omit<Friendship, 'id'> 
  }));
  
  setFriends(list.filter(f => f.status === "accepted"));
  setPendingRequests(list.filter(f => f.status === "pending" && f.receiverId === currentUser.uid));
});

    return () => unsubscribe();
  }, [currentUser]);

  // 2. 친구 신청 보내기
  const sendRequest = async () => {
  if (!currentUser || !queryId) return;

  try {
    // 1. 입력한 ID가 실제 존재하는지 users 컬렉션에서 찾기
    const userQuery = query(collection(db, "users"), where("id", "==", queryId));
    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
      alert("존재하지 않는 ID입니다.");
      return;
    }

    // 2. 실제 UID 가져오기
    const targetUserDoc = querySnapshot.docs[0];
    const targetUid = targetUserDoc.id; // 이게 진짜 UID!

    // 3. 내 자신에게 신청하는 것 방지
    if (targetUid === currentUser.uid) {
      alert("자기 자신에게는 신청할 수 없습니다.");
      return;
    }

    // 4. 친구 신청 데이터 생성
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

  // 3. 친구 수락
  const acceptRequest = async (docId: string) => {
    await updateDoc(doc(db, "friendships", docId), { status: "accepted" });
  };

  // 4. 친구 거절/삭제
  const deleteFriendship = async (docId: string) => {
    await deleteDoc(doc(db, "friendships", docId));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-3 pb-2">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(42,35,24,0.06)" }}>
          <ChevronLeft size={18} color="#2A2318" />
        </button>
        <h2 className="font-semibold" style={{ fontSize: 16, color: "#2A2318" }}>친구 관리</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {/* 검색 및 신청 */}
        <div className="flex gap-2 mb-5 mt-1">
          <input value={queryId} onChange={e => setQueryId(e.target.value)} placeholder="친구 ID 입력" className="flex-1 py-3 px-4 rounded-xl text-sm border" />
          <button onClick={sendRequest} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#4A3F33", color: "#F4F1EB" }}>신청</button>
        </div>

        {/* 받은 요청 */}
        {pendingRequests.length > 0 && (
          <div className="mb-5">
            <div className="text-[10px] uppercase mb-2" style={{ color: "#C8A97A" }}>받은 요청 ({pendingRequests.length})</div>
            {pendingRequests.map((p) => (
                <FriendItem key={p.id} userId={p.senderId} isPending={true} onAccept={() => acceptRequest(p.id)} onDecline={() => deleteFriendship(p.id)} />
                ))}
                
          </div>
        )}

        {/* 친구 목록 */}
        <div className="text-[10px] uppercase mb-2" style={{ color: "#7A7064" }}>내 친구 ({friends.length})</div>
        <div className="rounded-xl overflow-hidden border bg-white">
          {friends.map((f) => {
            const friendId = f.senderId === currentUser?.uid ? f.receiverId : f.senderId;
            return <FriendItem key={f.id} userId={friendId} isPending={false} />;
            })}
        </div>
      </div>
    </div>
  );
}