package com.streamsound.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.streamsound.model.TrackListItem
import com.streamsound.ui.theme.StreamSoundColors
import com.streamsound.util.formatDuration

/**
 * 歌曲列表行 —— 液态玻璃深蓝风格。
 *
 * @param subtitle 副标题，默认显示艺术家；历史页等场景可传入 "艺术家 · 3 分钟前"
 */
@Composable
fun TrackItem(
    track: TrackListItem,
    isActive: Boolean = false,
    subtitle: String? = null,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(14.dp)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 2.dp)
            .clip(shape)
            .background(if (isActive) StreamSoundColors.activeSurface else androidx.compose.ui.graphics.Color.Transparent)
            .noRippleClickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // 正在播放指示条
        Box(
            modifier = Modifier
                .width(3.dp)
                .height(40.dp)
                .clip(RoundedCornerShape(1.5.dp))
                .background(
                    if (isActive) StreamSoundColors.accent
                    else androidx.compose.ui.graphics.Color.Transparent
                )
        )
        Spacer(Modifier.width(9.dp))

        CoverImage(
            trackId = track.id,
            hasCover = track.hasCover,
            size = 46.dp
        )

        Spacer(Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track.title,
                color = if (isActive) StreamSoundColors.accent else StreamSoundColors.textPrimary,
                fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal,
                fontSize = 15.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = subtitle ?: track.artist,
                color = StreamSoundColors.textMuted,
                fontSize = 13.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        Spacer(Modifier.width(8.dp))

        Text(
            text = formatDuration(track.duration),
            color = StreamSoundColors.textMuted,
            fontSize = 12.sp
        )
    }
}
