package com.ecoleeyes.app

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import com.ecoleeyes.phone.AppEntry
import com.ecoleeyes.phone.Contact
import com.ecoleeyes.phone.FuzzyMatch
import com.ecoleeyes.phone.GeoPoint
import com.ecoleeyes.phone.Phone
import com.ecoleeyes.phone.ReminderScheduler
import com.ecoleeyes.vision.CameraHub
import com.ecoleeyes.vision.ColorNamer
import com.ecoleeyes.vision.LocalScene
import com.ecoleeyes.vision.LocalVision

/** Records every phone action instead of performing it. */
class FakePhone : Phone {
    val calls = ArrayList<String>()
    val dials = ArrayList<String>()
    val sms = ArrayList<Pair<String, String>>()
    val launched = ArrayList<String>()
    var contacts = listOf(Contact("Ahmed Benali", "0555123456"), Contact("Amina Haddad", "0666000111"), Contact("أحمد", "0777000222"))
    var apps = listOf(AppEntry("WhatsApp", "com.whatsapp"), AppEntry("Google Maps", "com.google.android.apps.maps"))
    var battery: Int? = 76
    var charging = false
    var location: GeoPoint? = GeoPoint(36.7538, 3.0588, 12f)
    var notificationAccess = false
    var openedNotificationSettings = 0

    override fun call(number: String): Boolean { calls += number; return true }
    override fun dial(number: String): Boolean { dials += number; return true }
    override fun composeSms(number: String, body: String): Boolean { sms += number to body; return true }
    override suspend fun findContacts(query: String) = FuzzyMatch.rank(query, contacts, { it.name }).map { it.first }
    override suspend fun installedApps() = apps
    override fun launch(app: AppEntry): Boolean { launched += app.packageName; return true }
    override fun batteryPercent() = battery
    override fun isCharging() = charging
    override suspend fun currentLocation(timeoutMs: Long) = location
    override fun notificationAccessGranted() = notificationAccess
    override fun openNotificationAccessSettings() { openedNotificationSettings++ }
}

class FakeReminders : ReminderScheduler {
    val scheduled = ArrayList<Pair<Int, String>>()
    override fun schedule(minutes: Int, text: String) { scheduled += minutes to text }
}

/** Returns a canned scene; colour analysis runs the real [ColorNamer] on the frame. */
class FakeVision(var scene: LocalScene) : LocalVision {
    var analyzed = 0
    override suspend fun analyze(bmp: Bitmap): LocalScene { analyzed++; return scene }
    override suspend fun color(bmp: Bitmap): ColorNamer.ColorResult {
        val px = IntArray(bmp.width * bmp.height)
        bmp.getPixels(px, 0, bmp.width, 0, 0, bmp.width, bmp.height)
        return ColorNamer.analyze(px, bmp.width, bmp.height)
    }
}

/** A camera that is always ready and "sees" a solid colour. */
class SolidCamera(context: Context, private val color: Int) : CameraHub(context) {
    init { markReady(true) }
    var captures = 0
    override suspend fun capture(): Bitmap {
        captures++
        return Bitmap.createBitmap(64, 64, Bitmap.Config.ARGB_8888).apply { eraseColor(color) }
    }
    companion object { val RED = Color.rgb(208, 16, 16) }
}
