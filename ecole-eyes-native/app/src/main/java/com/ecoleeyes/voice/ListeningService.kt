package com.ecoleeyes.voice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.ecoleeyes.EcoleEyesApp
import com.ecoleeyes.app.R
import com.ecoleeyes.core.L10n
import com.ecoleeyes.ui.MainActivity

/**
 * Foreground service that shows a persistent notification while hands-free listening is on.
 * The user starts and stops it; Android also lets the user stop it from the notification shade.
 *
 * Limits (also stated in the README): Android 14+ only allows a microphone foreground service to be
 * started while the app is visible, and the system may stop it to save battery. The service keeps the
 * process alive and visible; the actual listening loop runs in AssistantController.
 */
class ListeningService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            (application as EcoleEyesApp).graph.controller.setHandsFree(false)
            stopSelf()
            return START_NOT_STICKY
        }
        val lang = (application as EcoleEyesApp).graph.settings.value.lang
        val l10n = L10n(this)
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CHANNEL, l10n.str(lang, R.string.notif_channel), NotificationManager.IMPORTANCE_LOW))
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        val stop = PendingIntent.getService(this, 1, Intent(this, ListeningService::class.java).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE)
        val n: Notification = NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle(l10n.str(lang, R.string.notif_title))
            .setContentText(l10n.str(lang, R.string.notif_text))
            .setContentIntent(open)
            .addAction(0, l10n.str(lang, R.string.notif_stop), stop)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
        try {
            if (Build.VERSION.SDK_INT >= 30) startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE) else startForeground(ID, n)
        } catch (e: Exception) {
            // Android refused (e.g. started while the app is in the background): stay honest, switch the mode off.
            (application as EcoleEyesApp).graph.controller.setHandsFree(false)
            stopSelf()
        }
        return START_NOT_STICKY
    }

    companion object {
        private const val CHANNEL = "ecoleeyes_listening"
        private const val ID = 1001
        private const val ACTION_STOP = "com.ecoleeyes.STOP_LISTENING"

        fun start(context: Context) = ContextCompat.startForegroundService(context, Intent(context, ListeningService::class.java))
        fun stop(context: Context) { context.stopService(Intent(context, ListeningService::class.java)) }
    }
}
