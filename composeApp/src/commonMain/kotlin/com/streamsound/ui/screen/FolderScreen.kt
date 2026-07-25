package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.streamsound.model.TrackListItem
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.LibraryApi
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.*
import com.streamsound.ui.theme.StreamSoundColors

/**
 * 文件夹内歌曲列表（分页加载）
 */
@Composable
fun FolderScreen(
    folderId: Int,
    folderName: String
) {
    var tracks by remember { mutableStateOf<List<TrackListItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var isLoadingMore by remember { mutableStateOf(false) }
    var hasMore by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val currentIndex by PlayerStateFlow.currentIndex.collectAsState()
    val queue by PlayerStateFlow.queue.collectAsState()
    val navBackStack = com.streamsound.navigation.LocalNavBackStack.current

    val pageSize = 50

    suspend fun loadTracks(offset: Int) {
        try {
            val response = LibraryApi.getTracks(folderId, limit = pageSize, offset = offset)
            tracks = if (offset == 0) response.data else tracks + response.data
            hasMore = response.pagination.hasMore
        } catch (e: Exception) {
            if (offset == 0) error = e.message
        }
    }

    LaunchedEffect(folderId) {
        loadTracks(0)
        isLoading = false
    }

    GlassScreen(
        title = folderName,
        subtitle = if (!isLoading && error == null) "${tracks.size} 首" else null,
        showBack = true
    ) {
        when {
            isLoading -> LoadingState(text = "正在加载歌曲...")
            error != null -> Box(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                GlassBanner(text = error ?: "加载失败", type = GlassBannerType.Error)
            }
            tracks.isEmpty() -> EmptyState(
                icon = AppIcons.MusicNote,
                title = "文件夹为空",
                hint = "该文件夹下没有歌曲"
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(top = 4.dp, bottom = chromeBottomSpace)
            ) {
                items(tracks.size) { index ->
                    val track = tracks[index]
                    TrackItem(
                        track = track,
                        isActive = queue.getOrNull(currentIndex)?.id == track.id,
                        onClick = {
                            PlayerStateFlow.setQueue(tracks, index)
                            navBackStack.add(ScreenRoute.Player(track.id))
                        }
                    )
                    // 滚动接近末尾时分页加载
                    if (index >= tracks.size - 5 && hasMore && !isLoadingMore) {
                        LaunchedEffect(index) {
                            isLoadingMore = true
                            loadTracks(tracks.size)
                            isLoadingMore = false
                        }
                    }
                }

                if (isLoadingMore) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth().padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(
                                color = StreamSoundColors.accent,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
