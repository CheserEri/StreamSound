package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.moriafly.salt.ui.*
import com.streamsound.model.FavoriteTrack
import com.streamsound.model.TrackListItem
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.FavoritesApi
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.MiniPlayer
import com.streamsound.ui.component.TrackItem

@OptIn(UnstableSaltUiApi::class)
@Composable
fun FavoritesScreen() {
    val navBackStack = LocalNavBackStack.current
    var favorites by remember { mutableStateOf<List<FavoriteTrack>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            favorites = FavoritesApi.getFavorites()
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        BasicScreenBox(title = "我的收藏") {
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
                if (favorites.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = "暂无收藏", color = SaltTheme.colors.subText)
                    }
                } else {
                    com.moriafly.salt.ui.lazy.LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(vertical = SaltDimens.RoundedColumnInListEdgePadding)
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
                            RoundedColumn(type = RoundedColumnType.InList) {
                                TrackItem(
                                    track = trackItem,
                                    onClick = {
                                        val allTracks = favorites.map {
                                            TrackListItem(it.id, it.title, it.artist, it.album, it.duration, it.hasCover, it.hasLyrics, it.folderId)
                                        }
                                        PlayerStateFlow.setQueue(allTracks, index)
                                        navBackStack.add(ScreenRoute.Player(fav.id))
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
