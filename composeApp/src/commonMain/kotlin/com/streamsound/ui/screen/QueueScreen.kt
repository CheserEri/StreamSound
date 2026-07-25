package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.streamsound.store.PlayerStateFlow
import com.streamsound.ui.component.*
import com.streamsound.ui.theme.StreamSoundColors

/**
 * 播放队列
 */
@Composable
fun QueueScreen() {
    val queue by PlayerStateFlow.queue.collectAsState()
    val currentIndex by PlayerStateFlow.currentIndex.collectAsState()

    GlassScreen(
        title = "播放队列",
        subtitle = if (queue.isNotEmpty()) "${queue.size} 首" else null,
        showBack = true
    ) {
        if (queue.isEmpty()) {
            EmptyState(
                icon = AppIcons.Queue,
                title = "队列为空",
                hint = "去音乐库挑几首歌吧"
            )
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(top = 4.dp, bottom = chromeBottomSpace)
            ) {
                items(queue.size) { index ->
                    val track = queue[index]
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(modifier = Modifier.weight(1f)) {
                            TrackItem(
                                track = track,
                                isActive = index == currentIndex,
                                onClick = {
                                    PlayerStateFlow.setQueue(queue, index)
                                }
                            )
                        }
                        Icon(
                            imageVector = AppIcons.Close,
                            contentDescription = "从队列移除",
                            tint = StreamSoundColors.textMuted,
                            modifier = Modifier
                                .padding(end = 14.dp)
                                .size(32.dp)
                                .noRippleClickable {
                                    PlayerStateFlow.removeFromQueue(index)
                                }
                                .padding(6.dp)
                        )
                    }
                }
            }
        }
    }
}
