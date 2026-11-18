package com.ecoleeyes.device

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.BatteryManager
import android.provider.AlarmClock
import android.provider.ContactsContract
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** [DeviceActions] using public Android intents. Activities are started from the application context (the app is in front when the user speaks). */
class AndroidDeviceActions(private val context: Context) : DeviceActions {
    private val pm: PackageManager get() = context.packageManager

    private fun start(intent: Intent): Boolean = try {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        true
    } catch (e: ActivityNotFoundException) { false } catch (e: SecurityException) { false }

    override fun launchableApps(): List<InstalledApp> {
        val query = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        return pm.queryIntentActivities(query, 0)
            .filter { it.activityInfo.packageName != context.packageName }
            .map { InstalledApp(it.loadLabel(pm).toString(), it.activityInfo.packageName) }
            .distinctBy { it.packageName }
            .sortedBy { it.label.lowercase() }
    }

    override fun launch(app: InstalledApp): Boolean {
        val intent = pm.getLaunchIntentForPackage(app.packageName) ?: return false
        return start(intent)
    }

    override fun setAlarm(time: ClockTime, label: String?): Boolean = start(
        Intent(AlarmClock.ACTION_SET_ALARM)
            .putExtra(AlarmClock.EXTRA_HOUR, time.hour)
            .putExtra(AlarmClock.EXTRA_MINUTES, time.minute)
            .putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            .apply { if (!label.isNullOrBlank()) putExtra(AlarmClock.EXTRA_MESSAGE, label) },
    )

    override fun setTimer(seconds: Int, label: String?): Boolean = start(
        Intent(AlarmClock.ACTION_SET_TIMER)
            .putExtra(AlarmClock.EXTRA_LENGTH, seconds)
            .putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            .apply { if (!label.isNullOrBlank()) putExtra(AlarmClock.EXTRA_MESSAGE, label) },
    )

    override fun call(number: String): CallOutcome {
        val uri = Uri.fromParts("tel", number, null)
        val canCall = ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED
        if (canCall && start(Intent(Intent.ACTION_CALL, uri))) return CallOutcome.CALLING
        return if (start(Intent(Intent.ACTION_DIAL, uri))) CallOutcome.DIALER_OPENED else CallOutcome.FAILED
    }

    override suspend fun contacts(): List<PhoneContact> = withContext(Dispatchers.IO) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) return@withContext emptyList()
        val out = ArrayList<PhoneContact>()
        val projection = arrayOf(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER)
        try {
            context.contentResolver.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, projection, null, null, null)?.use { c ->
                while (c.moveToNext() && out.size < 5000) {
                    val name = c.getString(0) ?: continue
                    val num = c.getString(1) ?: continue
                    out += PhoneContact(name, num)
                }
            }
        } catch (e: SecurityException) { /* permission revoked meanwhile */ }
        out.distinctBy { it.name.lowercase() + "|" + it.number.filter(Char::isDigit) }
    }

    private val battery: BatteryManager? get() = context.getSystemService(BatteryManager::class.java)

    override fun batteryPercent(): Int? = battery?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)?.takeIf { it in 0..100 }

    override fun isCharging(): Boolean? = battery?.isCharging

    override fun openSystemSettings(kind: SettingsKind): Boolean = start(Intent(
        when (kind) {
            SettingsKind.GENERAL -> Settings.ACTION_SETTINGS
            SettingsKind.WIFI -> Settings.ACTION_WIFI_SETTINGS
            SettingsKind.BLUETOOTH -> Settings.ACTION_BLUETOOTH_SETTINGS
            SettingsKind.ACCESSIBILITY -> Settings.ACTION_ACCESSIBILITY_SETTINGS
            SettingsKind.SOUND -> Settings.ACTION_SOUND_SETTINGS
            SettingsKind.DISPLAY -> Settings.ACTION_DISPLAY_SETTINGS
            SettingsKind.LOCATION -> Settings.ACTION_LOCATION_SOURCE_SETTINGS
        },
    )) || (kind != SettingsKind.GENERAL && start(Intent(Settings.ACTION_SETTINGS)))

    override fun notificationAccessGranted(): Boolean =
        NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)

    override fun openNotificationAccessSettings(): Boolean {
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            val detail = Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
                .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, ComponentName(context, NotificationReader::class.java).flattenToString())
            if (start(detail)) return true
        }
        return start(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
    }

    override fun recentNotifications(): List<NotificationItem> = NotificationStore.items()
}
