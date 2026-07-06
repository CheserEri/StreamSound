package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.moriafly.salt.ui.*
import com.streamsound.model.HistoryTrack
import com.streamsound.model.TrackListItem
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.HistoryApi
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.MiniPlayer
import com.streamsound.ui.component.TrackItem

@OptIn(UnstableSaltUiApi::class)
@Composable
fun HistoryScreen() {
    val navBackStack = LocalNavBackStack.current
    var history by remember { mutableStateOf<List<HistoryTrack>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            history = HistoryApi.getHistory()
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        BasicScreenBox(title = "播放历史") {
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = "加载中...", color = SaltTheme.colors.subText)
                }
            }

            error?.let {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = it, color = SaltTheme.colors.subText)
                }
            }

            if (!isLoading && error == null) {
                if (history.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = "暂无播放记录", color = SaltTheme.colors.subText)
                    }
                } else {
                    com.moriafly.salt.ui.lazy.LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(vertical = SaltDimens.RoundedColumnInListEdgePadding)
                    ) {
                        items(history.size) { index ->
                            val item = history[index]
                            val trackItem = TrackListItem(
                                id = item.id,
                                title = item.title,
                                artist = item.artist,
                                album = item.album,
                                duration = item.duration,
                                hasCover = item.hasCover,
                                hasLyrics = item.hasLyrics,
                                folderId = item.folderId
                            )
                            RoundedColumn(type = RoundedColumnType.InList) {
                                TrackItem(
                                    track = trackItem,
                                    onClick = {
                                        val allTracks = history.map {
                                            TrackListItem(it.id, it.title, it.artist, it.album, it.duration, it.hasCover, it.hasLyrics, it.folderId)
                                        }
                                        PlayerStateFlow.setQueue(allTracks, index)
                                        navBackStack.add(ScreenRoute.Player(item.id))
                                    }
                                )
                            }
                        }
                        item { Spacer(Modifier.windowInsetsBottomHeight(WindowInsets.safeMainCompat)) }
                    }
                }
            }
        }

        val queue by PlayerStateFlow.queue.collectAsState()
        if (queue.isNotEmpty()) {
            MiniPlayer(
                onNavigateToPlayer = {
                    navBackStack.add(ScreenRoute.Player(PlayerStateFlow.currentTrack?.id ?: 0))
                },
                onNavigateToQueue = { navBackStack.add(ScreenRoute.Queue) },
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }
    }
}
