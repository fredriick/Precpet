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

@androidx.compose.runtime.Composable
fun WatchScreen() {
    val context = LocalContext.current
    var streaming by remember { mutableStateOf(isServiceRunning(context)) }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(text = "Precept", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = if (streaming) "Streaming motion — keep your phone in range" else "Standby",
            style = MaterialTheme.typography.body2,
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = {
                streaming = !streaming
                if (streaming) {
                    context.startForegroundService(Intent(context, MotionSensorService::class.java))
                } else {
                    context.stopService(Intent(context, MotionSensorService::class.java))
                }
            },
        ) {
            Text(if (streaming) "Stop" else "Start")
        }
    }
}

private fun isServiceRunning(context: Context): Boolean {
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    return manager.getRunningServices(Int.MAX_VALUE).any {
        it.service.className == MotionSensorService::class.java.name
    }
}
