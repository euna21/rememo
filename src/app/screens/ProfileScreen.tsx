import React, { useState, useEffect } from "react";
import { ChevronLeft, User } from "lucide-react";
import { auth, db } from "../../firebase"; // 본인 파일 경로에 맞게 수정
import { doc, getDoc } from "firebase/firestore";

export default function ProfileScreen({ onBack }: { onBack: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        // 'users' 컬렉션에서 내 정보 가져오기
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-[#7A7064]">정보를 불러오는 중...</div>;
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#F4F1EB" }}>
      
      {/* 상단 헤더 (뒤로가기) */}
      <div className="flex items-center px-5 py-5">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-[#7A7064] border border-[#E5DBC5]">
          <ChevronLeft size={20} />
        </button>
        <h2 className="ml-4 text-lg font-bold text-[#4A3F33]" style={{ fontFamily: "'Gowun Batang', serif" }}>
          내 프로필
        </h2>
      </div>

      {/* 프로필 카드 영역 */}
      <div className="flex-1 px-6 pt-4">
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-[#E5DBC5] flex flex-col items-center">
          
          {/* 프로필 사진 (사진이 없으면 기본 아이콘 표시) */}
          <div className="w-24 h-24 rounded-full mb-4 bg-[#F4F1EB] border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} color="#B0A898" />
            )}
          </div>

          {/* 이름과 아이디 */}
          <h3 className="text-xl font-bold text-[#2A2318] mb-1">
            {profile?.name || "이름 없음"}
          </h3>
          <p className="text-sm text-[#A69B8D] mb-8 font-medium">
            @{profile?.id || "id_unknown"}
          </p>

          {/* 상세 정보 리스트 */}
          <div className="w-full space-y-3">
            <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#F0EBE1]">
              <p className="text-[10px] text-[#A69B8D] font-bold uppercase tracking-wider mb-1">이메일</p>
              <p className="text-sm text-[#4A3F33] font-medium">{profile?.email || "이메일 정보 없음"}</p>
            </div>
            
            <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#F0EBE1]">
              <p className="text-[10px] text-[#A69B8D] font-bold uppercase tracking-wider mb-1">검색용 아이디</p>
              <p className="text-sm text-[#4A3F33] font-medium">{profile?.id || "아이디 정보 없음"}</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}