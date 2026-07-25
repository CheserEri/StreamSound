package com.streamsound.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.streamsound.store.AuthStateFlow
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.AppIcons
import com.streamsound.ui.component.GlassTabBar
import com.streamsound.ui.component.MiniPlayer
import com.streamsound.ui.component.TabItem

val LocalNavBackStack = compositionLocalOf<NavBackStack<ScreenRoute>> {
    error("No NavBackStack provided")
}

/** 底部 Tab 定义 */
private val tabs = listOf(
    TabItem(key = "library", label = "首页", icon = AppIcons.Home),
    TabItem(key = "search", label = "搜索", icon = AppIcons.Search),
    TabItem(key = "favorites", label = "收藏", icon = AppIcons.HeartOutline),
    TabItem(key = "settings", label = "设置", icon = AppIcons.Settings)
)

private fun tabRouteOf(key: String): ScreenRoute = when (key) {
    "search" -> ScreenRoute.Search
    "favorites" -> ScreenRoute.Favorites
    "settings" -> ScreenRoute.Settings
    else -> ScreenRoute.Library
}

private fun tabKeyOf(route: ScreenRoute?): String = when (route) {
    is ScreenRoute.Search -> "search"
    is ScreenRoute.Favorites -> "favorites"
    is ScreenRoute.Settings -> "settings"
    else -> "library"
}

@Composable
fun AppNavigation() {
    val isAuthenticated by AuthStateFlow.isAuthenticated.collectAsState()

    val initialRoute = if (isAuthenticated) ScreenRoute.Library else ScreenRoute.Login
    val navBackStack = rememberNavBackStack(initialRoute)

    CompositionLocalProvider(LocalNavBackStack provides navBackStack) {
        Box(modifier = Modifier.fillMaxSize()) {
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

            // ---- 全局悬浮层：MiniPlayer + 底部 TabBar ----
            // 登录页与全屏播放器不显示
            val currentRoute = navBackStack.lastOrNull()
            val showChrome = currentRoute != null &&
                currentRoute !is ScreenRoute.Login &&
                currentRoute !is ScreenRoute.Player

            if (showChrome) {
                Column(
                    modifier = Modifier.align(Alignment.BottomCenter)
                ) {
                    val queue by PlayerStateFlow.queue.collectAsState()
                    if (queue.isNotEmpty()) {
                        MiniPlayer(
                            onNavigateToPlayer = {
                                navBackStack.add(
                                    ScreenRoute.Player(PlayerStateFlow.currentTrack?.id ?: 0)
                                )
                            },
                            onNavigateToQueue = { navBackStack.add(ScreenRoute.Queue) }
                        )
                        Spacer(Modifier.height(8.dp))
                    }
                    GlassTabBar(
                        tabs = tabs,
                        activeKey = tabKeyOf(navBackStack.firstOrNull()),
                        onSelect = { key ->
                            val route = tabRouteOf(key)
                            // 已在目标 Tab 顶层时不动作，否则清栈切换
                            if (navBackStack.size == 1 && navBackStack.firstOrNull() == route) {
                                return@GlassTabBar
                            }
                            navBackStack.clear()
                            navBackStack.add(route)
                        }
                    )
                }
            }
        }
    }
}
