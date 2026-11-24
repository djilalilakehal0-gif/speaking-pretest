package com.ecoleeyes.phone

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.provider.ContactsContract
import android.provider.Settings
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

data class Contact(val name: String, val number: String)
data class AppEntry(val label: String, val packageName: String)
data class GeoPoint(val lat: Double, val lng: Double, val accuracyM: Float?) {
    fun mapsLink() = "https://maps.google.com/?q=%.6f,%.6f".format(java.util.Locale.US, lat, lng)
}

/**
 * Everything the assistant does with the phone itself. Every action here is started by an explicit user request,
 * calls are confirmed aloud by the controller first, and nothing bypasses Android's own protections:
 * emergency numbers are only *dialled* (the user presses call), SMS are only *composed* (the user presses send).
 */
interface Phone {
    /** Places a call directly (CALL_PHONE granted) — only after spoken confirmation. */
    fun call(number: String): Boolean
    /** Opens the dialer with the number filled in; the user presses the call button. */
    fun dial(number: String): Boolean
    /** Opens the SMS app with recipient and text filled in; the user presses send. */
    fun composeSms(number: String, body: String): Boolean
    suspend fun findContacts(query: String): List<Contact>
    suspend fun installedApps(): List<AppEntry>
    fun launch(app: AppEntry): Boolean
    fun batteryPercent(): Int?
    fun isCharging(): Boolean
    suspend fun currentLocation(timeoutMs: Long = 8000): GeoPoint?
    fun notificationAccessGranted(): Boolean
    fun openNotificationAccessSettings()
}

class AndroidPhone(private val context: Context) : Phone {

    private fun start(intent: Intent): Boolean = try {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); true
    } catch (e: ActivityNotFoundException) { false } catch (e: SecurityException) { false }

    private fun granted(p: String) = ContextCompat.checkSelfPermission(context, p) == PackageManager.PERMISSION_GRANTED

    override fun call(number: String): Boolean =
        if (granted(Manifest.permission.CALL_PHONE)) start(Intent(Intent.ACTION_CALL, Uri.fromParts("tel", number, null))) else dial(number)

    override fun dial(number: String): Boolean = start(Intent(Intent.ACTION_DIAL, Uri.fromParts("tel", number, null)))

    override fun composeSms(number: String, body: String): Boolean =
        start(Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + Uri.encode(number))).putExtra("sms_body", body))

    override suspend fun findContacts(query: String): List<Contact> = withContext(Dispatchers.IO) {
        if (!granted(Manifest.permission.READ_CONTACTS)) return@withContext emptyList()
        val all = ArrayList<Contact>()
        val proj = arrayOf(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER)
        context.contentResolver.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, proj, null, null, null)?.use { c ->
            while (c.moveToNext()) {
                val name = c.getString(0) ?: continue
                val num = c.getString(1) ?: continue
                all += Contact(name, num)
            }
        }
        // One entry per person (the first number), best match first.
        FuzzyMatch.rank(query, all.distinctBy { it.name }, { it.name }, 5).map { it.first }
    }

    override suspend fun installedApps(): List<AppEntry> = withContext(Dispatchers.IO) {
        val pm = context.packageManager
        val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        @Suppress("DEPRECATION")
        pm.queryIntentActivities(launcher, 0)
            .map { AppEntry(it.loadLabel(pm).toString(), it.activityInfo.packageName) }
            .filter { it.packageName != context.packageName }
            .distinctBy { it.packageName }
    }

    override fun launch(app: AppEntry): Boolean {
        val i = context.packageManager.getLaunchIntentForPackage(app.packageName) ?: return false
        return start(i)
    }

    override fun batteryPercent(): Int? {
        val bm = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager ?: return null
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).takeIf { it in 0..100 }
    }

    override fun isCharging(): Boolean {
        val bm = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager ?: return false
        return bm.isCharging
    }

    @SuppressLint("MissingPermission") // checked just below
    override suspend fun currentLocation(timeoutMs: Long): GeoPoint? {
        val fine = granted(Manifest.permission.ACCESS_FINE_LOCATION)
        if (!fine && !granted(Manifest.permission.ACCESS_COARSE_LOCATION)) return null
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
        val providers = lm.getProviders(true)
        val fresh: Location? = if (Build.VERSION.SDK_INT >= 30) {
            val provider = when {
                fine && LocationManager.GPS_PROVIDER in providers -> LocationManager.GPS_PROVIDER
                LocationManager.NETWORK_PROVIDER in providers -> LocationManager.NETWORK_PROVIDER
                else -> providers.firstOrNull()
            }
            provider?.let { p ->
                withTimeoutOrNull(timeoutMs) {
                    suspendCancellableCoroutine { cont ->
                        val signal = android.os.CancellationSignal()
                        cont.invokeOnCancellation { signal.cancel() }
                        lm.getCurrentLocation(p, signal, ContextCompat.getMainExecutor(context)) { loc -> if (cont.isActive) cont.resume(loc) }
                    }
                }
            }
        } else null
        val loc = fresh ?: providers.mapNotNull { runCatching { lm.getLastKnownLocation(it) }.getOrNull() }.maxByOrNull { it.time }
        return loc?.let { GeoPoint(it.latitude, it.longitude, if (it.hasAccuracy()) it.accuracy else null) }
    }

    override fun notificationAccessGranted(): Boolean {
        val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners") ?: return false
        val me = ComponentName(context, NotificationReader::class.java).flattenToString()
        return flat.split(':').any { it == me }
    }

    override fun openNotificationAccessSettings() {
        start(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
    }
}
