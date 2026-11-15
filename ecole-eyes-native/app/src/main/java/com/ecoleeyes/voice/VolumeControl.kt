package com.ecoleeyes.voice

import android.content.Context
import android.media.AudioManager

/** "Increase the volume" / "decrease the volume": changes the phone's media volume, which the assistant speaks on. */
class VolumeControl(context: Context) {
    enum class Result { CHANGED, AT_LIMIT }

    private val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    fun change(up: Boolean): Result {
        val max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val cur = am.getStreamVolume(AudioManager.STREAM_MUSIC)
        val step = maxOf(1, max / 7)
        val target = (if (up) cur + step else cur - step).coerceIn(0, max)
        if (target == cur) return Result.AT_LIMIT
        am.setStreamVolume(AudioManager.STREAM_MUSIC, target, 0)
        return Result.CHANGED
    }
}
