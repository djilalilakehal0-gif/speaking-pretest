package com.ecoleeyes.device

/** Phone settings pages the assistant can open (Android forbids apps from changing these settings directly). */
enum class SettingsKind { GENERAL, WIFI, BLUETOOTH, ACCESSIBILITY, SOUND, DISPLAY, LOCATION }

data class InstalledApp(val label: String, val packageName: String)
data class PhoneContact(val name: String, val number: String)
data class NotificationItem(val app: String, val title: String, val text: String, val postedAt: Long)

enum class CallOutcome {
    /** The call was placed (CALL_PHONE granted). */
    CALLING,
    /** The dialer opened with the number filled in; the user presses call. */
    DIALER_OPENED,
    FAILED,
}

/**
 * Everything ÉCOLE EYES can do to the rest of the phone. Only public, documented Android intents and APIs are used:
 * no AccessibilityService, no control of other apps' screens, no way around Android permissions.
 * Sensitive actions (calls) are confirmed aloud by the controller BEFORE they reach this interface.
 */
interface DeviceActions {
    /** Apps that appear in the launcher. */
    fun launchableApps(): List<InstalledApp>
    fun launch(app: InstalledApp): Boolean
    fun setAlarm(time: ClockTime, label: String?): Boolean
    fun setTimer(seconds: Int, label: String?): Boolean
    /** Places the call if CALL_PHONE is granted, otherwise opens the dialer with the number. */
    fun call(number: String): CallOutcome
    /** Requires READ_CONTACTS (the controller asks for it, aloud, first). */
    suspend fun contacts(): List<PhoneContact>
    fun batteryPercent(): Int?
    fun isCharging(): Boolean?
    fun openSystemSettings(kind: SettingsKind): Boolean
    /** The user must enable notification access once, in Android settings. */
    fun notificationAccessGranted(): Boolean
    fun openNotificationAccessSettings(): Boolean
    /** Newest first. Kept in memory only; never stored or uploaded unless the user asks the AI about them. */
    fun recentNotifications(): List<NotificationItem>
}
