package com.myapp.rememo

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "DiaryPlugin")
class DiaryPlugin : Plugin() {

    private var diaryView: DiaryBookView? = null

    @PluginMethod
    fun openDiary(call: PluginCall) {
        val pageCount = call.getInt("pageCount", 6) ?: 6
        val activity = activity

        activity.runOnUiThread {
            diaryView?.let {
                (it.parent as? android.view.ViewGroup)?.removeView(it)
            }

            val bookView = DiaryBookView(activity, pageCount) { pageIndex ->
                val ret = com.getcapacitor.JSObject()
                ret.put("pageIndex", pageIndex)
                notifyListeners("pageSelected", ret)
            }
            diaryView = bookView

            val rootView = activity.window.decorView.rootView as android.view.ViewGroup
            val params = android.view.ViewGroup.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.MATCH_PARENT
            )
            rootView.addView(bookView, params)
            call.resolve()
        }
    }

    @PluginMethod
    fun closeDiary(call: PluginCall) {
        activity.runOnUiThread {
            diaryView?.let {
                (it.parent as? android.view.ViewGroup)?.removeView(it)
                diaryView = null
            }
            call.resolve()
        }
    }
}