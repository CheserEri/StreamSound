package com.streamsound.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.unit.dp
import com.moriafly.salt.ui.*
import com.streamsound.ui.component.AppIcons
import com.streamsound.ui.component.TrackItem

@OptIn(UnstableSaltUiApi::class)
@Composable
fun QueueScreen() {
    val queue by com.streamsound.store.PlayerStateFlow.queue.collectAsState()
    val currentIndex by com.streamsound.store.PlayerStateFlow.currentIndex.collectAsState()

    BasicScreenBox(title = "播放队列") {
        if (queue.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "队列为空", color = SaltTheme.colors.subText)
            }
        } else {
            com.moriafly.salt.ui.lazy.LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(vertical = SaltDimens.RoundedColumnInListEdgePadding)
            ) {
                items(queue.size) { index ->
                    val track = queue[index]
                    val isCurrentTrack = index == currentIndex
                    RoundedColumn(type = RoundedColumnType.InList) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(modifier = Modifier.weight(1f)) {
                                TrackItem(
                                    track = track,
                                    isActive = isCurrentTrack,
                                    onClick = {
                                        com.streamsound.store.PlayerStateFlow.setQueue(queue, index)
                                    }
                                )
                            }
                            Icon(
                                painter = rememberVectorPainter(AppIcons.Delete),
                                contentDescription = "删除",
                                tint = Color(0xFFFF4444),
                                modifier = Modifier
                                    .size(40.dp)
                                    .padding(8.dp)
                                    .noRippleClickable {
                                        com.streamsound.store.PlayerStateFlow.removeFromQueue(index)
                                    }
                            )
                        }
                    }
                }
                item { Spacer(Modifier.windowInsetsBottomHeight(WindowInsets.safeMainCompat)) }
            }
        }
    }
}
