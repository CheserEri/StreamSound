package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.moriafly.salt.ui.*
import com.streamsound.model.SearchResult
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.SearchApi
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.MiniPlayer
import com.streamsound.ui.component.TrackItem
import com.streamsound.model.TrackListItem

@OptIn(UnstableSaltUiApi::class)
@Composable
fun SearchScreen() {
    val navBackStack = LocalNavBackStack.current
    var query by remember { mutableStateOf("") }
    var result by remember { mutableStateOf<SearchResult?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxSize()) {
        BasicScreenColumn(title = "搜索") {
            RoundedColumn {
                ItemEdit(
                    text = query,
                    onChange = { query = it },
                    hint = "搜索歌曲、艺术家、专辑"
                )
            }

            RoundedColumn {
                ItemButton(
                    onClick = {
                        if (query.isBlank()) return@ItemButton
                        scope.launch {
                            isLoading = true
                            error = null
                            try {
                                result = SearchApi.search(query)
                            } catch (e: Exception) {
                                error = e.message
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    text = if (isLoading) "搜索中..." else "搜索",
                    enabled = !isLoading && query.isNotBlank()
                )
            }

            error?.let {
                RoundedColumn {
                    ItemInfo(text = it, infoType = ItemInfoType.Error)
                }
            }

            result?.let { searchResult ->
                if (searchResult.tracks.isNotEmpty()) {
                    ItemOuterTitle(text = "歌曲 (${searchResult.tracks.size})")
                    searchResult.tracks.forEach { track ->
                        RoundedColumn(type = RoundedColumnType.InList) {
                            val trackItem = TrackListItem(
                                id = track.id,
                                title = track.title,
                                artist = track.artist,
                                album = track.album,
                                duration = track.duration,
                                hasCover = track.hasCover,
                                hasLyrics = track.hasLyrics,
                                folderId = track.folderId
                            )
                            TrackItem(
                                track = trackItem,
                                onClick = {
                                    PlayerStateFlow.setQueue(listOf(trackItem), 0)
                                    navBackStack.add(ScreenRoute.Player(track.id))
                                }
                            )
                        }
                    }
                }

                if (searchResult.artists.isNotEmpty()) {
                    ItemOuterTitle(text = "艺术家 (${searchResult.artists.size})")
                    searchResult.artists.forEach { artist ->
                        RoundedColumn {
                            Item(
                                onClick = {},
                                text = artist.name,
                                sub = "${artist.trackCount} 首歌曲"
                            )
                        }
                    }
                }

                if (searchResult.albums.isNotEmpty()) {
                    ItemOuterTitle(text = "专辑 (${searchResult.albums.size})")
                    searchResult.albums.forEach { album ->
                        RoundedColumn {
                            Item(
                                onClick = {},
                                text = album.name,
                                sub = album.artist ?: ""
                            )
                        }
                    }
                }

                if (searchResult.tracks.isEmpty() && searchResult.artists.isEmpty() && searchResult.albums.isEmpty()) {
                    RoundedColumn {
                        ItemInfo(text = "未找到结果", infoType = ItemInfoType.Warning)
                    }
                }
            }

            Spacer(Modifier.height(80.dp))
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
