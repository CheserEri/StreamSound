package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material.Icon
import androidx.compose.material.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.streamsound.model.PlayMode
import com.streamsound.model.TrackDetail
import com.streamsound.navigation.LocalNavBackStack
import com.streamsound.navigation.ScreenRoute
import com.streamsound.network.LibraryApi
import com.streamsound.network.LibraryApi.reportPlayHistory
import com.streamsound.store.PlayerStateFlow
import com.streamsound.store.SettingsStateFlow
import com.streamsound.ui.component.*
import com.streamsound.ui.theme.StreamSoundColors
import com.streamsound.util.formatDuration
import com.streamsound.util.generatePlayerGradient

/**
 * 全屏播放器（液态玻璃深蓝）
 */
@Composable
fun PlayerScreen(trackId: Int) {
    val navBackStack = LocalNavBackStack.current
    val queue by PlayerStateFlow.queue.collectAsState()
    val currentIndex by PlayerStateFlow.currentIndex.collectAsState()
    val isPlaying by PlayerStateFlow.isPlaying.collectAsState()
    val progress by PlayerStateFlow.progress.collectAsState()
    val duration by PlayerStateFlow.duration.collectAsState()
    val mode by PlayerStateFlow.mode.collectAsState()
    val lyricsSize by SettingsStateFlow.lyricsSize.collectAsState()

    val currentTrack = queue.getOrNull(currentIndex)
    var trackDetail by remember { mutableStateOf<TrackDetail?>(null) }
    var showLyrics by remember { mutableStateOf(false) }

    // 跟随当前曲目刷新详情（歌词 / 收藏态 / 封面主色）并上报播放历史
    val activeTrackId = currentTrack?.id ?: trackId
    LaunchedEffect(activeTrackId) {
        try {
            trackDetail = LibraryApi.getTrackDetail(activeTrackId)
            reportPlayHistory(activeTrackId)
        } catch (_: Exception) {}
    }

    GradientBackground(
        colors = generatePlayerGradient(trackDetail?.coverDominantColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.safeDrawing),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 顶栏
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = AppIcons.ChevronDown,
                    contentDescription = "收起",
                    tint = StreamSoundColors.playerText,
                    modifier = Modifier
                        .size(40.dp)
                        .noRippleClickable { navBackStack.removeLastOrNull() }
                        .padding(8.dp)
                )
                Spacer(Modifier.weight(1f))
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "正在播放",
                        color = StreamSoundColors.playerHeaderSubtitle,
                        fontSize = 11.sp,
                        letterSpacing = 2.sp
                    )
                    Text(
                        text = trackDetail?.album ?: currentTrack?.album ?: "",
                        color = StreamSoundColors.playerText,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Spacer(Modifier.weight(1f))
                Icon(
                    imageVector = AppIcons.Queue,
                    contentDescription = "播放队列",
                    tint = StreamSoundColors.playerText,
                    modifier = Modifier
                        .size(40.dp)
                        .noRippleClickable { navBackStack.add(ScreenRoute.Queue) }
                        .padding(8.dp)
                )
            }

            // 唱片 / 歌词切换区（点击切换）
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .noRippleClickable { showLyrics = !showLyrics },
                contentAlignment = Alignment.Center
            ) {
                if (showLyrics) {
                    LyricsView(
                        lyrics = trackDetail?.lyrics,
                        size = lyricsSize,
                        onLinePress = { time -> PlayerStateFlow.seekTo(time) }
                    )
                } else {
                    DiscCover(
                        trackId = activeTrackId,
                        hasCover = currentTrack?.hasCover ?: false,
                        size = 280.dp,
                        isPlaying = isPlaying,
                        dominantColor = trackDetail?.coverDominantColor
                    )
                }
            }

            Text(
                text = if (showLyrics) "点击返回封面" else "点击查看歌词",
                color = StreamSoundColors.playerTextMuted,
                fontSize = 12.sp
            )

            Spacer(Modifier.height(14.dp))

            // 曲目信息 + 收藏
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 32.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = currentTrack?.title ?: "",
                        color = StreamSoundColors.playerText,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = currentTrack?.artist ?: "",
                        color = StreamSoundColors.playerTextSecondary,
                        fontSize = 15.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                AnimatedHeartButton(
                    trackId = activeTrackId,
                    initialFavorited = trackDetail?.isFavorited ?: false,
                    size = 28.dp
                )
            }

            Spacer(Modifier.height(14.dp))

            // 进度条
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp)) {
                GlowSlider(
                    value = progress,
                    maximumValue = duration,
                    onSeek = { PlayerStateFlow.seekTo(it) }
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = formatDuration(progress),
                        color = StreamSoundColors.playerTextMuted,
                        fontSize = 12.sp
                    )
                    Text(
                        text = formatDuration(duration),
                        color = StreamSoundColors.playerTextMuted,
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(Modifier.height(14.dp))

            // 控制栏
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 32.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                val modeIcon = when (mode) {
                    PlayMode.SEQUENTIAL -> AppIcons.Repeat
                    PlayMode.SHUFFLE -> AppIcons.Shuffle
                    PlayMode.REPEAT -> AppIcons.RepeatOne
                }
                Icon(
                    imageVector = modeIcon,
                    contentDescription = "播放模式",
                    tint = if (mode == PlayMode.SEQUENTIAL) {
                        StreamSoundColors.playerTextSecondary
                    } else {
                        StreamSoundColors.accent
                    },
                    modifier = Modifier
                        .size(44.dp)
                        .noRippleClickable { PlayerStateFlow.toggleMode() }
                        .padding(9.dp)
                )

                Icon(
                    imageVector = AppIcons.SkipPrevious,
                    contentDescription = "上一首",
                    tint = StreamSoundColors.playerText,
                    modifier = Modifier
                        .size(52.dp)
                        .noRippleClickable { PlayerStateFlow.skipToPrevious() }
                        .padding(8.dp)
                )

                AnimatedPlayButton(
                    isPlaying = isPlaying,
                    onClick = {
                        if (isPlaying) PlayerStateFlow.pause() else PlayerStateFlow.play()
                    },
                    size = 68.dp
                )

                Icon(
                    imageVector = AppIcons.SkipNext,
                    contentDescription = "下一首",
                    tint = StreamSoundColors.playerText,
                    modifier = Modifier
                        .size(52.dp)
                        .noRippleClickable { PlayerStateFlow.skipToNext() }
                        .padding(8.dp)
                )

                Icon(
                    imageVector = AppIcons.Queue,
                    contentDescription = "播放队列",
                    tint = StreamSoundColors.playerTextSecondary,
                    modifier = Modifier
                        .size(44.dp)
                        .noRippleClickable { navBackStack.add(ScreenRoute.Queue) }
                        .padding(9.dp)
                )
            }

            Spacer(Modifier.height(28.dp))
        }
    }
}
