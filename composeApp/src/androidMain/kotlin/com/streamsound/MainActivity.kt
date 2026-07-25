package com.streamsound

import android.graphics.Color as AndroidColor
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.streamsound.playback.PlayerConnector

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // 深色背景应用：状态栏使用浅色前景图标
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(AndroidColor.TRANSPARENT)
        )
        super.onCreate(savedInstanceState)

        // Connect to MediaSession service
        PlayerConnector.connect(this)

        setContent {
            App()
        }
    }

    override fun onDestroy() {
        PlayerConnector.disconnect()
        super.onDestroy()
    }
}
