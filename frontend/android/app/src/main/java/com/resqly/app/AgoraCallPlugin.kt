package com.resqly.app

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "AgoraCall")
class AgoraCallPlugin : Plugin() {

    @PluginMethod
    fun startCall(call: PluginCall) {
        val appId = call.getString("appId")?.trim().orEmpty()
        val token = call.getString("token")?.trim().orEmpty()
        val channel = call.getString("channel")?.trim().orEmpty()
        val uid = call.getInt("uid") ?: 0
        val consultationId = call.getString("consultationId")?.trim().orEmpty()
        val apiBase = call.getString("apiBase")?.trim().orEmpty()
        val authToken = call.getString("authToken")?.trim().orEmpty()

        if (appId.isBlank() || token.isBlank() || channel.isBlank() || uid <= 0 ||
            consultationId.isBlank() || apiBase.isBlank() || authToken.isBlank()
        ) {
            call.reject("Secure call details are missing. Please return to the consultation and try again.")
            return
        }

        val intent = Intent(activity, AgoraCallActivity::class.java).apply {
            putExtra(AgoraCallActivity.EXTRA_APP_ID, appId)
            putExtra(AgoraCallActivity.EXTRA_RTC_TOKEN, token)
            putExtra(AgoraCallActivity.EXTRA_CHANNEL, channel)
            putExtra(AgoraCallActivity.EXTRA_UID, uid)
            putExtra(AgoraCallActivity.EXTRA_CONSULTATION_ID, consultationId)
            putExtra(AgoraCallActivity.EXTRA_API_BASE, apiBase.trimEnd('/'))
            putExtra(AgoraCallActivity.EXTRA_AUTH_TOKEN, authToken)
            putExtra(AgoraCallActivity.EXTRA_PARTICIPANT_ROLE, call.getString("participantRole") ?: "")
            putExtra(AgoraCallActivity.EXTRA_JOIN_DEADLINE, call.getString("joinDeadline") ?: "")
            putExtra(AgoraCallActivity.EXTRA_CONSULTATION_STATUS, call.getString("consultationStatus") ?: "accepted")
        }

        try {
            activity.runOnUiThread {
                try {
                    activity.startActivity(intent)
                    call.resolve(JSObject().put("started", true))
                } catch (error: Exception) {
                    call.reject("Could not open the secure video room. Please try again.", error)
                }
            }
        } catch (error: Exception) {
            call.reject("Could not open the secure video room. Please try again.", error)
        }
    }
}
