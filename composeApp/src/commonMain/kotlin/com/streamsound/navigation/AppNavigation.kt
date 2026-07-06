package com.streamsound.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.streamsound.store.AuthStateFlow

val LocalNavBackStack = compositionLocalOf<NavBackStack<ScreenRoute>> {
    error("No NavBackStack provided")
}

@Composable
fun AppNavigation() {
    val isAuthenticated by AuthStateFlow.isAuthenticated.collectAsState()

    val initialRoute = if (isAuthenticated) ScreenRoute.Library else ScreenRoute.Login
    val navBackStack = rememberNavBackStack(initialRoute)

    CompositionLocalProvider(LocalNavBackStack provides navBackStack) {
        NavDisplay(
            backStack = navBackStack,
            onBack = { navBackStack.removeLastOrNull() },
            entryProvider = entryProvider {
                entry<ScreenRoute.Login> {
                    com.streamsound.ui.screen.LoginScreen()
                }
                entry<ScreenRoute.Library> {
                    com.streamsound.ui.screen.LibraryScreen()
                }
                entry<ScreenRoute.Folder> { route ->
                    com.streamsound.ui.screen.FolderScreen(
                        folderId = route.folderId,
                        folderName = route.folderName
                    )
                }
                entry<ScreenRoute.Player> { route ->
                    com.streamsound.ui.screen.PlayerScreen(
                        trackId = route.trackId
                    )
                }
                entry<ScreenRoute.Queue> {
                    com.streamsound.ui.screen.QueueScreen()
                }
                entry<ScreenRoute.Search> {
                    com.streamsound.ui.screen.SearchScreen()
                }
                entry<ScreenRoute.Favorites> {
                    com.streamsound.ui.screen.FavoritesScreen()
                }
                entry<ScreenRoute.History> {
                    com.streamsound.ui.screen.HistoryScreen()
                }
                entry<ScreenRoute.Settings> {
                    com.streamsound.ui.screen.SettingsScreen()
                }
                entry<ScreenRoute.Admin> {
                    com.streamsound.ui.screen.AdminScreen()
                }
            }
        )
    }
}
