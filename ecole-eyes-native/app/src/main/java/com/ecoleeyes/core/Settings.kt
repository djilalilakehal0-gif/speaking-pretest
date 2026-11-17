package com.ecoleeyes.core

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.ecoleeyes.app.BuildConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** Whether the user agreed to send requests/photos/document text to the AI service. */
enum class Consent { UNKNOWN, GRANTED, DENIED }

data class AppSettings(
    val lang: Lang = Lang.default(),
    val speechRate: Float = 1.0f,       // 0.5 .. 2.0
    val speechVolume: Float = 1.0f,     // 0.2 .. 1.0 (on top of the system media volume)
    val consent: Consent = Consent.UNKNOWN,
    val preferOfflineStt: Boolean = false,
    val bargeIn: Boolean = false,
    val announceUploads: Boolean = true,
    val backendUrl: String = BuildConfig.BACKEND_URL,
    val appToken: String = BuildConfig.APP_TOKEN,
    val liveIntervalSec: Int = 6,
    val handsFree: Boolean = false,
    val onboardingDone: Boolean = false,
    /** Person to call in an emergency (chosen by the user). */
    val emergencyName: String = "",
    val emergencyNumber: String = "",
    /** Public emergency number to *dial* (never auto-called). 112 works on GSM phones in most countries; set the local one. */
    val emergencyServices: String = "112",
) {
    val cloudAllowed: Boolean get() = consent == Consent.GRANTED
    val backendConfigured: Boolean get() = backendUrl.startsWith("https://")
    val hasEmergencyContact: Boolean get() = emergencyNumber.any { it.isDigit() }
}

/** Settings are kept in EncryptedSharedPreferences (the token and URL are sensitive). */
class SettingsStore(context: Context) {
    private val prefs: SharedPreferences = open(context)
    private val _state = MutableStateFlow(load())
    val state: StateFlow<AppSettings> = _state.asStateFlow()
    val value: AppSettings get() = _state.value

    fun update(transform: (AppSettings) -> AppSettings) {
        val next = transform(_state.value).sanitized()
        _state.value = next
        prefs.edit()
            .putString("lang", next.lang.tag)
            .putFloat("rate", next.speechRate)
            .putFloat("volume", next.speechVolume)
            .putString("consent", next.consent.name)
            .putBoolean("offlineStt", next.preferOfflineStt)
            .putBoolean("bargeIn", next.bargeIn)
            .putBoolean("announce", next.announceUploads)
            .putString("backend", next.backendUrl)
            .putString("token", next.appToken)
            .putInt("liveSec", next.liveIntervalSec)
            .putBoolean("handsFree", next.handsFree)
            .putBoolean("onboarded", next.onboardingDone)
            .putString("emName", next.emergencyName)
            .putString("emNumber", next.emergencyNumber)
            .putString("emServices", next.emergencyServices)
            .apply()
    }

    private fun load(): AppSettings {
        val d = AppSettings()
        return AppSettings(
            lang = if (prefs.contains("lang")) Lang.fromTag(prefs.getString("lang", null)) else d.lang,
            speechRate = prefs.getFloat("rate", d.speechRate),
            speechVolume = prefs.getFloat("volume", d.speechVolume),
            consent = runCatching { Consent.valueOf(prefs.getString("consent", "UNKNOWN")!!) }.getOrDefault(Consent.UNKNOWN),
            preferOfflineStt = prefs.getBoolean("offlineStt", d.preferOfflineStt),
            bargeIn = prefs.getBoolean("bargeIn", d.bargeIn),
            announceUploads = prefs.getBoolean("announce", d.announceUploads),
            backendUrl = prefs.getString("backend", null) ?: d.backendUrl,
            appToken = prefs.getString("token", null) ?: d.appToken,
            liveIntervalSec = prefs.getInt("liveSec", d.liveIntervalSec),
            handsFree = prefs.getBoolean("handsFree", d.handsFree),
            onboardingDone = prefs.getBoolean("onboarded", d.onboardingDone),
            emergencyName = prefs.getString("emName", null) ?: d.emergencyName,
            emergencyNumber = prefs.getString("emNumber", null) ?: d.emergencyNumber,
            emergencyServices = prefs.getString("emServices", null) ?: d.emergencyServices,
        ).sanitized()
    }

    private companion object {
        fun open(context: Context): SharedPreferences = try {
            val key = MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
            EncryptedSharedPreferences.create(
                context, "ecoleeyes_secure", key,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        } catch (e: Exception) {
            // Keystore can fail on some broken devices; never crash a blind user's app for it.
            context.getSharedPreferences("ecoleeyes_fallback", Context.MODE_PRIVATE)
        }
    }
}

fun AppSettings.sanitized(): AppSettings = copy(
    speechRate = speechRate.coerceIn(0.5f, 2.0f),
    speechVolume = speechVolume.coerceIn(0.2f, 1.0f),
    backendUrl = backendUrl.trim().trimEnd('/'),
    appToken = appToken.trim(),
    liveIntervalSec = liveIntervalSec.coerceIn(4, 30),
    emergencyName = emergencyName.trim().take(80),
    emergencyNumber = emergencyNumber.filter { it.isDigit() || it == '+' || it == ' ' }.trim().take(24),
    emergencyServices = emergencyServices.filter { it.isDigit() }.take(6).ifEmpty { "112" },
)
