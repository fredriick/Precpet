package com.precpet.wearos.sensor

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import com.precpet.wearos.MainActivity
import com.precpet.wearos.R
import com.precpet.wearos.ble.PreceptBleServer
import com.precpet.wearos.session.SessionStore
import com.precpet.wearos.stream.PreceptMotionStreamer

/**
 * Foreground service that keeps the sensor + BLE server alive while the PWA is
 * tracking a session or the watch is recording offline. Started from the watch
 * UI (and can be started remotely by the PWA in a later phase).
 */
class MotionSensorService : Service() {
    private var bleServer: PreceptBleServer? = null

    override fun onCreate() {
        super.onCreate()
        bleServer = PreceptBleServer(this, SessionStore(sessionsDir(this)))
        bleServer?.start()
        PreceptMotionStreamer.start(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        PreceptMotionStreamer.stop()
        bleServer?.stop()
        bleServer = null
        super.onDestroy()
    }

    private fun buildNotification(): Notification {
        val launchIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE,
        )
        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("Precept")
            .setContentText("Streaming motion to your phone")
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentIntent(launchIntent)
            .setOngoing(true)
            .build()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Precept motion streaming",
                NotificationManager.IMPORTANCE_LOW,
            )
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }
    }

    companion object {
        private const val CHANNEL_ID = "precept_motion"
        private const val NOTIFICATION_ID = 1

        /** Shared with the recorder so the disk format == the BLE payload. */
        fun sessionsDir(context: Context): java.io.File =
            java.io.File(context.filesDir, "sessions")
    }
}
