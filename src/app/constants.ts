// constants.ts
import { Screen } from "./types/index"; // 💡 아까 types.ts 대신 index.ts로 바꿨다고 한 부분 적용!

export const NAV: { label: string; s: Screen }[] = [
  { label: "로그인", s: "login" }, { label: "회원가입", s: "signup" },
  { label: "책장", s: "bookshelf" }, { label: "다이어리", s: "diary" },
  { label: "캡슐", s: "capsule" }, { label: "기록추가", s: "add" },
  { label: "AI생성", s: "ai" }, { label: "친구", s: "friends" },
  { label: "새다이어리", s: "newdiary" },
  // 필요하다면 { label: "프로필", s: "profile" } 도 여기에 추가할 수 있어!
];