package com.ecoleeyes.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.ecoleeyes.AppGraph
import com.ecoleeyes.app.R
import com.ecoleeyes.voice.Screen

@Composable
fun CameraScreen(graph: AppGraph) {
    val c = graph.controller
    val ui by c.state.collectAsState()
    val ctx = LocalContext.current
    var granted by remember { mutableStateOf(ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted = it }

    ScreenFrame(stringResource(R.string.screen_camera), onBack = { c.navigate(Screen.HOME) }) {
        Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                Modifier.weight(1f).fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(EeColors.Surface),
            ) {
                if (granted) {
                    CameraPreview(graph)
                } else {
                    Column(Modifier.padding(16.dp)) {
                        Text(stringResource(R.string.camera_permission_needed), style = MaterialTheme.typography.bodyLarge, color = EeColors.OnDark)
                        BigButton(stringResource(R.string.grant_permission), { launcher.launch(Manifest.permission.CAMERA) }, Modifier.fillMaxWidth().padding(top = 12.dp))
                    }
                }
            }
            BigButton(stringResource(R.string.camera_describe), c::describeNow, Modifier.fillMaxWidth(), Icons.Filled.RemoveRedEye)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
                BigButton(stringResource(R.string.camera_read_text), c::readTextNow, Modifier.weight(1f), Icons.Filled.TextFields, emphasized = false)
                BigButton(
                    stringResource(if (ui.live) R.string.camera_live_stop else R.string.camera_live_start), c::toggleLive, Modifier.weight(1f),
                    if (ui.live) Icons.Filled.VideocamOff else Icons.Filled.Videocam, emphasized = false,
                )
            }
        }
    }
}

@Composable
private fun CameraPreview(graph: AppGraph) {
    val ctx = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(ctx).apply { scaleType = PreviewView.ScaleType.FILL_CENTER } }
    val desc = stringResource(R.string.camera_preview_cd)

    DisposableEffect(lifecycle) {
        val future = ProcessCameraProvider.getInstance(ctx)
        var provider: ProcessCameraProvider? = null
        future.addListener({
            try {
                val p = future.get()
                provider = p
                val preview = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
                val capture = ImageCapture.Builder().setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY).build()
                p.unbindAll()
                p.bindToLifecycle(lifecycle, CameraSelector.DEFAULT_BACK_CAMERA, preview, capture)
                graph.camera.attach(capture)
            } catch (e: Exception) {
                graph.camera.detach()
            }
        }, ContextCompat.getMainExecutor(ctx))
        onDispose {
            graph.camera.detach()
            provider?.unbindAll()
        }
    }
    AndroidView({ previewView }, Modifier.fillMaxSize().semantics { contentDescription = desc })
}
