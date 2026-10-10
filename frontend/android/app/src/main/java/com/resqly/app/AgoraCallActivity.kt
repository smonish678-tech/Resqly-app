package com.resqly.app

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.SurfaceView
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import io.agora.rtc2.ChannelMediaOptions
import io.agora.rtc2.Constants
import io.agora.rtc2.IRtcEngineEventHandler
import io.agora.rtc2.RtcEngine
import io.agora.rtc2.RtcEngineConfig
import io.agora.rtc2.VideoCanvas
import io.agora.rtc2.VideoEncoderConfiguration
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.time.Instant

/**
 * Native 1-to-1 Agora room. App ID and short-lived token come from the authenticated
 * backend; the App Certificate never enters the Android app.
 */
class AgoraCallActivity : AppCompatActivity() {
    companion object {
        const val EXTRA_APP_ID = "agora_app_id"
        const val EXTRA_RTC_TOKEN = "agora_rtc_token"
        const val EXTRA_CHANNEL = "agora_channel"
        const val EXTRA_UID = "agora_uid"
        const val EXTRA_CONSULTATION_ID = "consultation_id"
        const val EXTRA_API_BASE = "api_base"
        const val EXTRA_AUTH_TOKEN = "auth_token"
        const val EXTRA_PARTICIPANT_ROLE = "participant_role"
        const val EXTRA_JOIN_DEADLINE = "join_deadline"
        const val EXTRA_CONSULTATION_STATUS = "consultation_status"
        private const val PERMISSION_REQUEST_CODE = 8804
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var engine: RtcEngine? = null
    private var localSurface: SurfaceView? = null
    private var remoteSurface: SurfaceView? = null
    private var root: FrameLayout? = null
    private var statusLabel: TextView? = null
    private var micButton: Button? = null
    private var cameraButton: Button? = null
    private var speakerButton: Button? = null
    private var cameraEnabled = true
    private var micMuted = false
    private var speakerEnabled = true
    private var localJoined = false
    private var remoteUid: Int? = null
    private var callEnded = false
    private var token: String = ""
    private var appId: String = ""
    private var channel: String = ""
    private var uid: Int = 0
    private var consultationId: String = ""
    private var apiBase: String = ""
    private var authToken: String = ""
    private var participantRole: String = ""
    private var joinDeadline: String = ""
    private var consultationStatus: String = "accepted"

    private val deadlineChecker = object : Runnable {
        override fun run() {
            if (callEnded) return
            if (consultationStatus == "accepted" && remoteUid == null && joinDeadline.isNotBlank()) {
                val deadlineMillis = try { Instant.parse(joinDeadline).toEpochMilli() } catch (_: Exception) { 0L }
                if (deadlineMillis > 0L && System.currentTimeMillis() >= deadlineMillis) {
                    statusLabel?.text = "The 5-minute join window has expired"
                    Toast.makeText(this@AgoraCallActivity, "The consultation join window expired.", Toast.LENGTH_LONG).show()
                    leaveCall()
                    return
                }
            }
            mainHandler.postDelayed(this, 1000)
        }
    }

    private val rtcHandler = object : IRtcEngineEventHandler() {
        override fun onJoinChannelSuccess(joinedChannel: String?, joinedUid: Int, elapsed: Int) {
            localJoined = true
            mainHandler.post {
                statusLabel?.text = if (remoteUid == null) "Connected · waiting for the other participant" else "Connected securely"
            }
            postRtcEvent("joined")
        }

        override fun onUserJoined(remoteUserId: Int, elapsed: Int) {
            remoteUid = remoteUserId
            mainHandler.post {
                attachRemoteVideo(remoteUserId)
                statusLabel?.text = "Both participants are connected"
            }
        }

        override fun onUserOffline(remoteUserId: Int, reason: Int) {
            if (remoteUid == remoteUserId) remoteUid = null
            mainHandler.post {
                remoteSurface?.let { view -> (view.parent as? FrameLayout)?.removeView(view) }
                remoteSurface = null
                statusLabel?.text = "The other participant disconnected · waiting to reconnect"
            }
        }

        override fun onTokenPrivilegeWillExpire(token: String?) {
            refreshRtcToken()
        }

        override fun onError(errorCode: Int) {
            mainHandler.post {
                statusLabel?.text = "Connection issue ($errorCode). Trying to recover…"
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.BLACK
        window.navigationBarColor = Color.BLACK
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        appId = intent.getStringExtra(EXTRA_APP_ID).orEmpty()
        token = intent.getStringExtra(EXTRA_RTC_TOKEN).orEmpty()
        channel = intent.getStringExtra(EXTRA_CHANNEL).orEmpty()
        uid = intent.getIntExtra(EXTRA_UID, 0)
        consultationId = intent.getStringExtra(EXTRA_CONSULTATION_ID).orEmpty()
        apiBase = intent.getStringExtra(EXTRA_API_BASE).orEmpty().trimEnd('/')
        authToken = intent.getStringExtra(EXTRA_AUTH_TOKEN).orEmpty()
        participantRole = intent.getStringExtra(EXTRA_PARTICIPANT_ROLE).orEmpty()
        joinDeadline = intent.getStringExtra(EXTRA_JOIN_DEADLINE).orEmpty()
        consultationStatus = intent.getStringExtra(EXTRA_CONSULTATION_STATUS).orEmpty().ifBlank { "accepted" }

        if (appId.isBlank() || token.isBlank() || channel.isBlank() || uid <= 0 ||
            consultationId.isBlank() || apiBase.isBlank() || authToken.isBlank()
        ) {
            Toast.makeText(this, "Secure call details are missing. Please reopen the consultation.", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        createCallLayout()
        if (hasCallPermissions()) {
            initializeAgora()
        } else {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    private fun hasCallPermissions(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != PERMISSION_REQUEST_CODE) return
        if (hasCallPermissions()) initializeAgora() else {
            Toast.makeText(this, "Camera and microphone permissions are needed for video consultation.", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    private fun createCallLayout() {
        val frame = FrameLayout(this).apply { setBackgroundColor(Color.rgb(9, 16, 29)) }
        root = frame
        setContentView(frame)
        ViewCompat.setOnApplyWindowInsetsListener(frame) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }

        val status = TextView(this).apply {
            text = "Preparing secure video…"
            setTextColor(Color.WHITE)
            textSize = 14f
            typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
            setPadding(dp(16), dp(12), dp(16), dp(12))
            setBackgroundColor(Color.argb(175, 13, 24, 42))
        }
        statusLabel = status
        frame.addView(status, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.TOP
        ))

        val localPreview = SurfaceView(this).apply {
            setBackgroundColor(Color.rgb(35, 47, 63))
            // Keep the local mini-preview above the full-screen remote SurfaceView.
            setZOrderMediaOverlay(true)
            elevation = dp(10).toFloat()
        }
        localSurface = localPreview
        frame.addView(localPreview, FrameLayout.LayoutParams(dp(118), dp(166), Gravity.TOP or Gravity.END).apply {
            topMargin = dp(66)
            marginEnd = dp(14)
        })

        val controls = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(14), dp(8), dp(16))
            setBackgroundColor(Color.argb(220, 9, 16, 29))
        }
        micButton = makeButton("Mute") { toggleMic() }
        cameraButton = makeButton("Camera off") { toggleCamera() }
        val flip = makeButton("Flip") { engine?.switchCamera() }
        speakerButton = makeButton("Speaker on") { toggleSpeaker() }
        val end = makeButton("Leave", Color.rgb(185, 28, 28)) { leaveCall() }
        listOf(micButton!!, cameraButton!!, flip, speakerButton!!, end).forEach { button ->
            controls.addView(button, LinearLayout.LayoutParams(0, dp(48), 1f).apply {
                leftMargin = dp(3)
                rightMargin = dp(3)
            })
        }
        frame.addView(controls, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM
        ))
    }

    private fun makeButton(label: String, color: Int = Color.rgb(39, 55, 78), action: () -> Unit): Button =
        Button(this).apply {
            text = label
            textSize = 10f
            isAllCaps = false
            setTextColor(Color.WHITE)
            setBackgroundColor(color)
            setOnClickListener { action() }
        }

    private fun initializeAgora() {
        try {
            val config = RtcEngineConfig().apply {
                mContext = applicationContext
                mAppId = appId
                mEventHandler = rtcHandler
                mChannelProfile = Constants.CHANNEL_PROFILE_COMMUNICATION
            }
            engine = RtcEngine.create(config)
            engine?.apply {
                enableAudio()
                enableVideo()
                setEnableSpeakerphone(true)
                setVideoEncoderConfiguration(
                    VideoEncoderConfiguration().apply {
                        dimensions = VideoEncoderConfiguration.VideoDimensions(640, 360)
                        frameRate = VideoEncoderConfiguration.FRAME_RATE.FRAME_RATE_FPS_24.value
                        bitrate = VideoEncoderConfiguration.STANDARD_BITRATE
                        orientationMode = VideoEncoderConfiguration.ORIENTATION_MODE.ORIENTATION_MODE_ADAPTIVE
                    }
                )
                setupLocalVideo(VideoCanvas(localSurface, VideoCanvas.RENDER_MODE_HIDDEN, uid))
                startPreview()
                val options = ChannelMediaOptions().apply {
                    clientRoleType = Constants.CLIENT_ROLE_BROADCASTER
                    channelProfile = Constants.CHANNEL_PROFILE_COMMUNICATION
                    publishMicrophoneTrack = true
                    publishCameraTrack = true
                    autoSubscribeAudio = true
                    autoSubscribeVideo = true
                }
                val result = joinChannel(token, channel, uid, options)
                if (result != 0) {
                    statusLabel?.text = "Could not start the call ($result)"
                    Toast.makeText(this@AgoraCallActivity, "Could not connect to Agora. Please try again.", Toast.LENGTH_LONG).show()
                } else {
                    statusLabel?.text = "Connecting securely…"
                    mainHandler.post(deadlineChecker)
                }
            }
        } catch (error: Exception) {
            statusLabel?.text = "Video service unavailable"
            Toast.makeText(this, "Video call could not start. Please try again.", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    private fun attachRemoteVideo(remoteUserId: Int) {
        val frame = root ?: return
        remoteSurface?.let { old -> (old.parent as? FrameLayout)?.removeView(old) }
        val view = SurfaceView(this).apply { setBackgroundColor(Color.BLACK) }
        remoteSurface = view
        frame.addView(view, 0, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
        ))
        engine?.setupRemoteVideo(VideoCanvas(view, VideoCanvas.RENDER_MODE_HIDDEN, remoteUserId))
        // Keep status and local preview over the remote surface.
        statusLabel?.bringToFront()
        localSurface?.bringToFront()
    }

    private fun toggleMic() {
        micMuted = !micMuted
        engine?.muteLocalAudioStream(micMuted)
        micButton?.text = if (micMuted) "Unmute" else "Mute"
    }

    private fun toggleCamera() {
        cameraEnabled = !cameraEnabled
        engine?.enableLocalVideo(cameraEnabled)
        cameraButton?.text = if (cameraEnabled) "Camera off" else "Camera on"
        localSurface?.visibility = if (cameraEnabled) View.VISIBLE else View.INVISIBLE
    }

    private fun toggleSpeaker() {
        speakerEnabled = !speakerEnabled
        engine?.setEnableSpeakerphone(speakerEnabled)
        speakerButton?.text = if (speakerEnabled) "Speaker on" else "Earpiece"
    }

    private fun postRtcEvent(event: String) {
        Thread {
            try {
                requestApi("POST", "/doctor-consultations/$consultationId/rtc/$event", JSONObject())
            } catch (error: Exception) {
                android.util.Log.w("ResqlyAgora", "Could not record RTC $event event", error)
                mainHandler.post { statusLabel?.text = "Call connected · syncing status…" }
            }
        }.start()
    }

    private fun refreshRtcToken() {
        Thread {
            try {
                val response = requestApi("GET", "/doctor-consultations/$consultationId/rtc-token")
                val renewed = response?.optString("token").orEmpty()
                if (renewed.isBlank()) throw IOException("Empty refreshed RTC token")
                token = renewed
                engine?.renewToken(renewed)
                mainHandler.post { statusLabel?.text = "Secure connection renewed" }
            } catch (error: Exception) {
                android.util.Log.e("ResqlyAgora", "RTC token renewal failed", error)
                mainHandler.post { statusLabel?.text = "Connection token expired. Please leave and rejoin." }
            }
        }.start()
    }

    @Throws(IOException::class)
    private fun requestApi(method: String, path: String, body: JSONObject? = null): JSONObject? {
        val connection = (URL(apiBase + path).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 5000
            readTimeout = 5000
            setRequestProperty("Authorization", "Bearer $authToken")
            setRequestProperty("Accept", "application/json")
            if (method == "POST") {
                setRequestProperty("Content-Type", "application/json")
                doOutput = true
            }
        }
        try {
            if (method == "POST") {
                connection.outputStream.use { it.write((body ?: JSONObject()).toString().toByteArray(StandardCharsets.UTF_8)) }
            }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader(StandardCharsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code !in 200..299) throw IOException("RTC API returned HTTP $code")
            return if (text.isBlank()) JSONObject() else JSONObject(text)
        } finally {
            connection.disconnect()
        }
    }

    private fun leaveCall() {
        if (callEnded) return
        callEnded = true
        statusLabel?.text = "Leaving secure call…"
        mainHandler.removeCallbacks(deadlineChecker)
        engine?.apply {
            stopPreview()
            leaveChannel()
        }
        Thread {
            try {
                requestApi("POST", "/doctor-consultations/$consultationId/rtc/left", JSONObject())
            } catch (error: Exception) {
                android.util.Log.w("ResqlyAgora", "Could not record RTC leave event", error)
            } finally {
                mainHandler.post { finish() }
            }
        }.start()
    }

    override fun onBackPressed() {
        leaveCall()
    }

    override fun onDestroy() {
        mainHandler.removeCallbacks(deadlineChecker)
        engine?.let {
            try { it.stopPreview() } catch (_: Exception) {}
            try { it.leaveChannel() } catch (_: Exception) {}
        }
        try { RtcEngine.destroy() } catch (_: Exception) {}
        engine = null
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        super.onDestroy()
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
