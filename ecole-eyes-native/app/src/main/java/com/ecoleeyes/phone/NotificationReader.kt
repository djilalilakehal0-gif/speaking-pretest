package com.ecoleeyes.phone

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class SpokenNotification(val key: String, val app: String, val title: String, val text: String, val time: Long)

/**
 * Lets the assistant read notifications aloud ("read my notifications"). Android only delivers notifications to
 * this service after the user turns it on in Settings > Notification access, and can revoke it there at any time.
 *
 * Privacy: notifications are kept in memory only (the last [MAX]), never written to storage, never sent to the AI.
 */
class NotificationReader : NotificationListenerService() {

    override fun onListenerConnected() {
        runCatching { activeNotifications?.forEach { add(it) } }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) = add(sbn)

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        _items.value = _items.value.filterNot { it.key == sbn.key }
    }

    override fun onListenerDisconnected() { _items.value = emptyList() }

    private fun add(sbn: StatusBarNotification) {
        if (sbn.packageName == packageName) return
        val n = sbn.notification ?: return
        if (sbn.isOngoing || n.flags and Notification.FLAG_GROUP_SUMMARY != 0) return
        val ex = n.extras ?: return
        val title = ex.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty().trim()
        val text = (ex.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: ex.getCharSequence(Notification.EXTRA_TEXT))?.toString().orEmpty().trim()
        if (title.isEmpty() && text.isEmpty()) return
        val app = runCatching { packageManager.getApplicationLabel(packageManager.getApplicationInfo(sbn.packageName, 0)).toString() }.getOrDefault(sbn.packageName)
        val item = SpokenNotification(sbn.key, app, title, text.take(400), sbn.postTime)
        _items.value = (listOf(item) + _items.value.filterNot { it.key == sbn.key }).take(MAX)
    }

    companion object {
        const val MAX = 20
        private val _items = MutableStateFlow<List<SpokenNotification>>(emptyList())
        val items: StateFlow<List<SpokenNotification>> = _items.asStateFlow()
    }
}
