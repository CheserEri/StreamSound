package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.moriafly.salt.ui.*
import com.streamsound.model.Folder
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.LibraryApi
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.MiniPlayer

@OptIn(UnstableSaltUiApi::class)
@Composable
fun LibraryScreen() {
    val navBackStack = LocalNavBackStack.current
    var folders by remember { mutableStateOf<List<Folder>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            folders = LibraryApi.getFolders()
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        BasicScreenColumn(title = "", showBackBtn = false) {
            ItemOuterLargeTitle(text = "音乐库", sub = "StreamSound")

            RoundedColumn {
                Item(
                    onClick = { navBackStack.add(ScreenRoute.Search) },
                    text = "搜索",
                    iconPainter = null
                )
                Item(
                    onClick = { navBackStack.add(ScreenRoute.Favorites) },
                    text = "我的收藏"
                )
                Item(
                    onClick = { navBackStack.add(ScreenRoute.History) },
                    text = "播放历史"
                )
                Item(
                    onClick = { navBackStack.add(ScreenRoute.Settings) },
                    text = "设置"
                )
            }

            if (isLoading) {
                RoundedColumn {
                    Item(text = "加载中...", onClick = {})
                }
            }

            error?.let {
                RoundedColumn {
                    ItemInfo(text = it, infoType = ItemInfoType.Error)
                }
            }

            if (folders.isNotEmpty()) {
                ItemOuterTitle(text = "文件夹")
                folders.forEach { folder ->
                    RoundedColumn {
                        Item(
                            onClick = {
                                navBackStack.add(ScreenRoute.Folder(folder.id, folder.name))
                            },
                            text = folder.name,
                            sub = "${folder.trackCount} 首"
                        )
                    }
                }
            }

            // Bottom spacer for MiniPlayer
            Spacer(Modifier.height(80.dp))
        }

        // MiniPlayer at bottom
        val queue by PlayerStateFlow.queue.collectAsState()
        if (queue.isNotEmpty()) {
            MiniPlayer(
                onNavigateToPlayer = {
                    navBackStack.add(ScreenRoute.Player(PlayerStateFlow.currentTrack?.id ?: 0))
                },
                onNavigateToQueue = { navBackStack.add(ScreenRoute.Queue) },
                modifier = Modifier.align(androidx.compose.ui.Alignment.BottomCenter)
            )
        }
    }
}
