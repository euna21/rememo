import { registerPlugin } from "@capacitor/core";

interface DiaryPluginInterface {
  openDiary(options: { pageCount: number }): Promise<void>;
  closeDiary(options: {}): Promise<void>;
  addListener(
    eventName: "pageSelected",
    listenerFunc: (data: { pageIndex: number }) => void
  ): Promise<any>;
  addListener(
    eventName: "diaryBack",
    listenerFunc: () => void
  ): Promise<any>;
}

const DiaryPlugin = registerPlugin<DiaryPluginInterface>("DiaryPlugin");

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

export const addDiaryBackListener = (callback: () => void) => {
  DiaryPlugin.addListener("diaryBack", () => {
    callback();
  });
};