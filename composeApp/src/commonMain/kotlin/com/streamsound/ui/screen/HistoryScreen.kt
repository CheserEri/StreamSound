package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.streamsound.model.HistoryTrack
import com.streamsound.model.TrackListItem
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.HistoryApi
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.*
import com.streamsound.util.formatRelativeTime

/**
 * 播放历史（首页快捷入口进入）
 */
@Composable
fun HistoryScreen() {
    val navBackStack = LocalNavBackStack.current
    var history by remember { mutableStateOf<List<HistoryTrack>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val currentIndex by PlayerStateFlow.currentIndex.collectAsState()
    val queue by PlayerStateFlow.queue.collectAsState()

    LaunchedEffect(Unit) {
        try {
            history = HistoryApi.getHistory()
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    GlassScreen(
        title = "播放历史",
        subtitle = if (!isLoading && error == null) "${history.size} 条记录" else null,
        showBack = true
    ) {
        when {
            isLoading -> LoadingState(text = "加载中...")
            error != null -> Box(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                GlassBanner(text = error ?: "加载失败", type = GlassBannerType.Error)
            }
            history.isEmpty() -> EmptyState(
                icon = AppIcons.Clock,
                title = "暂无播放记录",
                hint = "听过的歌会出现在这里"
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(top = 4.dp, bottom = chromeBottomSpace)
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
                    val timeLabel = formatRelativeTime(item.playedAt)
                    TrackItem(
                        track = trackItem,
                        isActive = queue.getOrNull(currentIndex)?.id == item.id,
                        subtitle = if (timeLabel.isNotEmpty()) "${item.artist} · $timeLabel" else item.artist,
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
        }
    }
}
