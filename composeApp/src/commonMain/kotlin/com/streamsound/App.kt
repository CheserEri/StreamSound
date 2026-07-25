package com.streamsound

import androidx.compose.runtime.Composable
import com.streamsound.navigation.AppNavigation

@Composable
fun App() {
    // 液态玻璃深蓝主题为全局唯一主题，无需外层 Theme 包装
    AppNavigation()
}
