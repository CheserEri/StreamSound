package com.streamsound.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Icon
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.theme.StreamSoundColors

/**
 * 全局悬浮迷你播放器 —— 液态玻璃胶囊。
 * 悬浮于底部 TabBar 之上，点击主体进入全屏播放器。
 */
@Composable
fun MiniPlayer(
    onNavigateToPlayer: () -> Unit,
    onNavigateToQueue: () -> Unit,
    modifier: Modifier = Modifier
) {
    val queue by PlayerStateFlow.queue.collectAsState()
    val currentIndex by PlayerStateFlow.currentIndex.collectAsState()
    val isPlaying by PlayerStateFlow.isPlaying.collectAsState()
    val progress by PlayerStateFlow.progress.collectAsState()
    val duration by PlayerStateFlow.duration.collectAsState()

    val currentTrack = queue.getOrNull(currentIndex) ?: return

    val progressFraction =
        if (duration > 0) (progress / duration).coerceIn(0.0, 1.0).toFloat() else 0f

    val shape = RoundedCornerShape(20.dp)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
            .clip(shape)
            .background(StreamSoundColors.glassSurfaceStrong)
            .border(1.dp, StreamSoundColors.accent.copy(alpha = 0.22f), shape)
    ) {
        // 顶部进度细条
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(2.5.dp)
                .background(StreamSoundColors.sliderInactive.copy(alpha = 0.6f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(progressFraction)
                    .background(StreamSoundColors.accent)
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .noRippleClickable(onClick = onNavigateToPlayer)
                .padding(horizontal = 12.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CoverImage(
                trackId = currentTrack.id,
                hasCover = currentTrack.hasCover,
                size = 42.dp,
                borderRadius = 21.dp
            )

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = currentTrack.title,
                    color = StreamSoundColors.textPrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = currentTrack.artist,
                    color = StreamSoundColors.textSecondary,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            AnimatedPlayButton(
                isPlaying = isPlaying,
                onClick = {
                    if (isPlaying) PlayerStateFlow.pause() else PlayerStateFlow.play()
                },
                size = 38.dp
            )

            Spacer(Modifier.width(6.dp))

            Icon(
                imageVector = AppIcons.Queue,
                contentDescription = "播放队列",
                tint = StreamSoundColors.textSecondary,
                modifier = Modifier
                    .size(38.dp)
                    .noRippleClickable(onClick = onNavigateToQueue)
                    .padding(8.dp)
            )
        }
    }
}
