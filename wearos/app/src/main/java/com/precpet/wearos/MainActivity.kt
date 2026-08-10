package com.precpet.wearos

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import com.precpet.wearos.sensor.MotionSensorService
import com.precpet.wearos.session.SessionRecorder
import com.precpet.wearos.session.SessionStore
import com.precpet.wearos.session.StoredSession
import com.precpet.wearos.stream.PreceptMotionStreamer
import kotlinx.coroutines.delay
import java.io.File

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                WatchScreen()
            }
        }
    }
}

private sealed interface WatchMode {
    data object Idle : WatchMode
    data object Streaming : WatchMode
    data class Recording(val startedAtMs: Long) : WatchMode
    data class Summary(val session: StoredSession) : WatchMode
}

@Composable
fun WatchScreen() {
    val context = LocalContext.current
    val store = remember { SessionStore(File(context.filesDir, "sessions")) }
    var mode by remember { mutableStateOf<WatchMode>(if (isServiceRunning(context)) WatchMode.Streaming else WatchMode.Idle) }
    var encoded by remember { mutableStateOf(0) }
    var elapsedSec by remember { mutableStateOf(0) }
    var samples by remember { mutableStateOf(0) }
    var reps by remember { mutableStateOf(0) }
    var savedCount by remember { mutableStateOf(0) }
    var lastSaved by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        savedCount = store.list().size
    }

    LaunchedEffect(mode) {
        when (val m = mode) {
            is WatchMode.Recording -> while (mode is WatchMode.Recording) {
                elapsedSec = ((System.currentTimeMillis() - m.startedAtMs) / 1000).toInt()
                samples = SessionRecorder.sampleCount
                reps = SessionRecorder.repCount
                delay(500)
            }
            WatchMode.Streaming -> while (mode == WatchMode.Streaming) {
                encoded = PreceptMotionStreamer.packetsEncoded
                delay(1000)
            }
            WatchMode.Idle -> Unit
            is WatchMode.Summary -> Unit
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(text = "Precept", style = MaterialTheme.typography.title1)
        Spacer(modifier = Modifier.height(8.dp))

        when (val m = mode) {
            WatchMode.Idle -> {
                Text(text = "Standby", style = MaterialTheme.typography.body2)
                if (savedCount > 0) {
                    Text(text = "Saved: $savedCount session${if (savedCount == 1) "" else "s"}", style = MaterialTheme.typography.body2)
                }
                lastSaved?.let {
                    Text(text = it, style = MaterialTheme.typography.body2)
                }
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = {
                    context.startForegroundService(Intent(context, MotionSensorService::class.java))
                    mode = WatchMode.Streaming
                }) {
                    Text("Stream to phone")
                }
                Button(onClick = {
                    SessionRecorder.start()
                    PreceptMotionStreamer.addPacketListener(SessionRecorder::record)
                    context.startForegroundService(Intent(context, MotionSensorService::class.java))
                    mode = WatchMode.Recording(System.currentTimeMillis())
                }) {
                    Text("Record offline")
                }
            }

            WatchMode.Streaming -> {
                Text(text = "Streaming motion", style = MaterialTheme.typography.body2)
                Text(text = "Encoded: $encoded packets", style = MaterialTheme.typography.body2)
                Text(text = "Keep your phone in range", style = MaterialTheme.typography.body2)
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = {
                    context.stopService(Intent(context, MotionSensorService::class.java))
                    mode = WatchMode.Idle
                }) {
                    Text("Stop")
                }
            }

            is WatchMode.Recording -> {
                Text(text = "Recording offline", style = MaterialTheme.typography.body2)
                Text(text = formatDuration(elapsedSec), style = MaterialTheme.typography.title1)
                Text(text = "$samples samples", style = MaterialTheme.typography.body2)
                if (reps > 0) {
                    Text(text = "$reps reps", style = MaterialTheme.typography.body2)
                }
                Text(text = "No phone needed", style = MaterialTheme.typography.body2)
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = {
                    PreceptMotionStreamer.removePacketListener(SessionRecorder::record)
                    context.stopService(Intent(context, MotionSensorService::class.java))
                    val session = SessionRecorder.finalize()
                    if (session != null) {
                        store.save(session)
                        savedCount = store.list().size
                        lastSaved = "Saved ${session.summary.durationMs / 1000}s · ${session.summary.sampleCount} samples"
                        mode = WatchMode.Summary(session)
                    } else {
                        mode = WatchMode.Idle
                    }
                }) {
                    Text("Save & stop")
                }
            }

            is WatchMode.Summary -> {
                val s = m.session.summary
                Text(text = "Session saved", style = MaterialTheme.typography.title2)
                Text(text = formatDuration((s.durationMs / 1000).toInt()), style = MaterialTheme.typography.title1)
                Text(text = "${s.sampleCount} samples · ${s.repCount} reps", style = MaterialTheme.typography.body2)
                Text(
                    text = "Avg %.1f m/s² · peak %d °/s".format(s.avgAccelMagnitude, s.peakGyroMagnitude.toInt()),
                    style = MaterialTheme.typography.body2,
                )
                Spacer(modifier = Modifier.height(12.dp))
                Button(onClick = { mode = WatchMode.Idle }) {
                    Text("Done")
                }
                Button(onClick = {
                    store.delete(m.session.summary.id)
                    savedCount = store.list().size
                    lastSaved = null
                    mode = WatchMode.Idle
                }) {
                    Text("Delete")
                }
            }
        }
    }
}

private fun formatDuration(totalSeconds: Int): String =
    "%02d:%02d".format(totalSeconds / 60, totalSeconds % 60)

private fun isServiceRunning(context: Context): Boolean {
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    return manager.getRunningServices(Int.MAX_VALUE).any {
        it.service.className == MotionSensorService::class.java.name
    }
}
