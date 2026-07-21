import { registerPlugin } from "@capacitor/core";

const DiaryPlugin = registerPlugin("DiaryPlugin");

export const openNativeDiary = async (pageCount: number) => {
  try {
    await DiaryPlugin.openDiary({ pageCount });
  } catch (e) {
    console.error("DiaryPlugin error:", e);
  }
};

export const closeNativeDiary = async () => {
  try {
    await DiaryPlugin.closeDiary({});
  } catch (e) {
    console.error("DiaryPlugin error:", e);
  }
};

export const addPageSelectedListener = (callback: (pageIndex: number) => void) => {
  DiaryPlugin.addListener("pageSelected", (data: { pageIndex: number }) => {
    callback(data.pageIndex);
  });
};