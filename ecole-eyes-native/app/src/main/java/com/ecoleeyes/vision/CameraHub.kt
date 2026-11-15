package com.ecoleeyes.vision

import android.graphics.Bitmap
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.core.content.ContextCompat
import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class CameraException(val reason: Reason, cause: Throwable? = null) : Exception(reason.name, cause) {
    enum class Reason { NOT_READY, CAPTURE_FAILED }
}

/**
 * Bridge between the camera screen (which owns the CameraX session) and the assistant (which asks
 * for photos by voice). Photos are returned in memory only and never written to storage.
 */
class CameraHub(private val context: Context) {
    private val _ready = MutableStateFlow(false)
    val ready: StateFlow<Boolean> = _ready.asStateFlow()
    @Volatile private var imageCapture: ImageCapture? = null

    fun attach(capture: ImageCapture) { imageCapture = capture; _ready.value = true }
    fun detach() { imageCapture = null; _ready.value = false }

    suspend fun awaitReady(timeoutMs: Long): Boolean =
        ready.value || withTimeoutOrNull(timeoutMs) { ready.first { it } } == true

    suspend fun capture(): Bitmap {
        val cap = imageCapture ?: throw CameraException(CameraException.Reason.NOT_READY)
        return suspendCancellableCoroutine { cont ->
            cap.takePicture(ContextCompat.getMainExecutor(context), object : ImageCapture.OnImageCapturedCallback() {
                override fun onCaptureSuccess(image: ImageProxy) {
                    try {
                        val bmp = ImageUtil.rotate(image.toBitmap(), image.imageInfo.rotationDegrees)
                        cont.resume(bmp)
                    } catch (e: Exception) {
                        cont.resumeWithException(CameraException(CameraException.Reason.CAPTURE_FAILED, e))
                    } finally {
                        image.close()
                    }
                }
                override fun onError(exception: ImageCaptureException) {
                    cont.resumeWithException(CameraException(CameraException.Reason.CAPTURE_FAILED, exception))
                }
            })
        }
    }
}
