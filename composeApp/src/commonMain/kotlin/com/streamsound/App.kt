package com.streamsound

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.moriafly.salt.ui.SaltConfigs
import com.moriafly.salt.ui.SaltTheme
import com.streamsound.model.Theme
import com.streamsound.navigation.AppNavigation
import com.streamsound.store.SettingsStateFlow

@Composable
fun App() {
    val theme by SettingsStateFlow.theme.collectAsState()
    SaltTheme(
        configs = SaltConfigs.default(isDarkTheme = theme == Theme.DARK)
    ) {
        AppNavigation()
    }
}
