package com.ecoleeyes.device

import android.app.Notification
import android.content.pm.PackageManager
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Lets the user say "read my notifications". Android only binds this service after the user enables it in
 * Settings > Notification access; the app cannot enable it itself. Notifications are kept in memory only
 * (a short rolling list), never written to disk, and removed when dismissed.
 */
class NotificationReader : NotificationListenerService() {

    override fun onListenerConnected() {
        NotificationStore.clear()
        runCatching { activeNotifications }.getOrNull()?.sortedBy { it.postTime }?.forEach(::accept)
    }

    override fun onListenerDisconnected() = NotificationStore.clear()

    override fun onNotificationPosted(sbn: StatusBarNotification) = accept(sbn)

    override fun onNotificationRemoved(sbn: StatusBarNotification) = NotificationStore.remove(sbn.key)

    private fun accept(sbn: StatusBarNotification) {
        if (sbn.packageName == packageName) return
        val n = sbn.notification
        if (sbn.isOngoing || (n.flags and Notification.FLAG_GROUP_SUMMARY) != 0) return
        val extras = n.extras
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim().orEmpty()
        val text = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString()?.trim().orEmpty()
        if (title.isEmpty() && text.isEmpty()) return
        NotificationStore.put(sbn.key, NotificationItem(appLabel(sbn.packageName), title, text.take(400), sbn.postTime))
    }

    private fun appLabel(pkg: String): String = try {
        packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
    } catch (e: PackageManager.NameNotFoundException) { pkg.substringAfterLast('.') }
}

/** In-memory rolling list shared between [NotificationReader] and the assistant. Thread-safe. */
object NotificationStore {
    private const val MAX = 30
    private val map = LinkedHashMap<String, NotificationItem>()

    @Synchronized fun put(key: String, item: NotificationItem) {
        map.remove(key); map[key] = item
        while (map.size > MAX) map.remove(map.keys.first())
    }
    @Synchronized fun remove(key: String) { map.remove(key) }
    @Synchronized fun clear() = map.clear()
    @Synchronized fun items(): List<NotificationItem> = map.values.sortedByDescending { it.postedAt }
}
