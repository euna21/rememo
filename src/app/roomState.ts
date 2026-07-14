// src/app/roomState.ts
// App.tsx를 거치지 않고 화면끼리 "지금 만든 다이어리 / 내 역할" 정보를 공유하기 위한 저장소.
// 모듈은 앱에서 딱 한 번만 로드되기 때문에, 어디서 import하든 항상 같은 객체를 가리켜.
// (React Context 대신 쓰는 아주 가벼운 방법)

export type RoleAssignment = { name: string; icon: string; desc: string };

interface RoomState {
  roomId: string | null;
  title: string;
  emoji: string;
  gradient: string;
  myRoles: RoleAssignment[];                       // 내가 받은 역할(들)
  allAssignments: Record<string, RoleAssignment[]>; // 멤버 이름 -> 그 사람이 받은 역할(들)
}

export const roomState: RoomState = {
  roomId: null,
  title: "",
  emoji: "",
  gradient: "",
  myRoles: [],
  allAssignments: {},
};

// 5가지 역할 정의 (팀 규칙에 있던 그 역할들) — 여러 화면에서 같이 쓰니까 여기 둠
export const ROLES: RoleAssignment[] = [
  { name: "기록자", icon: "✍️", desc: "자막·문구·일기체 텍스트를 담당하는 역할" },
  { name: "촬영자", icon: "📸", desc: "사진과 영상을 담당하는 역할" },
  { name: "분위기 수집가", icon: "🌿", desc: "날씨·디테일·소품 사진을 수집하는 역할" },
  { name: "사운드 수집가", icon: "🎧", desc: "추천 BGM과 현장음 메모를 담당하는 역할" },
  { name: "대화 저장자", icon: "💬", desc: "그날 나눈 대화를 한마디씩 기록하는 역할" },
];

// 배열 무작위로 섞기 (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 멤버 이름 배열 -> 멤버별 역할 배정 결과
// 인원이 5명 이하면: 역할을 섞어서 순환 배분 (인원이 적으면 한 사람이 여러 개 받음)
// 인원이 5명보다 많으면: 역할 세트를 5명마다 다시 섞으며 한 명당 하나씩
export function assignRoles(members: string[]): Record<string, RoleAssignment[]> {
  const result: Record<string, RoleAssignment[]> = {};
  members.forEach(m => (result[m] = []));

  if (members.length <= ROLES.length) {
    const shuffledMembers = shuffle(members);
    shuffle(ROLES).forEach((role, i) => {
      result[shuffledMembers[i % shuffledMembers.length]].push(role);
    });
  } else {
    let cycle = shuffle(ROLES);
    members.forEach((m, i) => {
      if (i > 0 && i % ROLES.length === 0) cycle = shuffle(ROLES);
      result[m].push(cycle[i % ROLES.length]);
    });
  }
  return result;
}