package com.streamsound.ui.component

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.streamsound.ui.theme.StreamSoundColors

/**
 * 播放/暂停切换按钮：暂停态为深色玻璃圆角方块，播放态渐变为天蓝胶囊。
 */
@Composable
fun AnimatedPlayButton(
    isPlaying: Boolean,
    onClick: () -> Unit,
    size: Dp = 68.dp,
    modifier: Modifier = Modifier
) {
    val progress by animateFloatAsState(
        targetValue = if (isPlaying) 1f else 0f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "playBtnProgress"
    )

    val cornerRadius = lerp(22f, 50f, progress)
    val bgColor = lerp(StreamSoundColors.playButtonPaused, StreamSoundColors.accent, progress)
    val shape = RoundedCornerShape(cornerRadius.dp)

    Box(
        modifier = modifier
            .size(size)
            .clip(shape)
            .background(
                Brush.linearGradient(
                    listOf(
                        bgColor,
                        lerp(StreamSoundColors.playButtonPaused, StreamSoundColors.accentDeep, progress)
                    )
                )
            )
            .border(
                1.dp,
                lerp(
                    StreamSoundColors.glassBorderLight,
                    StreamSoundColors.accentDeep.copy(alpha = 0.6f),
                    progress
                ),
                shape
            )
            .noRippleClickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Box {
            Icon(
                imageVector = AppIcons.Play,
                contentDescription = "播放",
                tint = StreamSoundColors.textPrimary,
                modifier = Modifier
                    .size(size / 2)
                    .graphicsLayer {
                        alpha = 1f - progress
                        scaleX = 1f - progress * 0.2f
                        scaleY = 1f - progress * 0.2f
                    }
            )
            Icon(
                imageVector = AppIcons.Pause,
                contentDescription = "暂停",
                tint = Color(0xFF06202F),
                modifier = Modifier
                    .size(size / 2)
                    .graphicsLayer {
                        alpha = progress
                        scaleX = 0.8f + progress * 0.2f
                        scaleY = 0.8f + progress * 0.2f
                    }
            )
        }
    }
}

private fun lerp(a: Float, b: Float, t: Float): Float = a + (b - a) * t
private fun lerp(a: Color, b: Color, t: Float): Color = Color(
    red = lerp(a.red, b.red, t),
    green = lerp(a.green, b.green, t),
    blue = lerp(a.blue, b.blue, t),
    alpha = lerp(a.alpha, b.alpha, t)
)
