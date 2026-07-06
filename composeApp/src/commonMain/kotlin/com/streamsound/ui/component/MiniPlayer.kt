package com.streamsound.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moriafly.salt.ui.Text
import com.moriafly.salt.ui.noRippleClickable
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.theme.StreamSoundColors

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

    val progressFraction = if (duration > 0) (progress / duration).coerceIn(0.0, 1.0).toFloat() else 0f

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(Color(0xFF1E1E1E))
    ) {
        // Progress bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(3.dp)
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
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CoverImage(
                trackId = currentTrack.id,
                hasCover = currentTrack.hasCover,
                size = 48.dp,
                borderRadius = 24.dp
            )

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = currentTrack.title,
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = currentTrack.artist,
                    color = Color(0xFF888888),
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            AnimatedPlayButton(
                isPlaying = isPlaying,
                onClick = {
                    if (isPlaying) PlayerStateFlow.pause() else PlayerStateFlow.play()
                },
                size = 40.dp
            )

            Spacer(Modifier.width(8.dp))

            com.moriafly.salt.ui.Icon(
                painter = androidx.compose.ui.graphics.vector.rememberVectorPainter(AppIcons.Queue),
                contentDescription = "Queue",
                tint = Color.White,
                modifier = Modifier
                    .size(24.dp)
                    .noRippleClickable(onClick = onNavigateToQueue)
            )
        }
    }
}
