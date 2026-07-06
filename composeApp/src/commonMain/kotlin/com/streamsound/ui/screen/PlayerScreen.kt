package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moriafly.salt.ui.*
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

@OptIn(UnstableSaltUiApi::class)
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

    LaunchedEffect(trackId) {
        try {
            trackDetail = LibraryApi.getTrackDetail(trackId)
            reportPlayHistory(trackId)
        } catch (_: Exception) {}
    }

    GradientBackground(
        colors = generatePlayerGradient(trackDetail?.coverDominantColor)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
                .windowInsetsPadding(WindowInsets.safeMainCompat.only(WindowInsetsSides.Horizontal + WindowInsetsSides.Top)),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Top bar
            Row(
                modifier = Modifier.fillMaxWidth().height(56.dp).padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    painter = rememberVectorPainter(AppIcons.ChevronDown),
                    contentDescription = "Close",
                    tint = Color.White,
                    modifier = Modifier.size(40.dp).noRippleClickable {
                        navBackStack.removeLastOrNull()
                    }.padding(8.dp)
                )
                Spacer(Modifier.weight(1f))
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = currentTrack?.title ?: "",
                        color = StreamSoundColors.playerText,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1
                    )
                    Text(
                        text = currentTrack?.artist ?: "",
                        color = StreamSoundColors.playerHeaderSubtitle,
                        fontSize = 12.sp,
                        maxLines = 1
                    )
                }
                Spacer(Modifier.weight(1f))
                Icon(
                    painter = rememberVectorPainter(AppIcons.Queue),
                    contentDescription = "Queue",
                    tint = Color.White,
                    modifier = Modifier.size(40.dp).noRippleClickable {
                        navBackStack.add(ScreenRoute.Queue)
                    }.padding(8.dp)
                )
            }

            Spacer(Modifier.height(16.dp))

            // Cover / Lyrics toggle area
            Box(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                if (showLyrics) {
                    LyricsView(
                        lyrics = trackDetail?.lyrics,
                        size = lyricsSize,
                        onLinePress = { time -> PlayerStateFlow.seekTo(time) }
                    )
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        DiscCover(
                            trackId = currentTrack?.id ?: 0,
                            hasCover = currentTrack?.hasCover ?: false,
                            size = 280.dp,
                            isPlaying = isPlaying,
                            dominantColor = trackDetail?.coverDominantColor
                        )
                        Spacer(Modifier.height(24.dp))
                        // Tap to show lyrics
                        Text(
                            text = "点击切换歌词",
                            color = StreamSoundColors.playerTextMuted,
                            fontSize = 13.sp,
                            modifier = Modifier.noRippleClickable { showLyrics = true }
                        )
                    }
                }

                if (showLyrics) {
                    Text(
                        text = "点击切换封面",
                        color = StreamSoundColors.playerTextMuted,
                        fontSize = 13.sp,
                        modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 8.dp)
                            .noRippleClickable { showLyrics = false }
                    )
                }
            }

            // Track info
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = currentTrack?.title ?: "",
                            color = StreamSoundColors.playerText,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                        Text(
                            text = currentTrack?.artist ?: "",
                            color = StreamSoundColors.playerTextSecondary,
                            fontSize = 15.sp,
                            maxLines = 1
                        )
                    }
                    currentTrack?.let { track ->
                        AnimatedHeartButton(
                            trackId = track.id,
                            initialFavorited = trackDetail?.isFavorited ?: false,
                            size = 28.dp
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Progress slider
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp)) {
                GlowSlider(
                    value = progress,
                    maximumValue = duration,
                    onSeek = { PlayerStateFlow.seekTo(it) },
                    activeColor = StreamSoundColors.sliderActive,
                    inactiveColor = StreamSoundColors.sliderInactive
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

            Spacer(Modifier.height(16.dp))

            // Controls
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Play mode
                val modeIcon = when (mode) {
                    PlayMode.SEQUENTIAL -> AppIcons.Repeat
                    PlayMode.SHUFFLE -> AppIcons.Shuffle
                    PlayMode.REPEAT -> AppIcons.RepeatOne
                }
                Icon(
                    painter = rememberVectorPainter(modeIcon),
                    contentDescription = "Mode",
                    tint = StreamSoundColors.playerTextSecondary,
                    modifier = Modifier.size(28.dp).noRippleClickable {
                        PlayerStateFlow.toggleMode()
                    }
                )

                // Previous
                Icon(
                    painter = rememberVectorPainter(AppIcons.SkipPrevious),
                    contentDescription = "Previous",
                    tint = Color.White,
                    modifier = Modifier.size(36.dp).noRippleClickable {
                        PlayerStateFlow.skipToPrevious()
                    }
                )

                // Play/Pause
                AnimatedPlayButton(
                    isPlaying = isPlaying,
                    onClick = {
                        if (isPlaying) PlayerStateFlow.pause() else PlayerStateFlow.play()
                    },
                    size = 68.dp
                )

                // Next
                Icon(
                    painter = rememberVectorPainter(AppIcons.SkipNext),
                    contentDescription = "Next",
                    tint = Color.White,
                    modifier = Modifier.size(36.dp).noRippleClickable {
                        PlayerStateFlow.skipToNext()
                    }
                )

                // Queue
                Icon(
                    painter = rememberVectorPainter(AppIcons.Queue),
                    contentDescription = "Queue",
                    tint = StreamSoundColors.playerTextSecondary,
                    modifier = Modifier.size(28.dp).noRippleClickable {
                        navBackStack.add(ScreenRoute.Queue)
                    }
                )
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}
