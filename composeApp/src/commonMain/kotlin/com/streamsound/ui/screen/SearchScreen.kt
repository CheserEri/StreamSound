package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.CircularProgressIndicator
import androidx.compose.material.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.streamsound.model.SearchResult
import com.streamsound.model.TrackListItem
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.SearchApi
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.*
import com.streamsound.ui.theme.StreamSoundColors
import kotlinx.coroutines.delay

/**
 * 搜索 Tab：300ms 防抖实时搜索
 */
@Composable
fun SearchScreen() {
    val navBackStack = LocalNavBackStack.current
    var query by remember { mutableStateOf("") }
    var result by remember { mutableStateOf<SearchResult?>(null) }
    var isSearching by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    // 输入防抖，实时搜索
    LaunchedEffect(query) {
        val q = query.trim()
        if (q.isEmpty()) {
            result = null
            error = null
            isSearching = false
            return@LaunchedEffect
        }
        isSearching = true
        delay(300)
        try {
            result = SearchApi.search(q)
            error = null
        } catch (e: Exception) {
            error = e.message
        } finally {
            isSearching = false
        }
    }

    GlassScreen {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(Modifier.height(12.dp))
            LargeTitle(title = "搜索", subtitle = "歌曲、艺术家、专辑")

            Spacer(Modifier.height(18.dp))

            // 搜索框（带清除按钮）
            Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                GlassTextField(
                    value = query,
                    onValueChange = { query = it },
                    hint = "搜索歌曲、艺术家、专辑",
                    leadingIcon = AppIcons.Search
                )
                if (query.isNotEmpty()) {
                    Icon(
                        imageVector = AppIcons.Close,
                        contentDescription = "清空",
                        tint = StreamSoundColors.textMuted,
                        modifier = Modifier
                            .align(Alignment.CenterEnd)
                            .padding(end = 12.dp)
                            .size(20.dp)
                            .noRippleClickable { query = "" }
                    )
                }
            }

            error?.let {
                Spacer(Modifier.height(16.dp))
                GlassBanner(
                    text = it,
                    type = GlassBannerType.Error,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }

            when {
                query.isBlank() -> {
                    EmptyState(
                        icon = AppIcons.Search,
                        title = "输入关键词开始搜索",
                        hint = "支持歌曲名、艺术家、专辑",
                        modifier = Modifier.fillMaxWidth().height(320.dp)
                    )
                }
                isSearching && result == null -> {
                    LoadingState(
                        modifier = Modifier.fillMaxWidth().height(280.dp),
                        text = "搜索中..."
                    )
                }
                result != null -> {
                    val r = result!!
                    val isEmpty = r.tracks.isEmpty() && r.artists.isEmpty() && r.albums.isEmpty()
                    if (isEmpty) {
                        EmptyState(
                            icon = AppIcons.MusicNote,
                            title = "未找到 \"$query\" 相关内容",
                            hint = "换个关键词试试",
                            modifier = Modifier.fillMaxWidth().height(320.dp)
                        )
                    } else {
                        if (r.tracks.isNotEmpty()) {
                            SectionTitle(text = "歌曲 (${r.tracks.size})")
                            r.tracks.forEach { track ->
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

                        if (r.artists.isNotEmpty()) {
                            SectionTitle(text = "艺术家 (${r.artists.size})")
                            GlassCard(modifier = Modifier.padding(horizontal = 16.dp)) {
                                r.artists.forEachIndexed { index, artist ->
                                    if (index > 0) GlassDivider()
                                    GlassListItem(
                                        title = artist.name,
                                        subtitle = "${artist.trackCount} 首歌曲",
                                        leadingIcon = AppIcons.Person
                                    )
                                }
                            }
                        }

                        if (r.albums.isNotEmpty()) {
                            SectionTitle(text = "专辑 (${r.albums.size})")
                            GlassCard(modifier = Modifier.padding(horizontal = 16.dp)) {
                                r.albums.forEachIndexed { index, album ->
                                    if (index > 0) GlassDivider()
                                    GlassListItem(
                                        title = album.name,
                                        subtitle = album.artist ?: "未知艺术家",
                                        leadingIcon = AppIcons.Album
                                    )
                                }
                            }
                        }
                    }
                }
            }

            if (isSearching && result != null) {
                Spacer(Modifier.height(12.dp))
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(
                        color = StreamSoundColors.accent,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(Modifier.height(chromeBottomSpace))
        }
    }
}
