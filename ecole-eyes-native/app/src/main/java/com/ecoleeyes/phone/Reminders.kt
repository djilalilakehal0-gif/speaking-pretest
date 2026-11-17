package com.ecoleeyes.phone

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.ecoleeyes.EcoleEyesApp
import com.ecoleeyes.app.R
import com.ecoleeyes.ui.MainActivity
import java.util.concurrent.TimeUnit

fun interface ReminderScheduler {
    fun schedule(minutes: Int, text: String)
}

/**
 * Reminders survive app restarts and reboots (WorkManager persists them). WorkManager may deliver a little late
 * when the phone is in deep battery saving; the user is told reminders are "about" on time.
 */
class WorkReminderScheduler(private val context: Context) : ReminderScheduler {
    override fun schedule(minutes: Int, text: String) {
        val req = OneTimeWorkRequestBuilder<ReminderWorker>()
            .setInitialDelay(minutes.toLong(), TimeUnit.MINUTES)
            .setInputData(workDataOf(ReminderWorker.KEY_TEXT to text))
            .addTag("reminder")
            .build()
        WorkManager.getInstance(context).enqueue(req)
    }
}

class ReminderWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val text = inputData.getString(KEY_TEXT).orEmpty()
        val app = applicationContext as? EcoleEyesApp
        val spoken = app?.graph?.controller?.reminderText(text) ?: text
        notify(applicationContext, spoken)
        // Also say it aloud (the user asked for this reminder). TalkBack users additionally hear the notification.
        runCatching { app?.graph?.controller?.announce(spoken) }
        return Result.success()
    }

    companion object {
        const val KEY_TEXT = "text"
        private const val CHANNEL = "reminders"

        fun notify(context: Context, text: String) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
                nm.createNotificationChannel(NotificationChannel(CHANNEL, context.getString(R.string.channel_reminders), NotificationManager.IMPORTANCE_HIGH))
            }
            if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
            val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
            val n = NotificationCompat.Builder(context, CHANNEL)
                .setSmallIcon(R.drawable.ic_launcher_monochrome)
                .setContentTitle(context.getString(R.string.app_name))
                .setContentText(text)
                .setStyle(NotificationCompat.BigTextStyle().bigText(text))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setContentIntent(open)
                .setAutoCancel(true)
                .build()
            runCatching { NotificationManagerCompat.from(context).notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), n) }
        }
    }
}
