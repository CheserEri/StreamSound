package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.moriafly.salt.ui.*
import com.streamsound.model.TrackListItem
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.LibraryApi
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.MiniPlayer
import com.streamsound.ui.component.TrackItem

@OptIn(UnstableSaltUiApi::class)
@Composable
fun FolderScreen(
    folderId: Int,
    folderName: String
) {
    val navBackStack = LocalNavBackStack.current
    var tracks by remember { mutableStateOf<List<TrackListItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var isLoadingMore by remember { mutableStateOf(false) }
    var hasMore by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val currentIndex by PlayerStateFlow.currentIndex.collectAsState()
    val queue by PlayerStateFlow.queue.collectAsState()

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

    Box(modifier = Modifier.fillMaxSize()) {
        BasicScreenBox(title = folderName) {
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = "加载中...", color = SaltTheme.colors.subText)
                }
                return@BasicScreenBox
            }

            error?.let {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = it, color = SaltTheme.colors.subText)
                }
                return@BasicScreenBox
            }

            com.moriafly.salt.ui.lazy.LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(vertical = SaltDimens.RoundedColumnInListEdgePadding)
            ) {
                items(tracks.size) { index ->
                    val track = tracks[index]
                    val isCurrentTrack = queue.getOrNull(currentIndex)?.id == track.id
                    RoundedColumn(type = RoundedColumnType.InList) {
                        TrackItem(
                            track = track,
                            isActive = isCurrentTrack,
                            onClick = {
                                PlayerStateFlow.setQueue(tracks, index)
                                navBackStack.add(ScreenRoute.Player(track.id))
                            }
                        )
                    }
                    // Load more when near end
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
                            Text(text = "加载更多...", color = SaltTheme.colors.subText)
                        }
                    }
                }

                item { Spacer(Modifier.windowInsetsBottomHeight(WindowInsets.safeMainCompat)) }
            }
        }

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
