package com.streamsound

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.LocalOverscrollFactory
import androidx.compose.runtime.CompositionLocalProvider
import com.moriafly.salt.ui.UnstableSaltUiApi
import com.moriafly.salt.ui.ext.edgeToEdge
import com.moriafly.salt.ui.gestures.cupertino.CupertinoOverscrollEffectFactory
import com.moriafly.salt.ui.util.WindowUtil
import com.streamsound.playback.PlayerConnector

class MainActivity : ComponentActivity() {
    @OptIn(UnstableSaltUiApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        edgeToEdge()
        super.onCreate(savedInstanceState)
        WindowUtil.setStatusBarForegroundColor(window, WindowUtil.BarColor.Black)

        // Connect to MediaSession service
        PlayerConnector.connect(this)

        setContent {
            CompositionLocalProvider(
                LocalOverscrollFactory provides CupertinoOverscrollEffectFactory()
            ) {
                App()
            }
        }
    }

    override fun onDestroy() {
        PlayerConnector.disconnect()
        super.onDestroy()
    }
}
