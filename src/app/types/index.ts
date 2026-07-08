// src/app/types/index.ts
export type Screen =
  | "login" | "signup"
  | "bookshelf" | "diary"
  | "capsule" | "add"
  | "ai" | "friends" | "newdiary";

export interface Book {
  id: string; // number → string 으로 변경!
  title: string; subtitle: string;
  gradient: string; emoji: string; count: number;
  members: string[]; blank?: boolean;
}

export interface PolaroidDef {
  x: number; y: number; w: number; h: number; rot: number; caption: string; bg: string;
}

export interface DiaryPageDef {
  polaroids: PolaroidDef[];
  text: { x: number; y: number; content: string };
  date: string;
  washi: { x: number; y: number; text: string; color: string; rot: number } | null;
  deco: { x: number; y: number; emoji: string } | null;
}