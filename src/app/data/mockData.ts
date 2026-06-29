// src/app/data/mockData.ts
import { Book, DiaryPageDef } from "../types";

export const BOOKS: Book[] = [
  { id: 1, title: "봄의 기억", subtitle: "Spring 2024", gradient: "linear-gradient(155deg,#9B8B7A,#6B5D4D)", emoji: "🌸", count: 12, members: ["민지", "준서"] },
  { id: 2, title: "여름 바다", subtitle: "Summer 2024", gradient: "linear-gradient(155deg,#4A7A8A,#2C5368)", emoji: "🌊", count: 8, members: ["소연", "민지", "현우"] },
  { id: 3, title: "가을 산책", subtitle: "Autumn 2024", gradient: "linear-gradient(155deg,#A07850,#7B5830)", emoji: "🍂", count: 15, members: ["준서"] },
  { id: 4, title: "", subtitle: "", gradient: "", emoji: "", count: 0, members: [], blank: true },
];

export const DIARY_PAGES: DiaryPageDef[] = [
  {
    polaroids: [
      { x: 10, y: 8, w: 128, h: 114, rot: -3.5, caption: "카페에서의 오후", bg: "#D4C9B8" },
      { x: 182, y: 12, w: 122, h: 106, rot: 2.8, caption: "창밖 풍경", bg: "#C8D4C0" },
    ],
    text: { x: 14, y: 164, content: "오늘도 이 카페에 왔다.\n햇살이 유독 따뜻했던 날." },
    date: "2024.03.15",
    washi: { x: 128, y: 156, text: "Spring arrived early", color: "rgba(200,169,122,0.85)", rot: -1.5 },
    deco: { x: 302, y: 162, emoji: "🌸" },
  },
  {
    polaroids: [
      { x: 48, y: 10, w: 210, h: 162, rot: 1.2, caption: "여름 바다 산책", bg: "#A8C4D4" },
    ],
    text: { x: 14, y: 198, content: "파도 소리가 이어폰 없이도\n내 머릿속을 가득 채우던 날." },
    date: "2024.07.22", washi: null,
    deco: { x: 300, y: 204, emoji: "🌊" },
  },
  {
    polaroids: [
      { x: 8, y: 8, w: 112, h: 88, rot: -2, caption: "단풍길", bg: "#D4B89A" },
      { x: 200, y: 20, w: 102, h: 78, rot: 3, caption: "카페 라떼", bg: "#C4B090" },
    ],
    text: { x: 15, y: 148, content: "가을은 항상 이별 같아서\n좋아하면서도 슬프다." },
    date: "2024.10.08",
    washi: { x: 118, y: 88, text: "Golden hour ✦", color: "rgba(160,120,60,0.78)", rot: 0 },
    deco: { x: 295, y: 150, emoji: "🍂" },
  },
];

export const PS_CONCEPTS = [
  { emoji: "🎬", name: "영화 포스터", desc: "시네마틱 필름 룩" },
  { emoji: "☕", name: "카페 감성", desc: "따뜻한 아날로그 톤" },
  { emoji: "📸", name: "잡지 화보", desc: "하이패션 매거진 스타일" },
  { emoji: "🌸", name: "봄 빈티지", desc: "소프트 파스텔 필름" },
  { emoji: "⚾", name: "야구장 직캠", desc: "KBO 응원 현장감" },
  { emoji: "🌙", name: "겨울 감성", desc: "쿨톤 시네마스코프" },
];

export const TRACKS = [
  { title: "Breezeblocks", artist: "alt-J", dur: "3:50" },
  { title: "Bloom", artist: "The Paper Kites", dur: "4:12" },
  { title: "무릎", artist: "IU", dur: "3:59" },
  { title: "Photograph", artist: "Ed Sheeran", dur: "4:17" },
];

export const FRIENDS = [
  { name: "박민지", id: "@minji_p", initial: "민", color: "#C8A97A" },
  { name: "김준서", id: "@junser.k", initial: "준", color: "#6B8BA4" },
  { name: "이소연", id: "@soyeon.i", initial: "소", color: "#9B8B7A" },
];

export const PENDING = [{ name: "최현우", id: "@hwwoo.c", initial: "현", color: "#7B8A6B" }];

export const AI_STEPS = [
  "✦ 기록들을 분석하는 중...",
  "✦ 레이아웃을 설계하는 중...",
  "✦ 사진 배치를 최적화하는 중...",
  "✦ 감성 요소를 추가하는 중...",
  "✦ 다이어리를 완성하는 중...",
];