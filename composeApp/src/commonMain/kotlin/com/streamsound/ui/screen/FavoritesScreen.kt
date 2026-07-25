package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.streamsound.model.FavoriteTrack
import com.streamsound.model.TrackListItem
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.FavoritesApi
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.*

/**
 * 收藏 Tab
 */
@Composable
fun FavoritesScreen() {
    val navBackStack = LocalNavBackStack.current
    var favorites by remember { mutableStateOf<List<FavoriteTrack>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val currentIndex by PlayerStateFlow.currentIndex.collectAsState()
    val queue by PlayerStateFlow.queue.collectAsState()

    LaunchedEffect(Unit) {
        try {
            favorites = FavoritesApi.getFavorites()
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    GlassScreen {
        Column(modifier = Modifier.fillMaxSize()) {
            Spacer(Modifier.height(12.dp))
            LargeTitle(
                title = "我的收藏",
                subtitle = if (!isLoading && error == null) "${favorites.size} 首" else null
            )
            Spacer(Modifier.height(12.dp))

            when {
                isLoading -> LoadingState(text = "加载中...")
                error != null -> Box(
                    modifier = Modifier.fillMaxSize().padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    GlassBanner(text = error ?: "加载失败", type = GlassBannerType.Error)
                }
                favorites.isEmpty() -> EmptyState(
                    icon = AppIcons.HeartOutline,
                    title = "暂无收藏",
                    hint = "在播放器里点红心收藏喜欢的歌"
                )
                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 12.dp)
                ) {
                    items(favorites.size) { index ->
                        val fav = favorites[index]
                        val trackItem = TrackListItem(
                            id = fav.id,
                            title = fav.title,
                            artist = fav.artist,
                            album = fav.album,
                            duration = fav.duration,
                            hasCover = fav.hasCover,
                            hasLyrics = fav.hasLyrics,
                            folderId = fav.folderId
                        )
                        TrackItem(
                            track = trackItem,
                            isActive = queue.getOrNull(currentIndex)?.id == fav.id,
                            onClick = {
                                val allTracks = favorites.map {
                                    TrackListItem(it.id, it.title, it.artist, it.album, it.duration, it.hasCover, it.hasLyrics, it.folderId)
                                }
                                PlayerStateFlow.setQueue(allTracks, index)
                                navBackStack.add(ScreenRoute.Player(fav.id))
                            }
                        )
                    }
                    item { Spacer(Modifier.height(chromeBottomSpace)) }
                }
            }
        }
    }
}
