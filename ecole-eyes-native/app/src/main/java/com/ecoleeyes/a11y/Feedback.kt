package com.ecoleeyes.a11y

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/** Short sounds and vibration so a blind user always knows what state the app is in. */
class Feedback(private val context: Context) {
    enum class Cue { LISTEN_START, LISTEN_END, SUCCESS, ERROR, TAP }

    private val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
    } else {
        @Suppress("DEPRECATION") context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

    @Volatile var enabled = true

    fun cue(cue: Cue) {
        if (!enabled) return
        runCatching {
            when (cue) {
                Cue.LISTEN_START -> { tone(ToneGenerator.TONE_PROP_BEEP, 90); buzz(40) }
                Cue.LISTEN_END -> { tone(ToneGenerator.TONE_PROP_ACK, 90); buzz(25) }
                Cue.SUCCESS -> buzz(20)
                Cue.ERROR -> { tone(ToneGenerator.TONE_PROP_NACK, 160); buzzPattern(longArrayOf(0, 60, 60, 60)) }
                Cue.TAP -> buzz(15)
            }
        }
    }

    private fun tone(type: Int, ms: Int) {
        val g = ToneGenerator(AudioManager.STREAM_MUSIC, 60)
        g.startTone(type, ms)
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({ g.release() }, ms + 120L)
    }

    private fun buzz(ms: Long) {
        vibrator?.takeIf { it.hasVibrator() }?.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    private fun buzzPattern(p: LongArray) {
        vibrator?.takeIf { it.hasVibrator() }?.vibrate(VibrationEffect.createWaveform(p, -1))
    }
}
