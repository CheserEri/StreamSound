package com.streamsound.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.moriafly.salt.ui.Text
import com.moriafly.salt.ui.noRippleClickable
import com.streamsound.model.TrackListItem
import com.streamsound.ui.theme.StreamSoundColors
import com.streamsound.util.formatDuration

@Composable
fun TrackItem(
    track: TrackListItem,
    isActive: Boolean = false,
    onClick: () -> Unit
) {
    val bgColor = if (isActive) StreamSoundColors.activeBg else Color.Transparent

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(bgColor)
            .noRippleClickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (isActive) {
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .height(48.dp)
                    .background(StreamSoundColors.accent, RoundedCornerShape(1.5.dp))
            )
            Spacer(Modifier.width(8.dp))
        }

        CoverImage(
            trackId = track.id,
            hasCover = track.hasCover,
            size = 48.dp
        )

        Spacer(Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track.title,
                color = if (isActive) StreamSoundColors.accent else Color.White,
                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                fontSize = 15.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = track.artist,
                color = Color(0xFF888888),
                fontSize = 13.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        Text(
            text = formatDuration(track.duration),
            color = Color(0xFF666666),
            fontSize = 13.sp
        )
    }
}
